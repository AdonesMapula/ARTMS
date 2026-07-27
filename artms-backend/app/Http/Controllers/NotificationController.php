<?php

namespace App\Http\Controllers;

use App\Models\Applicant;
use App\Models\Interview;
use App\Models\JobLibrary;
use App\Models\JobPosting;
use App\Models\ManpowerRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class NotificationController extends Controller
{
    /**
     * GET /api/notifications
     *
     * Returns real notifications for the authenticated user based on role and database activity,
     * with read status permanently persisted in the database.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $notifications = [];

        // Fetch all persistent read notification IDs for this user from database
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

        // ── 1. Notifications for COO & Super Admin (Approvals needed) ──────────
        if (in_array($user->role, ['coo', 'super_admin'])) {
            $prfLink = $user->role === 'coo' ? '/coo/prf-approvals' : '/superadmin/manpower-requests';
            $jobLibLink = $user->role === 'coo' ? '/coo/job-library-approvals' : '/superadmin/job-library';

            // Pending Manpower Requests (PRFs)
            $pendingPrfs = ManpowerRequest::with(['department', 'jobLibrary'])
                ->where('status', 'pending')
                ->latest()
                ->take(5)
                ->get();

            foreach ($pendingPrfs as $prf) {
                $id = 'prf_pending_' . $prf->id;
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

            // Pending Job Library Templates
            $pendingJobs = JobLibrary::where('approval_status', 'pending')
                ->latest()
                ->take(5)
                ->get();

            foreach ($pendingJobs as $job) {
                $id = 'job_pending_' . $job->id;
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

        // ── 2. Notifications for HR Admin & Super Admin ──────────────────────
        if (in_array($user->role, ['hr_admin', 'super_admin', 'employee'])) {
            $applicantLink  = $prefix . '/applicants';
            $jobPostingLink = $prefix . '/job-posting';

            // Recent Applicants
            $recentApplicants = Applicant::with('jobPosting')
                ->latest()
                ->take(5)
                ->get();

            foreach ($recentApplicants as $applicant) {
                $id = 'app_new_' . $applicant->id;
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

            // Approved PRFs ready for Job Posting creation
            $approvedPrfs = ManpowerRequest::where('status', 'approved')
                ->latest()
                ->take(3)
                ->get();

            foreach ($approvedPrfs as $prf) {
                $id = 'prf_approved_' . $prf->id;
                $notifications[] = [
                    'id'          => $id,
                    'category'    => 'alert',
                    'title'       => 'PRF Approved by COO',
                    'message'     => "Requisition for '{$prf->position_needed}' was approved. Ready to create job posting.",
                    'time'        => $prf->updated_at->diffForHumans(),
                    'created_at'  => $prf->updated_at->toISOString(),
                    'read'        => in_array($id, $readIds),
                    'link'        => $jobPostingLink,
                ];
            }
        }

        // ── 3. Notifications for Department Head ──────────────────────────────
        if ($user->role === 'department_head') {
            $myPrfs = ManpowerRequest::where('requested_by', $user->id)
                ->latest()
                ->take(5)
                ->get();

            foreach ($myPrfs as $prf) {
                $id = 'my_prf_' . $prf->id . '_' . $prf->status;
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

        // ── 4. Interview Notifications (All HR / Interviewers / Admins) ────────
        $interviewLink = $prefix . '/interviews';
        $upcomingInterviews = Interview::with(['applicant', 'jobPosting'])
            ->where('scheduled_at', '>=', now())
            ->orderBy('scheduled_at', 'asc')
            ->take(5)
            ->get();

        foreach ($upcomingInterviews as $interview) {
            $id = 'interview_' . $interview->id;
            $notifications[] = [
                'id'          => $id,
                'category'    => 'interview',
                'title'       => 'Upcoming Interview Session',
                'message'     => "Interview with {$interview->applicant?->first_name} {$interview->applicant?->last_name} scheduled for " . \Carbon\Carbon::parse($interview->scheduled_at)->format('M d, g:i A') . ".",
                'time'        => \Carbon\Carbon::parse($interview->scheduled_at)->diffForHumans(),
                'created_at'  => $interview->created_at->toISOString(),
                'read'        => in_array($id, $readIds),
                'link'        => $interviewLink,
            ];
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
     *
     * Persists read status permanently in the database notifications table.
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $uuid = Str::isUuid($id) ? $id : (string) Str::uuid();

        // Check if DB record exists for dynamic notification ID
        $existing = DB::table('notifications')
            ->where('notifiable_id', $user->id)
            ->where('data', 'like', '%"notification_id":"' . $id . '"%')
            ->first();

        if ($existing) {
            DB::table('notifications')
                ->where('id', $existing->id)
                ->update(['read_at' => now(), 'updated_at' => now()]);
        } else {
            DB::table('notifications')->insert([
                'id'              => $uuid,
                'type'            => 'App\\Notifications\\SystemNotification',
                'notifiable_type' => 'App\\Models\\User',
                'notifiable_id'   => $user->id,
                'data'            => json_encode(['notification_id' => $id]),
                'read_at'         => now(),
                'created_at'      => now(),
                'updated_at'      => now(),
            ]);
        }

        return response()->json(['message' => 'Notification marked as read.']);
    }

    /**
     * POST /api/notifications/read-all
     *
     * Marks all active notifications as read permanently in the database.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();

        // Fetch current notifications list to get all active IDs
        $response = $this->index($request);
        $data = $response->getData(true);
        $allNotifications = $data['notifications'] ?? [];

        foreach ($allNotifications as $n) {
            $id = $n['id'];
            $uuid = Str::isUuid($id) ? $id : (string) Str::uuid();

            $existing = DB::table('notifications')
                ->where('notifiable_id', $user->id)
                ->where('data', 'like', '%"notification_id":"' . $id . '"%')
                ->first();

            if ($existing) {
                DB::table('notifications')
                    ->where('id', $existing->id)
                    ->update(['read_at' => now(), 'updated_at' => now()]);
            } else {
                DB::table('notifications')->insert([
                    'id'              => $uuid,
                    'type'            => 'App\\Notifications\\SystemNotification',
                    'notifiable_type' => 'App\\Models\\User',
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
}
