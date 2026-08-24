<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class NotificationController extends Controller
{
    /**
     * GET /api/notifications
     *
     * Returns strictly targeted notifications belonging to the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $notifications = [];

        // Fetch persistent database notifications belonging strictly to this user
        $dbNotifications = DB::table('notifications')
            ->where('notifiable_id', $user->id)
            ->where('notifiable_type', User::class)
            ->orderBy('created_at', 'desc')
            ->get();

        foreach ($dbNotifications as $row) {
            $data = json_decode($row->data, true) ?: [];
            $createdAt = \Carbon\Carbon::parse($row->created_at);

            $notifications[] = [
                'id'          => $data['notification_id'] ?? $row->id,
                'db_id'       => $row->id,
                'category'    => $data['category'] ?? 'alert',
                'title'       => $data['title'] ?? 'System Notification',
                'message'     => $data['message'] ?? '',
                'time'        => $createdAt->diffForHumans(),
                'created_at'  => $createdAt->toISOString(),
                'read'        => ! is_null($row->read_at),
                'link'        => $data['link'] ?? '/',
                'entity_type' => $data['entity_type'] ?? null,
                'entity_id'   => $data['entity_id'] ?? null,
            ];
        }

        // Calculate unread count strictly for this authenticated user
        $unreadCount = count(array_filter($notifications, fn($n) => !$n['read']));

        return response()->json([
            'unread_count'  => $unreadCount,
            'notifications' => array_values($notifications),
        ]);
    }

    /**
     * POST /api/notifications/{id}/read
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        // 1. Check direct UUID row ID match
        $updated = DB::table('notifications')
            ->where('id', $id)
            ->where('notifiable_id', $user->id)
            ->update(['read_at' => now(), 'updated_at' => now()]);

        if (! $updated) {
            // 2. Check JSON data notification_id match
            $existing = DB::table('notifications')
                ->where('notifiable_id', $user->id)
                ->where('data', 'like', '%"notification_id":"' . $id . '"%')
                ->first();

            if ($existing) {
                DB::table('notifications')
                    ->where('id', $existing->id)
                    ->update(['read_at' => now(), 'updated_at' => now()]);
            }
        }

        return response()->json(['message' => 'Notification marked as read.']);
    }

    /**
     * POST /api/notifications/read-all
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();

        // Mark all persistent notifications owned by this user as read
        DB::table('notifications')
            ->where('notifiable_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now(), 'updated_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }
}
