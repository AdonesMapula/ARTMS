<?php

namespace App\Services;

use App\Mail\SystemNotificationMail;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class NotificationService
{
    /**
     * Dispatch email execution asynchronously after HTTP response is sent.
     */
    protected static function dispatchAsyncMail(callable $mailCallback): void
    {
        if (function_exists('defer')) {
            defer($mailCallback);
        } else {
            try {
                $mailCallback();
            } catch (\Throwable $e) {
                \Log::error("Async mail execution failed: " . $e->getMessage());
            }
        }
    }

    /**
     * Notify an explicitly resolved collection of User recipients (both In-App DB + Asynchronous Email).
     * Enforces recipient deduplication and idempotency to prevent duplicate notifications.
     */
    public static function notifyRecipients(
        iterable $recipients,
        string $title,
        string $message,
        string $link = '/',
        string $category = 'alert',
        ?string $entityType = null,
        ?int $entityId = null
    ): void {
        $uniqueUsers = collect($recipients)
            ->filter(fn ($u) => $u instanceof User && $u->is_active)
            ->unique('id');

        foreach ($uniqueUsers as $user) {
            self::notifyUser($user, $title, $message, $link, $category, $entityType, $entityId);
        }
    }

    /**
     * Notify a specific User (In-App Database Notification + Email).
     */
    public static function notifyUser(
        User $user,
        string $title,
        string $message,
        string $link = '/',
        string $category = 'alert',
        ?string $entityType = null,
        ?int $entityId = null
    ): void {
        if (! $user || ! $user->is_active) {
            return;
        }

        // Idempotency: Check if an identical notification was created for this user in the last 15 seconds
        $recentDuplicate = DB::table('notifications')
            ->where('notifiable_id', $user->id)
            ->where('notifiable_type', User::class)
            ->where('created_at', '>=', now()->subSeconds(15))
            ->where('data', 'like', '%"title":' . json_encode($title) . '%')
            ->where('data', 'like', '%"message":' . json_encode($message) . '%')
            ->exists();

        if ($recentDuplicate) {
            return;
        }

        $uuid = (string) Str::uuid();
        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
        $fullActionUrl = str_starts_with($link, 'http') ? $link : rtrim($frontendUrl, '/') . '/' . ltrim($link, '/');

        // 1. Create persistent user-owned in-app notification (instant DB insert)
        DB::table('notifications')->insert([
            'id'              => $uuid,
            'type'            => 'App\\Notifications\\SystemNotification',
            'notifiable_type' => User::class,
            'notifiable_id'   => $user->id,
            'data'            => json_encode([
                'notification_id' => $uuid,
                'title'           => $title,
                'message'         => $message,
                'link'            => $link,
                'category'        => $category,
                'entity_type'     => $entityType,
                'entity_id'       => $entityId,
                'created_at'      => now()->toISOString(),
            ]),
            'read_at'         => null,
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        \Log::info("[Notification] Created for User #{$user->id} ({$user->email}): {$title}");

        // 2. Dispatch Email notification asynchronously (non-blocking)
        if ($user->email) {
            self::dispatchAsyncMail(function () use ($user, $title, $message, $fullActionUrl, $category) {
                try {
                    Mail::to($user->email)->send(new SystemNotificationMail($title, $message, $fullActionUrl, $category));
                } catch (\Throwable $e) {
                    \Log::error("Failed to send notification email to {$user->email}: " . $e->getMessage());
                }
            });
        }
    }

    /**
     * Notify all users with specified role(s) (In-App + Email).
     * Reserved strictly for genuine global broadcast alerts.
     */
    public static function notifyRoles(array|string $roles, string $title, string $message, string $link = '/', string $category = 'alert'): void
    {
        $roleList = (array) $roles;
        $users = User::whereIn('role', $roleList)->where('is_active', true)->get();

        foreach ($users as $user) {
            self::notifyUser($user, $title, $message, $link, $category);
        }
    }

    /**
     * Send email directly to an email address (e.g. candidates/applicants) asynchronously.
     */
    public static function notifyEmail(string $email, string $title, string $message, ?string $link = null, string $category = 'alert'): void
    {
        if (! $email) return;

        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
        $fullActionUrl = $link ? (str_starts_with($link, 'http') ? $link : rtrim($frontendUrl, '/') . '/' . ltrim($link, '/')) : null;

        self::dispatchAsyncMail(function () use ($email, $title, $message, $fullActionUrl, $category) {
            try {
                Mail::to($email)->send(new SystemNotificationMail($title, $message, $fullActionUrl, $category));
            } catch (\Throwable $e) {
                \Log::error("Failed to send candidate email to {$email}: " . $e->getMessage());
            }
        });
    }

    /**
     * Send a polite automated screening rejection email to an applicant asynchronously.
     */
    public static function sendScreeningRejectionEmail(\App\Models\Applicant $applicant, ?string $remarks = null): void
    {
        if (! $applicant->email) return;

        $jobTitle = $applicant->jobPosting?->jobLibrary?->job_title
            ?? $applicant->jobPosting?->description
            ?? 'Job Position';

        self::dispatchAsyncMail(function () use ($applicant, $jobTitle, $remarks) {
            try {
                Mail::send('emails.screening_rejection', [
                    'applicant' => $applicant,
                    'job_title' => $jobTitle,
                    'remarks'   => $remarks,
                ], function ($mail) use ($applicant) {
                    $mail->to($applicant->email)
                         ->subject('Application Status Update — ARTMS Recruitment');
                });
            } catch (\Throwable $e) {
                \Log::error("Failed to send screening rejection email to {$applicant->email}: " . $e->getMessage());
            }
        });
    }

    /**
     * Send an AI-recommended alternative role email to an applicant who failed screening asynchronously.
     */
    public static function sendAlternativeRoleRecommendationEmail(\App\Models\Applicant $applicant, \Illuminate\Support\Collection $recommendedJobs, ?string $remarks = null): void
    {
        if (! $applicant->email) return;

        $jobTitle = $applicant->jobPosting?->jobLibrary?->job_title
            ?? $applicant->jobPosting?->description
            ?? 'Job Position';

        self::dispatchAsyncMail(function () use ($applicant, $jobTitle, $remarks, $recommendedJobs) {
            try {
                Mail::send('emails.alternative_role_recommendation', [
                    'applicant' => $applicant,
                    'job_title' => $jobTitle,
                    'remarks'   => $remarks,
                    'recommendedJobs' => $recommendedJobs
                ], function ($mail) use ($applicant) {
                    $mail->to($applicant->email)
                         ->subject('Application Status Update — ARTMS Recruitment');
                });
            } catch (\Throwable $e) {
                \Log::error("Failed to send alternative role recommendation email to {$applicant->email}: " . $e->getMessage());
            }
        });
    }
}
