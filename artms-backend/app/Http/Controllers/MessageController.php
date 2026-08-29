<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MessageController extends Controller
{
    /**
     * GET /api/messages/conversations
     * List unique conversation partners with last message and unread count.
     */
    public function conversations(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        // Get the latest message ID for each conversation partner
        $latestIds = Message::query()
            ->where('sender_id', $userId)
            ->orWhere('receiver_id', $userId)
            ->selectRaw('
                GREATEST(sender_id, receiver_id) as high_id,
                LEAST(sender_id, receiver_id) as low_id,
                MAX(id) as latest_id
            ')
            ->groupByRaw('GREATEST(sender_id, receiver_id), LEAST(sender_id, receiver_id)')
            ->pluck('latest_id');

        $messages = Message::with(['sender:id,name,first_name,last_name,email,avatar,role', 'receiver:id,name,first_name,last_name,email,avatar,role'])
            ->whereIn('id', $latestIds)
            ->orderByDesc('created_at')
            ->get();

        $conversations = $messages->map(function ($msg) use ($userId) {
            $partner = $msg->sender_id === $userId ? $msg->receiver : $msg->sender;

            // Count unread messages from this partner
            $unread = Message::where('sender_id', $partner->id)
                ->where('receiver_id', $userId)
                ->whereNull('read_at')
                ->count();

            return [
                'partner'      => $partner,
                'last_message' => [
                    'id'         => $msg->id,
                    'body'       => $msg->body,
                    'sender_id'  => $msg->sender_id,
                    'created_at' => $msg->created_at,
                    'read_at'    => $msg->read_at,
                ],
                'unread_count' => $unread,
            ];
        });

        return response()->json(['conversations' => $conversations]);
    }

    /**
     * GET /api/messages/users
     * List all users (except self) for starting a new conversation.
     */
    public function users(Request $request): JsonResponse
    {
        $users = User::where('id', '!=', $request->user()->id)
            ->where('is_active', true)
            ->select('id', 'name', 'first_name', 'last_name', 'email', 'avatar', 'role')
            ->orderBy('name')
            ->get();

        return response()->json(['users' => $users]);
    }

    /**
     * GET /api/messages/{userId}
     * Fetch the message thread between authenticated user and the given user.
     */
    public function thread(Request $request, int $userId): JsonResponse
    {
        $authId = $request->user()->id;

        $messages = Message::with(['sender:id,name,first_name,last_name,avatar,role'])
            ->where(function ($q) use ($authId, $userId) {
                $q->where('sender_id', $authId)->where('receiver_id', $userId);
            })
            ->orWhere(function ($q) use ($authId, $userId) {
                $q->where('sender_id', $userId)->where('receiver_id', $authId);
            })
            ->orderBy('created_at', 'asc')
            ->get();

        // Mark unread messages from partner as read
        Message::where('sender_id', $userId)
            ->where('receiver_id', $authId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        // Load partner info
        $partner = User::select('id', 'name', 'first_name', 'last_name', 'email', 'avatar', 'role')
            ->find($userId);

        return response()->json([
            'messages' => $messages,
            'partner'  => $partner,
        ]);
    }

    /**
     * POST /api/messages
     * Send a new message.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'receiver_id' => ['required', 'exists:users,id'],
            'body'        => ['required', 'string', 'max:5000'],
        ]);

        $message = Message::create([
            'sender_id'   => $request->user()->id,
            'receiver_id' => $request->receiver_id,
            'body'        => $request->body,
        ]);

        $message->load('sender:id,name,first_name,last_name,avatar,role');

        return response()->json([
            'message' => $message,
        ], 201);
    }

    /**
     * PUT /api/messages/{id}/read
     * Mark a message as read.
     */
    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $message = Message::where('id', $id)
            ->where('receiver_id', $request->user()->id)
            ->firstOrFail();

        $message->update(['read_at' => now()]);

        return response()->json(['message' => 'Marked as read.']);
    }
}
