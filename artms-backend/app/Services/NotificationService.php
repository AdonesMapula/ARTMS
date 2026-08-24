<?php

namespace App\Services;

use App\Mail\CandidateNotificationMail;
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
     * Notify targeted recipients resolved for a specific domain event.
     * Derives exact recipients from entity relationships rather than broad roles.
     */
    public static function notifyEvent(
        string $event,
        mixed $entity = null,
        ?User $actor = null,
        string $title = 'System Notification',
        string $message = '',
        string $link = '/',
        string $category = 'alert'
    ): void {
        $recipients = NotificationRecipientResolver::resolve($event, $entity, $actor);

        self::notifyRecipients($recipients, $title, $message, $link, $category);
    }

    /**
     * Notify an explicit collection or array of User instances (In-App DB + Email).
     */
    public static function notifyRecipients(
        iterable $recipients,
        string $title,
        string $message,
        string $link = '/',
        string $category = 'alert'
    ): void {
        foreach ($recipients as $user) {
            if ($user instanceof User && $user->is_active) {
                self::notifyUser($user, $title, $message, $link, $category);
            }
        }
    }

    /**
     * Notify a specific User (In-App Database Notification + Email).
     * Includes duplicate suppression to prevent spamming within an active window.
     */
    public static function notifyUser(User $user, string $title, string $message, string $link = '/', string $category = 'alert'): void
    {
        if (! $user || ! $user->is_active) {
            return;
        }

        // Idempotency check: prevent exact duplicate notification within 10 seconds
        $recentDuplicate = DB::table('notifications')
            ->where('notifiable_id', $user->id)
            ->where('notifiable_type', User::class)
            ->where('created_at', '>=', now()->subSeconds(10))
            ->where('data', 'like', '%"title":"' . addslashes($title) . '"%')
            ->where('data', 'like', '%"link":"' . addslashes($link) . '"%')
            ->exists();

        if ($recentDuplicate) {
            return;
        }

        $uuid = (string) Str::uuid();
        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
        $fullActionUrl = str_starts_with($link, 'http') ? $link : rtrim($frontendUrl, '/') . '/' . ltrim($link, '/');

        // 1. Create persistent in-app notification (instant DB insert)
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
                'created_at'      => now()->toISOString(),
            ]),
            'read_at'         => null,
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

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
     * Targeted role notification fallback for system administration events.
     * Note: Prefer notifyEvent() for business workflow records.
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
     * Send email directly to an external applicant/candidate asynchronously.
     * Candidate emails never include internal portal/login redirect buttons.
     */
    public static function notifyEmail(string $email, string $title, string $message, ?string $link = null, string $category = 'application'): void
    {
        if (! $email) return;

        // External applicants only view public pages; no internal login buttons are sent
        $publicUrl = ($link && str_starts_with($link, 'http')) ? $link : null;

        self::dispatchAsyncMail(function () use ($email, $title, $message, $publicUrl, $category) {
            try {
                Mail::to($email)->send(new CandidateNotificationMail($title, $message, $publicUrl, $category));
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
