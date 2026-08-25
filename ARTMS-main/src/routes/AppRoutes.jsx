import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SplashScreen from "../components/ui/SplashScreen";
import PublicLayout from "../layouts/PublicLayout";
import DepartmentHeadLayout from "../layouts/DepartmentHeadLayout";
import AdminLayout from "../layouts/AdminLayout";
import SuperAdminLayout from "../layouts/SuperAdminLayout";
import CooLayout from "../layouts/CooLayout";
import ProtectedRoute from "../components/ProtectedRoute";
import PermissionProtectedRoute from "../components/PermissionProtectedRoute";
import GuestRoute from "../components/GuestRoute";

// ── Lazy-Loaded Public Pages ────────────────────────────────────────────────
const Home = lazy(() => import("../pages/Public/Home"));
const About = lazy(() => import("../pages/Public/About"));
const Jobs = lazy(() => import("../pages/Public/Jobs"));
const JobDetails = lazy(() => import("../pages/Public/JobDetails"));
const Apply = lazy(() => import("../pages/Public/Apply"));
const Contact = lazy(() => import("../pages/Public/Contact"));
const ApplicationGuide = lazy(() => import("../pages/Public/ApplicationGuide"));
const NotFound = lazy(() => import("../pages/Public/NotFound"));
const AccessDenied = lazy(() => import("../pages/Public/AccessDenied"));

// ── Lazy-Loaded Auth Pages ──────────────────────────────────────────────────
const Login = lazy(() => import("../pages/Auth/Login"));
const ForgotPassword = lazy(() => import("../pages/Auth/ForgotPassword"));
const OtpVerification = lazy(() => import("../pages/Auth/OtpVerification"));
const SetupAccount = lazy(() => import("../pages/Auth/SetupAccount"));

// ── Lazy-Loaded Department Head Pages ───────────────────────────────────────
const DepartmentHeadDashboard = lazy(() => import("../pages/DepartmentHead/Dashboard"));
const ManpowerRequest = lazy(() => import("../pages/DepartmentHead/ManpowerRequest"));
const RequestHistory = lazy(() => import("../pages/DepartmentHead/RequestHistory"));
const DepartmentHeadNotifications = lazy(() => import("../pages/DepartmentHead/Notifications"));
const DepartmentHeadProfile = lazy(() => import("../pages/DepartmentHead/Profile"));

// ── Lazy-Loaded HR Admin Pages ──────────────────────────────────────────────
const AdminDashboard = lazy(() => import("../pages/Admin/Dashboard"));
const AdminManpowerRequests = lazy(() => import("../pages/Admin/ManpowerRequests"));
const JobLibrary = lazy(() => import("../pages/Admin/JobLibrary"));
const JobPosting = lazy(() => import("../pages/Admin/JobPosting"));
const Applicants = lazy(() => import("../pages/Admin/Applicants"));
const AiScreening = lazy(() => import("../pages/Admin/AiScreening"));
const Interviews = lazy(() => import("../pages/Admin/Interviews"));
const InterviewCalendar = lazy(() => import("../pages/Admin/InterviewCalendar"));
const Pipeline = lazy(() => import("../pages/Admin/Pipeline"));
const Employees = lazy(() => import("../pages/Admin/Employees"));
const Reports = lazy(() => import("../pages/Admin/Reports"));
const Attendance = lazy(() => import("../pages/Admin/Attendance"));
const AdminNotifications = lazy(() => import("../pages/Admin/Notifications"));
const AdminProfile = lazy(() => import("../pages/Admin/Profile"));
const Settings = lazy(() => import("../pages/Admin/Settings"));

// ── Lazy-Loaded Video Interview Pages ───────────────────────────────────────
const ActiveInterviewRoom = lazy(() => import("../pages/Interview/ActiveInterviewRoom"));
const InterviewReport = lazy(() => import("../pages/Interview/InterviewReport"));

// ── Lazy-Loaded COO Pages ───────────────────────────────────────────────────
const CooDashboard = lazy(() => import("../pages/Coo/Dashboard"));
const ManpowerApprovals = lazy(() => import("../pages/Coo/ManpowerApprovals"));
const JobLibraryApprovals = lazy(() => import("../pages/Coo/JobLibraryApprovals"));
const CooNotifications = lazy(() => import("../pages/Coo/Notifications"));
const CooProfile = lazy(() => import("../pages/Coo/Profile"));

