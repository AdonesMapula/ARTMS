<?php

namespace App\Http\Controllers;

use App\Models\Applicant;
use App\Models\AttendanceLog;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Interview;
use App\Models\JobPosting;
use App\Models\LeaveRequest;
use App\Models\ManpowerRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * GET /api/dashboard/admin
     */
    public function adminStats(): JsonResponse
    {
        $now    = now();
        $month  = $now->month;
        $year   = $now->year;

        return response()->json([
            'total_employees'       => Employee::where('employment_status', 'active')->count(),
            'total_departments'     => Department::where('is_active', true)->count(),
            'total_users'           => User::where('is_active', true)->count(),
            'open_job_postings'     => JobPosting::where('status', 'published')->count(),
            'total_applicants'      => Applicant::whereMonth('created_at', $month)->whereYear('created_at', $year)->count(),
            'pending_leaves'        => LeaveRequest::where('status', 'pending')->count(),
            'interviews_this_month' => Interview::whereMonth('scheduled_at', $month)->whereYear('scheduled_at', $year)->count(),
            'hired_this_month'      => Applicant::where('status', 'hired')->whereMonth('updated_at', $month)->whereYear('updated_at', $year)->count(),
            'manpower_requests'     => ManpowerRequest::where('status', 'pending')->count(),
            'applicant_pipeline'    => [
                'applied'           => Applicant::where('status', 'applied')->count(),
                'ai_screening'      => Applicant::where('status', 'ai_screening')->count(),
                'screening_passed'  => Applicant::where('status', 'screening_passed')->count(),
                'interview_1'       => Applicant::whereIn('status', ['interview_1_scheduled', 'interview_1_done'])->count(),
                'interview_2'       => Applicant::whereIn('status', ['interview_2_scheduled', 'interview_2_done'])->count(),
                'hired'             => Applicant::where('status', 'hired')->count(),
                'rejected'          => Applicant::where('status', 'rejected')->count(),
            ],
            'monthly_hires' => Applicant::where('status', 'hired')
                ->whereYear('updated_at', $year)
                ->selectRaw('MONTH(updated_at) as month, COUNT(*) as count')
                ->groupBy('month')
                ->orderBy('month')
                ->get(),
        ]);
    }

    /**
     * GET /api/dashboard/super-admin
     */
    public function superAdminStats(): JsonResponse
    {
        return response()->json([
            'total_users'       => User::count(),
            'active_users'      => User::where('is_active', true)->count(),
            'users_by_role'     => User::selectRaw('role, COUNT(*) as count')->groupBy('role')->get(),
            'departments'       => Department::withCount('employees')->get(),
            'recent_audit_logs' => \App\Models\AuditLog::with('user')->orderByDesc('created_at')->take(20)->get(),
            'recent_users'      => User::with('department')->orderByDesc('created_at')->take(20)->get(),
        ]);
    }

    /**
     * GET /api/dashboard/department-head
     */
    public function departmentHeadStats(Request $request): JsonResponse
    {
        $deptId = $request->user()->department_id;

        return response()->json([
            'department_employees' => Employee::where('department_id', $deptId)->where('employment_status', 'active')->count(),
            'pending_requests'     => ManpowerRequest::where('department_id', $deptId)->where('status', 'pending')->count(),
            'open_postings'        => JobPosting::where('department_id', $deptId)->where('status', 'published')->count(),
            'pending_leaves'       => LeaveRequest::whereHas('employee', fn ($q) => $q->where('department_id', $deptId))
                                        ->where('status', 'pending')->count(),
            'attendance_today'     => AttendanceLog::whereHas('employee', fn ($q) => $q->where('department_id', $deptId))
                                        ->where('date', today())->count(),
        ]);
    }

    /**
     * GET /api/dashboard/coo
     */
    public function cooStats(): JsonResponse
    {
        $now  = now();
        $year = $now->year;

        $total    = ManpowerRequest::count();
        $pending  = ManpowerRequest::where('status', 'pending')->count();
        $approved = ManpowerRequest::where('status', 'approved')->count();
        $rejected = ManpowerRequest::where('status', 'rejected')->count();

        $requestsByDepartment = ManpowerRequest::selectRaw('departments.department_name as name, COUNT(*) as value')
            ->join('departments', 'manpower_requests.department_id', '=', 'departments.id')
            ->groupBy('departments.department_name')
            ->get();

        $requestsByUrgency = ManpowerRequest::selectRaw('urgency as name, COUNT(*) as value')
            ->groupBy('urgency')
            ->get();

        $monthlyTrends = ManpowerRequest::whereYear('created_at', $year)
            ->selectRaw('MONTH(created_at) as month, COUNT(*) as count')
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $recentPending = ManpowerRequest::with('department')
            ->where('status', 'pending')
            ->orderByDesc('created_at')
            ->take(5)
            ->get();

        return response()->json([
            'total_requests'         => $total,
            'pending_requests'       => $pending,
            'approved_requests'      => $approved,
            'rejected_requests'      => $rejected,
            'requests_by_department' => $requestsByDepartment,
            'requests_by_urgency'    => $requestsByUrgency,
            'monthly_trends'         => $monthlyTrends,
            'recent_pending'         => $recentPending,
        ]);
    }

    /**
     * GET /api/sidebar-counts
     * Returns real-time counts for sidebar navigation badges.
     */
    public function sidebarCounts(Request $request): JsonResponse
    {
        $user = $request->user();
        $deptId = $user?->department_id;

        $pendingManpower = ManpowerRequest::where('status', 'pending');
        if ($user && $user->role === 'department_head' && $deptId) {
            $pendingManpower->where('department_id', $deptId);
        }

        $unreadNotifs = $user
            ? \DB::table('notifications')->where('notifiable_id', $user->id)->whereNull('read_at')->count()
            : 0;

        return response()->json([
            'manpower_requests' => $pendingManpower->count(),
            'applicants'        => Applicant::count(),
            'job_postings'      => JobPosting::where('status', 'published')->count(),
            'interviews'        => Interview::whereIn('status', ['scheduled', 'confirmed'])->count(),
            'notifications'     => $unreadNotifs,
        ]);
    }
}
