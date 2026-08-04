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
     * Notify a specific User (In-App Database Notification + Email).
     */
    public static function notifyUser(User $user, string $title, string $message, string $link = '/', string $category = 'alert'): void
    {
        $uuid = (string) Str::uuid();
        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
        $fullActionUrl = str_starts_with($link, 'http') ? $link : rtrim($frontendUrl, '/') . '/' . ltrim($link, '/');

        // 1. Create persistent in-app notification
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

        // 2. Dispatch Email notification
        if ($user->email) {
            try {
                Mail::to($user->email)->send(new SystemNotificationMail($title, $message, $fullActionUrl, $category));
            } catch (\Throwable $e) {
                \Log::error("Failed to send notification email to {$user->email}: " . $e->getMessage());
            }
        }
    }

    /**
     * Notify all users with specified role(s) (In-App + Email).
     */
    public static function notifyRoles(array|string $roles, string $title, string $message, string $link = '/', string $category = 'alert'): void
    {
        $roleList = (array) $roles;
        $users = User::whereIn('role', $roleList)->get();

        foreach ($users as $user) {
            self::notifyUser($user, $title, $message, $link, $category);
        }
    }

    /**
     * Send email directly to an email address (e.g. candidates/applicants).
     */
    public static function notifyEmail(string $email, string $title, string $message, ?string $link = null, string $category = 'alert'): void
    {
        if (! $email) return;

        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
        $fullActionUrl = $link ? (str_starts_with($link, 'http') ? $link : rtrim($frontendUrl, '/') . '/' . ltrim($link, '/')) : null;

        try {
            Mail::to($email)->send(new SystemNotificationMail($title, $message, $fullActionUrl, $category));
        } catch (\Throwable $e) {
            \Log::error("Failed to send candidate email to {$email}: " . $e->getMessage());
        }
    }
}
