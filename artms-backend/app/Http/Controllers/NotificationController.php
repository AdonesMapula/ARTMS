<?php

namespace App\Http\Controllers;

use App\Models\Applicant;
use App\Models\Interview;
use App\Models\JobLibrary;
use App\Models\ManpowerRequest;
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
     * Returns real persistent notifications for the authenticated user,
     * supplemented with dynamic activity events based on user role.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $notifications = [];

        // 1. Fetch persistent database notifications for this user
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
            ];
        }

        // Fetch all persistent read notification IDs for this user
        $readIds = DB::table('notifications')
            ->where('notifiable_id', $user->id)
            ->whereNotNull('read_at')
            ->get()
            ->map(function ($row) {
                $decoded = json_decode($row->data, true);
                return $decoded['notification_id'] ?? $row->id;
            })
            ->filter()
            ->toArray();

        $prefix = match ($user->role) {
            'super_admin'     => '/superadmin',
            'coo'             => '/coo',
            'department_head' => '/department-head',
            default           => '/admin',
        };

        // 2. Dynamic Activity Items for COO & Super Admin
        if (in_array($user->role, ['coo', 'super_admin'])) {
            $prfLink = $user->role === 'coo' ? '/coo/prf-approvals' : '/superadmin/manpower-requests';
            $jobLibLink = $user->role === 'coo' ? '/coo/job-library-approvals' : '/superadmin/job-library';

            $pendingPrfs = ManpowerRequest::with(['department', 'jobLibrary'])
                ->where('status', 'pending')
                ->latest()
                ->take(5)
                ->get();

            foreach ($pendingPrfs as $prf) {
                $id = 'prf_pending_' . $prf->id;
                if (! collect($notifications)->contains('id', $id)) {
                    $notifications[] = [
                        'id'          => $id,
                        'category'    => 'request',
                        'title'       => 'New PRF Pending Approval',
                        'message'     => "{$prf->department?->department_name} requested {$prf->headcount}x {$prf->position_needed}.",
                        'time'        => $prf->created_at->diffForHumans(),
                        'created_at'  => $prf->created_at->toISOString(),
                        'read'        => in_array($id, $readIds),
                        'link'        => $prfLink,
                    ];
                }
            }

            $pendingJobs = JobLibrary::where('approval_status', 'pending')
                ->latest()
                ->take(5)
                ->get();

            foreach ($pendingJobs as $job) {
                $id = 'job_pending_' . $job->id;
                if (! collect($notifications)->contains('id', $id)) {
                    $notifications[] = [
                        'id'          => $id,
                        'category'    => 'request',
                        'title'       => 'Job Template Approval Needed',
                        'message'     => "New job template '{$job->job_title}' is pending approval.",
                        'time'        => $job->created_at->diffForHumans(),
                        'created_at'  => $job->created_at->toISOString(),
                        'read'        => in_array($id, $readIds),
                        'link'        => $jobLibLink,
                    ];
                }
            }
        }

        // 3. Dynamic Activity Items for HR Admin / Employee / Super Admin
        if (in_array($user->role, ['hr_admin', 'super_admin', 'employee'])) {
            $applicantLink  = $prefix . '/applicants';
            $jobPostingLink = $prefix . '/job-posting';

            $recentApplicants = Applicant::with('jobPosting')
                ->latest()
                ->take(5)
                ->get();

            foreach ($recentApplicants as $applicant) {
                $id = 'app_new_' . $applicant->id;
                if (! collect($notifications)->contains('id', $id)) {
                    $notifications[] = [
                        'id'          => $id,
                        'category'    => 'application',
                        'title'       => 'New Job Application',
                        'message'     => "{$applicant->first_name} {$applicant->last_name} applied for {$applicant->jobPosting?->job_title}.",
                        'time'        => $applicant->created_at->diffForHumans(),
                        'created_at'  => $applicant->created_at->toISOString(),
                        'read'        => in_array($id, $readIds),
                        'link'        => $applicantLink,
                    ];
                }
            }
        }

        // 4. Dynamic Activity Items for Department Head
        if ($user->role === 'department_head') {
            $myPrfs = ManpowerRequest::where('requested_by', $user->id)
                ->latest()
                ->take(5)
                ->get();

            foreach ($myPrfs as $prf) {
                $id = 'my_prf_' . $prf->id . '_' . $prf->status;
                if (! collect($notifications)->contains('id', $id)) {
                    $statusText = ucfirst($prf->status);
                    $notifications[] = [
                        'id'          => $id,
                        'category'    => $prf->status === 'approved' ? 'alert' : 'request',
                        'title'       => "PRF Request {$statusText}",
                        'message'     => "Your manpower request for '{$prf->position_needed}' status is now {$statusText}.",
                        'time'        => $prf->updated_at->diffForHumans(),
                        'created_at'  => $prf->updated_at->toISOString(),
                        'read'        => in_array($id, $readIds),
                        'link'        => '/department-head/request-history',
                    ];
                }
            }
        }

        // Sort all notifications by created_at descending
        usort($notifications, fn($a, $b) => strcmp($b['created_at'], $a['created_at']));

        // Calculate unread count
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
            } else {
                $uuid = Str::isUuid($id) ? $id : (string) Str::uuid();
                DB::table('notifications')->insert([
                    'id'              => $uuid,
                    'type'            => 'App\\Notifications\\SystemNotification',
                    'notifiable_type' => User::class,
                    'notifiable_id'   => $user->id,
                    'data'            => json_encode(['notification_id' => $id]),
                    'read_at'         => now(),
                    'created_at'      => now(),
                    'updated_at'      => now(),
                ]);
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

        // Mark all persistent notifications as read
        DB::table('notifications')
            ->where('notifiable_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now(), 'updated_at' => now()]);

        // Also mark any dynamic activity notifications as read
        $response = $this->index($request);
        $data = $response->getData(true);
        $allNotifications = $data['notifications'] ?? [];

        foreach ($allNotifications as $n) {
            $id = $n['id'];
            $uuid = Str::isUuid($id) ? $id : (string) Str::uuid();

            $existing = DB::table('notifications')
                ->where('notifiable_id', $user->id)
                ->where(function ($q) use ($id) {
                    $q->where('id', $id)
                      ->orWhere('data', 'like', '%"notification_id":"' . $id . '"%');
                })
                ->first();

            if ($existing) {
                DB::table('notifications')
                    ->where('id', $existing->id)
                    ->update(['read_at' => now(), 'updated_at' => now()]);
            } else {
                DB::table('notifications')->insert([
                    'id'              => $uuid,
                    'type'            => 'App\\Notifications\\SystemNotification',
                    'notifiable_type' => User::class,
                    'notifiable_id'   => $user->id,
                    'data'            => json_encode(['notification_id' => $id]),
                    'read_at'         => now(),
                    'created_at'      => now(),
                    'updated_at'      => now(),
                ]);
            }
        }

        return response()->json(['message' => 'All notifications marked as read.']);
    }

    /**
     * GET /api/notifications/unread-count
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $user = $request->user();
        $count = DB::table('notifications')
            ->where('notifiable_id', $user->id)
            ->where('notifiable_type', User::class)
            ->whereNull('read_at')
            ->count();

        return response()->json(['unread_count' => $count]);
    }
}
