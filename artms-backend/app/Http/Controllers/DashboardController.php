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

    public function superAdminStats(): JsonResponse
    {
        $totalUsers = User::count();
        $activeUsers = User::where('is_active', true)->count();
        $inactiveUsers = User::where('is_active', false)->count();
        $deletedUsers = User::onlyTrashed()->count();

        // 7 months traffic & users growth
        $traffic7M = [];
        for ($i = 6; $i >= 0; $i--) {
            $monthStart = now()->subMonths($i)->startOfMonth();
            $monthEnd = now()->subMonths($i)->endOfMonth();
            
            $usersCount = User::where('created_at', '<=', $monthEnd)->count();
            $logCount = AuditLog::whereBetween('created_at', [$monthStart, $monthEnd])->count();
            
            $traffic7M[] = [
                'label' => $monthStart->format('M'),
                'traffic' => $logCount,
                'users' => $usersCount,
            ];
        }

        // 30 days traffic & users growth
        $traffic30D = [];
        for ($i = 3; $i >= 0; $i--) {
            $weekStart = now()->subDays(($i + 1) * 7)->startOfDay();
            $weekEnd = now()->subDays($i * 7)->endOfDay();
            
            $usersCount = User::where('created_at', '<=', $weekEnd)->count();
            $logCount = AuditLog::whereBetween('created_at', [$weekStart, $weekEnd])->count();
            
            $traffic30D[] = [
                'label' => 'W' . (4 - $i),
                'traffic' => $logCount,
                'users' => $usersCount,
            ];
        }

        // 24 hours traffic & users growth
        $traffic24H = [];
        for ($i = 3; $i >= 0; $i--) {
            $hourStart = now()->subHours(($i + 1) * 6);
            $hourEnd = now()->subHours($i * 6);
            
            $usersCount = User::where('created_at', '<=', $hourEnd)->count();
            $logCount = AuditLog::whereBetween('created_at', [$hourStart, $hourEnd])->count();
            
            $traffic24H[] = [
                'label' => $hourStart->format('H:i'),
                'traffic' => $logCount,
                'users' => $usersCount,
            ];
        }

        // Weekly activity intensity heatmap (Mon-Sun)
        $startOfWeek = now()->startOfWeek();
        $weeklyLogs = AuditLog::where('created_at', '>=', $startOfWeek)->get();
        $heatmapData = [];
        
        for ($dIdx = 0; $dIdx < 7; $dIdx++) {
            $dayDate = $startOfWeek->clone()->addDays($dIdx)->format('Y-m-d');
            $dayLogs = $weeklyLogs->filter(fn($log) => $log->created_at->format('Y-m-d') === $dayDate);
            
            $morningCount = $dayLogs->filter(fn($log) => $log->created_at->hour >= 6 && $log->created_at->hour < 12)->count();
            $afternoonCount = $dayLogs->filter(fn($log) => $log->created_at->hour >= 12 && $log->created_at->hour < 18)->count();
            $eveningCount = $dayLogs->filter(fn($log) => $log->created_at->hour >= 18)->count();
            $nightCount = $dayLogs->filter(fn($log) => $log->created_at->hour >= 0 && $log->created_at->hour < 6)->count();
            
            $heatmapData[] = [
                $morningCount,
                $afternoonCount,
                $eveningCount,
                $nightCount
            ];
        }

        return response()->json([
            'total_users'       => $totalUsers,
            'active_users'      => $activeUsers,
            'inactive_users'    => $inactiveUsers,
            'deleted_users'     => $deletedUsers,
            'users_by_role'     => User::selectRaw('role, COUNT(*) as count')->groupBy('role')->get(),
            'departments'       => Department::withCount('employees')->get(),
            'recent_audit_logs' => \App\Models\AuditLog::with('user')->orderByDesc('created_at')->take(20)->get(),
            'recent_users'      => User::with('department')->orderByDesc('created_at')->take(20)->get(),
            'traffic_trends'    => [
                '7M'  => $traffic7M,
                '30D' => $traffic30D,
                '24H' => $traffic24H,
            ],
            'audit_heatmap'     => $heatmapData,
        ]);
    }

    /**
     * GET /api/dashboard/department-head
     */
    public function departmentHeadStats(Request $request): JsonResponse
    {
        $deptId = $request->user()->department_id;
        $deptEmployeesCount = Employee::where('department_id', $deptId)->where('employment_status', 'active')->count();

        $startOfWeek = now()->startOfWeek();
        $endOfWeek = now()->endOfWeek();

        $weeklyAttendanceLogs = AttendanceLog::whereHas('employee', fn($q) => $q->where('department_id', $deptId))
            ->whereBetween('date', [$startOfWeek, $endOfWeek])
            ->get();

        $weeklyActivity = [];
        $days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        
        for ($i = 0; $i < 7; $i++) {
            $dayDate = $startOfWeek->clone()->addDays($i)->format('Y-m-d');
            $dayLogs = $weeklyAttendanceLogs->where('date', $dayDate);
            
            $presentCount = $dayLogs->whereIn('status', ['present', 'late', 'half_day'])->count();
            $leaveCount = $dayLogs->where('status', 'on_leave')->count();
            
            $presentPercent = $deptEmployeesCount > 0 ? round(($presentCount / $deptEmployeesCount) * 100) : 0;
            $leavePercent = $deptEmployeesCount > 0 ? round(($leaveCount / $deptEmployeesCount) * 100) : 0;
            
            $weeklyActivity[] = [
                'day' => $days[$i],
                'present' => $presentPercent,
                'onLeave' => $leavePercent,
            ];
        }

        return response()->json([
            'department_employees' => $deptEmployeesCount,
            'pending_requests'     => ManpowerRequest::where('department_id', $deptId)->where('status', 'pending')->count(),
            'open_postings'        => JobPosting::where('department_id', $deptId)->where('status', 'published')->count(),
            'pending_leaves'       => LeaveRequest::whereHas('employee', fn ($q) => $q->where('department_id', $deptId))
                                        ->where('status', 'pending')->count(),
            'attendance_today'     => AttendanceLog::whereHas('employee', fn ($q) => $q->where('department_id', $deptId))
                                        ->where('date', today())->count(),
            'weekly_activity'      => $weeklyActivity,
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
        $approved = ManpowerRequest::whereIn('status', ['approved', 'fulfilled'])->count();
        $rejected = ManpowerRequest::whereIn('status', ['rejected', 'revised'])->count();

        $requestsByDepartment = ManpowerRequest::selectRaw('departments.department_name as name, COUNT(*) as value')
            ->join('departments', 'manpower_requests.department_id', '=', 'departments.id')
            ->groupBy('departments.department_name')
            ->get();

        $requestsByUrgency = ManpowerRequest::selectRaw('urgency as name, COUNT(*) as value')
            ->groupBy('urgency')
            ->get();

        $monthlyTrends = ManpowerRequest::whereYear('created_at', $year)
            ->selectRaw('MONTH(created_at) as month, COUNT(*) as count, SUM(headcount) as headcount')
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $trends30D = [];
        for ($i = 3; $i >= 0; $i--) {
            $weekStart = now()->subDays(($i + 1) * 7)->startOfDay();
            $weekEnd = now()->subDays($i * 7)->endOfDay();
            
            $count = ManpowerRequest::whereBetween('created_at', [$weekStart, $weekEnd])->count();
            $headcount = ManpowerRequest::whereBetween('created_at', [$weekStart, $weekEnd])->sum('headcount') ?: 0;
            
            $trends30D[] = [
                'label' => 'W' . (4 - $i),
                'requests' => $count,
                'headcount' => (int)$headcount,
            ];
        }

        $trends24H = [];
        for ($i = 3; $i >= 0; $i--) {
            $hourStart = now()->subHours(($i + 1) * 6);
            $hourEnd = now()->subHours($i * 6);
            
            $count = ManpowerRequest::whereBetween('created_at', [$hourStart, $hourEnd])->count();
            $headcount = ManpowerRequest::whereBetween('created_at', [$hourStart, $hourEnd])->sum('headcount') ?: 0;
            
            $trends24H[] = [
                'label' => $hourStart->format('H:i'),
                'requests' => $count,
                'headcount' => (int)$headcount,
            ];
        }

        $recentPending = ManpowerRequest::with('department')
            ->where('status', 'pending')
            ->orderByDesc('created_at')
            ->take(5)
            ->get();

        $recentHistory = ManpowerRequest::with('department')
            ->whereIn('status', ['approved', 'rejected', 'revised', 'fulfilled'])
            ->orderByDesc('updated_at')
            ->take(10)
            ->get();

        return response()->json([
            'total_requests'         => $total,
            'pending_requests'       => $pending,
            'approved_requests'      => $approved,
            'rejected_requests'      => $rejected,
            'requests_by_department' => $requestsByDepartment,
            'requests_by_urgency'    => $requestsByUrgency,
            'monthly_trends'         => $monthlyTrends,
            'trends_30d'             => $trends30D,
            'trends_24h'             => $trends24H,
            'recent_pending'         => $recentPending,
            'recent_history'         => $recentHistory,
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