// ── Lazy-Loaded Super Admin Pages ───────────────────────────────────────────
const SuperAdminDashboard = lazy(() => import("../pages/SuperAdmin/Dashboard"));
const Users = lazy(() => import("../pages/SuperAdmin/Users"));
const ArchivedUsers = lazy(() => import("../pages/SuperAdmin/ArchivedUsers"));
const Departments = lazy(() => import("../pages/SuperAdmin/Departments"));
const Roles = lazy(() => import("../pages/SuperAdmin/Roles"));
const SuperAdminSettings = lazy(() => import("../pages/SuperAdmin/Settings"));
const AuditLogs = lazy(() => import("../pages/SuperAdmin/AuditLogs"));
const SuperAdminProfile = lazy(() => import("../pages/SuperAdmin/Profile"));
const HrManpowerRequests = lazy(() => import("../pages/SuperAdmin/HrManpowerRequests"));
const HrJobLibrary = lazy(() => import("../pages/SuperAdmin/HrJobLibrary"));
const HrJobPosting = lazy(() => import("../pages/SuperAdmin/HrJobPosting"));
const HrApplicants = lazy(() => import("../pages/SuperAdmin/HrApplicants"));
const HrAiScreening = lazy(() => import("../pages/SuperAdmin/HrAiScreening"));
const HrInterviews = lazy(() => import("../pages/SuperAdmin/HrInterviews"));
const HrPipeline = lazy(() => import("../pages/SuperAdmin/HrPipeline"));
const HrEmployees = lazy(() => import("../pages/SuperAdmin/HrEmployees"));
const HrReports = lazy(() => import("../pages/SuperAdmin/HrReports"));
const HrAttendance = lazy(() => import("../pages/SuperAdmin/HrAttendance"));

// Debug (temporary)
const DebugPermissions = lazy(() => import("../pages/DebugPermissions"));

