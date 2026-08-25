<?php

namespace App\Services;

use App\Mail\SystemNotificationMail;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class NotificationService
{
    /**
     * Dispatch email execution asynchronously after HTTP response is sent.
     */
    public static function dispatchAsyncMail(callable $mailCallback): void
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
     * Notify an array or Collection of target User recipients (In-App DB + Async Email).
     * The single source of truth for targeted multi-channel notifications.
     *
     * @param iterable<User>|Collection|array $recipients
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
        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
        $fullActionUrl = str_starts_with($link, 'http') ? $link : rtrim($frontendUrl, '/') . '/' . ltrim($link, '/');

        foreach ($recipients as $recipient) {
            if (! ($recipient instanceof User) || ! $recipient->is_active) {
                continue;
            }

            self::notifyUserSingle($recipient, $title, $message, $link, $fullActionUrl, $category, $entityType, $entityId);
        }
    }

    /**
     * Notify a specific single User (In-App DB + Async Email).
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
        if (! $user->is_active) {
            return;
        }

        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
        $fullActionUrl = str_starts_with($link, 'http') ? $link : rtrim($frontendUrl, '/') . '/' . ltrim($link, '/');

        self::notifyUserSingle($user, $title, $message, $link, $fullActionUrl, $category, $entityType, $entityId);
    }

    /**
     * Internal single user dispatch with deduplication check.
     */
    protected static function notifyUserSingle(
        User $user,
        string $title,
        string $message,
        string $link,
        string $fullActionUrl,
        string $category,
        ?string $entityType = null,
        ?int $entityId = null
    ): void {
        $uuid = (string) Str::uuid();

        // 1. Idempotency / Deduplication Check: Check if duplicate notification was sent in last 10 seconds
        $isDuplicate = DB::table('notifications')
            ->where('notifiable_id', $user->id)
            ->where('notifiable_type', User::class)
            ->where('created_at', '>=', now()->subSeconds(10))
            ->where('data', 'like', '%"title":"' . addslashes($title) . '"%')
            ->exists();

        if ($isDuplicate) {
            return;
        }

        // 2. Insert persistent in-app notification owned strictly by this recipient
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

        // 3. Dispatch Email notification asynchronously (non-blocking)
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
     * Notify users with specific role(s) — reserved for global broadcasts only.
     */
    public static function notifyRoles(array|string $roles, string $title, string $message, string $link = '/', string $category = 'alert'): void
    {
        $roleList = (array) $roles;
        $users = User::whereIn('role', $roleList)->where('is_active', true)->get();

        self::notifyRecipients($users, $title, $message, $link, $category);
    }

    /**
     * Send email directly to an email address (e.g. candidates/applicants) asynchronously.
     */
    public static function notifyEmail(string $email, string $title, string $message, ?string $link = null, string $category = 'alert'): void
    {
        if (! $email) {
            return;
        }

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
        if (! $applicant->email) {
            return;
        }

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
     * Send an AI-recommended alternative role email to an applicant asynchronously.
     */
    public static function sendAlternativeRoleRecommendationEmail(\App\Models\Applicant $applicant, \Illuminate\Support\Collection $recommendedJobs, ?string $remarks = null): void
    {
        if (! $applicant->email) {
            return;
        }

        $jobTitle = $applicant->jobPosting?->jobLibrary?->job_title
            ?? $applicant->jobPosting?->description
            ?? 'Job Position';

        self::dispatchAsyncMail(function () use ($applicant, $jobTitle, $remarks, $recommendedJobs) {
            try {
                Mail::send('emails.alternative_role_recommendation', [
                    'applicant'       => $applicant,
                    'job_title'       => $jobTitle,
                    'remarks'         => $remarks,
                    'recommendedJobs' => $recommendedJobs,
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
