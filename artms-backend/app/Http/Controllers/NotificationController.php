<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    /**
     * GET /api/notifications
     *
     * Returns strictly the authenticated user's own persistent notifications.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Fetch persistent database notifications belonging strictly to the authenticated user
        $dbNotifications = DB::table('notifications')
            ->where('notifiable_id', $user->id)
            ->where('notifiable_type', User::class)
            ->orderBy('created_at', 'desc')
            ->take(50)
            ->get();

        $notifications = [];
        $unreadCount = 0;

        foreach ($dbNotifications as $row) {
            $data = json_decode($row->data, true) ?: [];
            $createdAt = \Carbon\Carbon::parse($row->created_at);
            $isRead = ! is_null($row->read_at);

            if (! $isRead) {
                $unreadCount++;
            }

            $notifications[] = [
                'id'          => $data['notification_id'] ?? $row->id,
                'db_id'       => $row->id,
                'category'    => $data['category'] ?? 'alert',
                'title'       => $data['title'] ?? 'System Notification',
                'message'     => $data['message'] ?? '',
                'time'        => $createdAt->diffForHumans(),
                'created_at'  => $createdAt->toISOString(),
                'read'        => $isRead,
                'link'        => $data['link'] ?? '/',
                'entity_type' => $data['entity_type'] ?? null,
                'entity_id'   => $data['entity_id'] ?? null,
            ];
        }

        return response()->json([
            'unread_count'  => $unreadCount,
            'notifications' => $notifications,
        ]);
    }

    /**
     * POST /api/notifications/{id}/read
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        // 1. Direct row ID match
        $updated = DB::table('notifications')
            ->where('id', $id)
            ->where('notifiable_id', $user->id)
            ->update(['read_at' => now(), 'updated_at' => now()]);

        if (! $updated) {
            // 2. JSON notification_id match
            DB::table('notifications')
                ->where('notifiable_id', $user->id)
                ->where('data', 'like', '%"notification_id":"' . $id . '"%')
                ->update(['read_at' => now(), 'updated_at' => now()]);
        }

        return response()->json(['message' => 'Notification marked as read.']);
    }

    /**
     * POST /api/notifications/read-all
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();

        DB::table('notifications')
            ->where('notifiable_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now(), 'updated_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }
}