export default function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          {/* ── Public site (no auth required) ───────────────────────────── */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:id" element={<JobDetails />} />
            <Route path="/apply/:id" element={<Apply />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/application-guide" element={<ApplicationGuide />} />
          </Route>

          {/* ── Applicant Video Interview Room ── */}
          <Route path="/interview/:id/room" element={<ActiveInterviewRoom isApplicant={true} />} />

          {/* ── Auth pages ───── */}
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/otp" element={<OtpVerification />} />
            <Route path="/setup-account" element={<SetupAccount />} />
          </Route>

          {/* ── Access Denied ─────────────────────────────────────────────── */}
          <Route path="/access-denied" element={<AccessDenied />} />

          {/* ── Department Head (role-protected) ──────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={["department_head"]} />}>
            <Route path="/department-head" element={<DepartmentHeadLayout />}>
              <Route index element={<Navigate to="/department-head/dashboard" replace />} />
              <Route path="dashboard" element={<DepartmentHeadDashboard />} />
              
              <Route
                path="manpower-request"
                element={
                  <PermissionProtectedRoute permission="view_manpower_request">
                    <ManpowerRequest />
                  </PermissionProtectedRoute>
                }
              />
              <Route
                path="request-history"
                element={
                  <PermissionProtectedRoute permission="view_request_history">
                    <RequestHistory />
                  </PermissionProtectedRoute>
                }
              />
              
              <Route path="notifications" element={<DepartmentHeadNotifications />} />
              <Route path="profile" element={<DepartmentHeadProfile />} />
            </Route>
          </Route>

          {/* ── HR Admin (role-protected) ─────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={["hr_admin", "employee"]} />}>
            <Route path="/admin/interviews/:id/room" element={<ActiveInterviewRoom />} />
            <Route
              path="/admin/interviews/:id/report"
              element={
                <PermissionProtectedRoute permission="view_interviews">
                  <InterviewReport />
                </PermissionProtectedRoute>
              }
            />

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              
              <Route
                path="manpower-requests"
                element={
                  <PermissionProtectedRoute permission="view_manpower_requests">
                    <AdminManpowerRequests />
                  </PermissionProtectedRoute>
                }
              />
              <Route
                path="job-library"
                element={
                  <PermissionProtectedRoute permission="view_job_library">
                    <JobLibrary />
                  </PermissionProtectedRoute>
                }
              />
              <Route
                path="job-posting"
                element={
                  <PermissionProtectedRoute permission="view_job_postings">
                    <JobPosting />
                  </PermissionProtectedRoute>
                }
              />
              <Route
                path="applicants"
                element={
                  <PermissionProtectedRoute permission="view_applicants">
                    <Applicants />
                  </PermissionProtectedRoute>
                }
              />
              <Route
                path="ai-screening"
                element={
                  <PermissionProtectedRoute permission="view_ai_screening">
                    <AiScreening />
                  </PermissionProtectedRoute>
                }
              />
              <Route
                path="interviews"
                element={
                  <PermissionProtectedRoute permission="view_interviews">
                    <Interviews />
                  </PermissionProtectedRoute>
                }
              />
              <Route
                path="interviews/calendar"
                element={
                  <PermissionProtectedRoute permission="view_interviews">
                    <InterviewCalendar />
                  </PermissionProtectedRoute>
                }
              />
              <Route
                path="pipeline"
                element={
                  <PermissionProtectedRoute permission="view_pipeline">
                    <Pipeline />
                  </PermissionProtectedRoute>
                }
              />
              <Route
                path="employees"
                element={
                  <PermissionProtectedRoute permission="view_employees">
                    <Employees />
                  </PermissionProtectedRoute>
                }
              />
              <Route
                path="reports"
                element={
                  <PermissionProtectedRoute permission="view_reports">
                    <Reports />
                  </PermissionProtectedRoute>
                }
              />
              <Route
                path="attendance"
                element={
                  <PermissionProtectedRoute permission="view_employees">
                    <Attendance />
                  </PermissionProtectedRoute>
                }
              />
              
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="profile" element={<AdminProfile />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>

          {/* ── COO (role-protected) ──────────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={["coo"]} />}>
            <Route path="/coo" element={<CooLayout />}>
              <Route index element={<Navigate to="/coo/dashboard" replace />} />
              <Route path="dashboard" element={<CooDashboard />} />
              
              <Route
                path="prf-approvals"
                element={
                  <PermissionProtectedRoute permission="view_prf_approvals">
                    <ManpowerApprovals />
                  </PermissionProtectedRoute>
                }
              />
              <Route
                path="job-library-approvals"
                element={
                  <PermissionProtectedRoute permission="view_job_library_approvals">
                    <JobLibraryApprovals />
                  </PermissionProtectedRoute>
                }
              />
              
              <Route path="notifications" element={<CooNotifications />} />
              <Route path="profile" element={<CooProfile />} />
            </Route>
          </Route>

          {/* ── Super Admin (role-protected) ──────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={["super_admin"]} />}>
            <Route path="/superadmin/interviews/:id/room" element={<ActiveInterviewRoom />} />
            <Route path="/superadmin/interviews/:id/report" element={<InterviewReport />} />

            <Route path="/superadmin" element={<SuperAdminLayout />}>
              <Route index element={<Navigate to="/superadmin/dashboard" replace />} />
              <Route path="dashboard" element={<SuperAdminDashboard />} />
              
              <Route
                path="users"
                element={
                  <PermissionProtectedRoute permission="view_users">
                    <Users />
                  </PermissionProtectedRoute>
                }
              />
              <Route
                path="archived-users"
                element={
                  <PermissionProtectedRoute permission="view_users">
                    <ArchivedUsers />
                  </PermissionProtectedRoute>
                }
              />
              <Route
                path="departments"
                element={
                  <PermissionProtectedRoute permission="view_departments">
                    <Departments />
                  </PermissionProtectedRoute>
                }
              />
              <Route
                path="roles"
                element={
                  <PermissionProtectedRoute permission="view_roles">
                    <Roles />
                  </PermissionProtectedRoute>
                }
              />
              
              <Route path="settings" element={<SuperAdminSettings />} />
              <Route path="audit-logs" element={<AuditLogs />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="profile" element={<SuperAdminProfile />} />
              
              <Route path="debug-permissions" element={<DebugPermissions />} />
              
              <Route path="manpower-requests" element={<HrManpowerRequests />} />
              <Route path="hr-manpower-requests" element={<HrManpowerRequests />} />
              <Route path="job-library" element={<HrJobLibrary />} />
              <Route path="hr-job-library" element={<HrJobLibrary />} />
              <Route path="job-posting" element={<HrJobPosting />} />
              <Route path="hr-job-posting" element={<HrJobPosting />} />
              <Route path="applicants" element={<HrApplicants />} />
              <Route path="hr-applicants" element={<HrApplicants />} />
              <Route path="ai-screening" element={<HrAiScreening />} />
              <Route path="hr-ai-screening" element={<HrAiScreening />} />
              <Route path="interviews" element={<HrInterviews />} />
              <Route path="hr-interviews" element={<HrInterviews />} />
              <Route path="pipeline" element={<HrPipeline />} />
              <Route path="hr-pipeline" element={<HrPipeline />} />
              <Route path="employees" element={<HrEmployees />} />
              <Route path="hr-employees" element={<HrEmployees />} />
              <Route path="reports" element={<HrReports />} />
              <Route path="hr-reports" element={<HrReports />} />
              <Route path="attendance" element={<HrAttendance />} />
              <Route path="hr-attendance" element={<HrAttendance />} />
            </Route>
          </Route>

          {/* ── Fallback ──────────────────────────────────────────────────── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}