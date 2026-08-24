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

    /**
     * GET/POST /test-email or /api/public/test-email
     * Diagnostic endpoint to verify SMTP delivery and configuration.
     */
    public function testEmail(Request $request)
    {
        $targetEmail = $request->input('email', $request->user()?->email ?? config('mail.from.address'));
        $errorMsg = null;
        $successMsg = null;

        if ($request->isMethod('post') || $request->has('email') || $request->has('send')) {
            if (! $targetEmail) {
                if ($request->wantsJson()) {
                    return response()->json(['message' => 'Please provide a recipient email address.'], 422);
                }
                $errorMsg = 'Please provide a valid recipient email address.';
            } else {
                try {
                    \Illuminate\Support\Facades\Mail::raw("ARTMS SMTP Diagnostic Test\nSent at: " . now()->toDateTimeString() . "\nMailer: " . config('mail.default') . "\nHost: " . config('mail.mailers.smtp.host') . ":" . config('mail.mailers.smtp.port'), function ($message) use ($targetEmail) {
                        $message->to($targetEmail)
                                ->subject('ARTMS Email Diagnostic Test — Delivery Confirmed');
                    });

                    $successMsg = "Test email successfully delivered to {$targetEmail} via SMTP!";
                    if ($request->wantsJson()) {
                        return response()->json([
                            'success' => true,
                            'message' => $successMsg,
                            'mailer'  => config('mail.default'),
                            'host'    => config('mail.mailers.smtp.host'),
                            'port'    => config('mail.mailers.smtp.port'),
                        ]);
                    }
                } catch (\Throwable $e) {
                    $errorMsg = 'SMTP Delivery Failed: ' . $e->getMessage();
                    if ($request->wantsJson()) {
                        return response()->json([
                            'success' => false,
                            'message' => $errorMsg,
                            'error'   => $e->getMessage(),
                        ], 500);
                    }
                }
            }
        }

        if ($request->wantsJson() && ! $request->has('html')) {
            return response()->json([
                'status'     => 'ready',
                'mailer'     => config('mail.default'),
                'host'       => config('mail.mailers.smtp.host'),
                'port'       => config('mail.mailers.smtp.port'),
                'encryption' => config('mail.mailers.smtp.encryption'),
                'from'       => config('mail.from.address'),
                'from_name'  => config('mail.from.name'),
                'username'   => config('mail.mailers.smtp.username') ? substr(config('mail.mailers.smtp.username'), 0, 3) . '***@...' : 'Not configured',
                'instructions' => 'Pass ?email=your_email@gmail.com to trigger a live test email.',
            ]);
        }

        $mailer = config('mail.default');
        $host = config('mail.mailers.smtp.host');
        $port = config('mail.mailers.smtp.port');
        $enc = config('mail.mailers.smtp.encryption');
        $from = config('mail.from.address');
        $name = config('mail.from.name');
        $user = config('mail.mailers.smtp.username');

        $statusHtml = '';
        if ($successMsg) {
            $statusHtml = "<div style='background:#dcfce7;border:1px solid #86efac;color:#166534;padding:16px;border-radius:12px;margin-bottom:24px;font-weight:600;'>✓ {$successMsg}</div>";
        } elseif ($errorMsg) {
            $statusHtml = "<div style='background:#fee2e2;border:1px solid #fca5a5;color:#991b1b;padding:16px;border-radius:12px;margin-bottom:24px;font-weight:600;'>✗ {$errorMsg}</div>";
        }

        return response("
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>ARTMS SMTP Diagnostic Tool</title>
    <meta name='viewport' content='width=device-width, initial-scale=1'>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px 20px; }
        .card { max-width: 640px; margin: 0 auto; background: #1e293b; border-radius: 20px; padding: 36px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); border: 1px solid #334155; }
        h1 { font-size: 24px; font-weight: 800; color: #60a5fa; margin-top: 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
        td { padding: 10px 12px; border-bottom: 1px solid #334155; }
        .label { color: #94a3b8; font-weight: 600; width: 35%; }
        .val { color: #f8fafc; font-family: monospace; }
        input[type='email'] { width: calc(100% - 24px); padding: 12px; border-radius: 10px; border: 1px solid #475569; background: #0f172a; color: #fff; margin-bottom: 16px; font-size: 15px; }
        button { width: 100%; background: #2563eb; color: #fff; border: none; padding: 14px; border-radius: 10px; font-weight: 700; font-size: 15px; cursor: pointer; transition: background 0.2s; }
        button:hover { background: #1d4ed8; }
    </style>
</head>
<body>
    <div class='card'>
        <h1>✉️ ARTMS SMTP Diagnostic Dashboard</h1>
        <p style='color:#94a3b8;font-size:14px;margin-bottom:24px;'>Test and verify outbound SMTP mail delivery in production.</p>
        
        {$statusHtml}

        <table>
            <tr><td class='label'>Mailer Driver</td><td class='val'>{$mailer}</td></tr>
            <tr><td class='label'>SMTP Host</td><td class='val'>{$host}</td></tr>
            <tr><td class='label'>SMTP Port</td><td class='val'>{$port}</td></tr>
            <tr><td class='label'>Encryption</td><td class='val'>{$enc}</td></tr>
            <tr><td class='label'>Sender Address</td><td class='val'>{$from} ({$name})</td></tr>
            <tr><td class='label'>SMTP Username</td><td class='val'>{$user}</td></tr>
        </table>

        <form method='GET' action=''>
            <label style='display:block;margin-bottom:8px;font-size:14px;font-weight:600;color:#cbd5e1;'>Send Test Email To:</label>
            <input type='email' name='email' value='{$targetEmail}' required placeholder='your_email@gmail.com' />
            <input type='hidden' name='send' value='1' />
            <button type='submit'>🚀 Send Live Test Email</button>
        </form>
    </div>
</body>
</html>
        ", 200, ['Content-Type' => 'text/html']);
    }
}
