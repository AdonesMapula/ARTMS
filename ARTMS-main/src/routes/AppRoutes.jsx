import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SplashScreen from "../components/ui/SplashScreen";
import PageLoader from "../components/ui/PageLoader";
import PublicLayout from "../layouts/PublicLayout";
import DepartmentHeadLayout from "../layouts/DepartmentHeadLayout";
import AdminLayout from "../layouts/AdminLayout";
import SuperAdminLayout from "../layouts/SuperAdminLayout";
import CooLayout from "../layouts/CooLayout";
import ProtectedRoute from "../components/ProtectedRoute";
import PermissionProtectedRoute from "../components/PermissionProtectedRoute";
import GuestRoute from "../components/GuestRoute";

// Safe lazy loader that automatically reloads the page if a stale chunk 404s after a deployment
function safeLazy(importFn) {
  return lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      const pageKey = "chunk_reload_" + window.location.pathname;
      const isReloaded = sessionStorage.getItem(pageKey);
      if (!isReloaded) {
        sessionStorage.setItem(pageKey, "true");
        window.location.reload();
        return new Promise(() => {});
      }
      sessionStorage.removeItem(pageKey);
      throw error;
    }
  });
}

// ── Lazy-Loaded Public Pages ────────────────────────────────────────────────
const Home = safeLazy(() => import("../pages/Public/Home"));
const About = safeLazy(() => import("../pages/Public/About"));
const Jobs = safeLazy(() => import("../pages/Public/Jobs"));
const JobDetails = safeLazy(() => import("../pages/Public/JobDetails"));
const Apply = safeLazy(() => import("../pages/Public/Apply"));
const Contact = safeLazy(() => import("../pages/Public/Contact"));
const ApplicationGuide = safeLazy(() => import("../pages/Public/ApplicationGuide"));
const NotFound = safeLazy(() => import("../pages/Public/NotFound"));
const AccessDenied = safeLazy(() => import("../pages/Public/AccessDenied"));

// ── Lazy-Loaded Auth Pages ──────────────────────────────────────────────────
const Login = safeLazy(() => import("../pages/Auth/Login"));
const ForgotPassword = safeLazy(() => import("../pages/Auth/ForgotPassword"));
const OtpVerification = safeLazy(() => import("../pages/Auth/OtpVerification"));
const SetupAccount = safeLazy(() => import("../pages/Auth/SetupAccount"));

// ── Lazy-Loaded Department Head Pages ───────────────────────────────────────
const DepartmentHeadDashboard = safeLazy(() => import("../pages/DepartmentHead/Dashboard"));
const ManpowerRequest = safeLazy(() => import("../pages/DepartmentHead/ManpowerRequest"));
const RequestHistory = safeLazy(() => import("../pages/DepartmentHead/RequestHistory"));
const DepartmentHeadNotifications = safeLazy(() => import("../pages/DepartmentHead/Notifications"));
const DepartmentHeadProfile = safeLazy(() => import("../pages/DepartmentHead/Profile"));

// ── Lazy-Loaded HR Admin Pages ──────────────────────────────────────────────
const AdminDashboard = safeLazy(() => import("../pages/Admin/Dashboard"));
const AdminManpowerRequests = safeLazy(() => import("../pages/Admin/ManpowerRequests"));
const JobLibrary = safeLazy(() => import("../pages/Admin/JobLibrary"));
const JobPosting = safeLazy(() => import("../pages/Admin/JobPosting"));
const Applicants = safeLazy(() => import("../pages/Admin/Applicants"));
const AiScreening = safeLazy(() => import("../pages/Admin/AiScreening"));
const Interviews = safeLazy(() => import("../pages/Admin/Interviews"));
const InterviewCalendar = safeLazy(() => import("../pages/Admin/InterviewCalendar"));
const Pipeline = safeLazy(() => import("../pages/Admin/Pipeline"));
const Employees = safeLazy(() => import("../pages/Admin/Employees"));
const Reports = safeLazy(() => import("../pages/Admin/Reports"));
const Attendance = safeLazy(() => import("../pages/Admin/Attendance"));
const AdminNotifications = safeLazy(() => import("../pages/Admin/Notifications"));
const AdminProfile = safeLazy(() => import("../pages/Admin/Profile"));
const Settings = safeLazy(() => import("../pages/Admin/Settings"));

// ── Lazy-Loaded Video Interview Pages ───────────────────────────────────────
const ActiveInterviewRoom = safeLazy(() => import("../pages/Interview/ActiveInterviewRoom"));
const InterviewReport = safeLazy(() => import("../pages/Interview/InterviewReport"));

// ── Lazy-Loaded COO Pages ───────────────────────────────────────────────────
const CooDashboard = safeLazy(() => import("../pages/Coo/Dashboard"));
const ManpowerApprovals = safeLazy(() => import("../pages/Coo/ManpowerApprovals"));
const JobLibraryApprovals = safeLazy(() => import("../pages/Coo/JobLibraryApprovals"));
const CooNotifications = safeLazy(() => import("../pages/Coo/Notifications"));
const CooProfile = safeLazy(() => import("../pages/Coo/Profile"));

// ── Lazy-Loaded Super Admin Pages ───────────────────────────────────────────
const SuperAdminDashboard = safeLazy(() => import("../pages/SuperAdmin/Dashboard"));
const Users = safeLazy(() => import("../pages/SuperAdmin/Users"));
const ArchivedUsers = safeLazy(() => import("../pages/SuperAdmin/ArchivedUsers"));
const Departments = safeLazy(() => import("../pages/SuperAdmin/Departments"));
const Roles = safeLazy(() => import("../pages/SuperAdmin/Roles"));
const SuperAdminSettings = safeLazy(() => import("../pages/SuperAdmin/Settings"));
const AuditLogs = safeLazy(() => import("../pages/SuperAdmin/AuditLogs"));
const SuperAdminProfile = safeLazy(() => import("../pages/SuperAdmin/Profile"));
const HrManpowerRequests = safeLazy(() => import("../pages/SuperAdmin/HrManpowerRequests"));
const HrJobLibrary = safeLazy(() => import("../pages/SuperAdmin/HrJobLibrary"));
const HrJobPosting = safeLazy(() => import("../pages/SuperAdmin/HrJobPosting"));
const HrApplicants = safeLazy(() => import("../pages/SuperAdmin/HrApplicants"));
const HrAiScreening = safeLazy(() => import("../pages/SuperAdmin/HrAiScreening"));
const HrInterviews = safeLazy(() => import("../pages/SuperAdmin/HrInterviews"));
const HrPipeline = safeLazy(() => import("../pages/SuperAdmin/HrPipeline"));
const HrEmployees = safeLazy(() => import("../pages/SuperAdmin/HrEmployees"));
const HrReports = safeLazy(() => import("../pages/SuperAdmin/HrReports"));
const HrAttendance = safeLazy(() => import("../pages/SuperAdmin/HrAttendance"));

// Debug (temporary)
const DebugPermissions = safeLazy(() => import("../pages/DebugPermissions"));

export default function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
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