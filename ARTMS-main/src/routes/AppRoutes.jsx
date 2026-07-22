import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import DepartmentHeadLayout from "../layouts/DepartmentHeadLayout";
import AdminLayout from "../layouts/AdminLayout";
import SuperAdminLayout from "../layouts/SuperAdminLayout";
import CooLayout from "../layouts/CooLayout";
import ProtectedRoute from "../components/ProtectedRoute";
import PermissionProtectedRoute from "../components/PermissionProtectedRoute";
import GuestRoute from "../components/GuestRoute";

// Public
import Home from "../pages/Public/Home";
import About from "../pages/Public/About";
import Jobs from "../pages/Public/Jobs";
import JobDetails from "../pages/Public/JobDetails";
import Apply from "../pages/Public/Apply";
import Contact from "../pages/Public/Contact";
import NotFound from "../pages/Public/NotFound";
import AccessDenied from "../pages/Public/AccessDenied";

// Auth
import Login from "../pages/Auth/Login";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import OtpVerification from "../pages/Auth/OtpVerification";

// Department Head
import DepartmentHeadDashboard from "../pages/DepartmentHead/Dashboard";
import ManpowerRequest from "../pages/DepartmentHead/ManpowerRequest";
import RequestHistory from "../pages/DepartmentHead/RequestHistory";
import DepartmentHeadNotifications from "../pages/DepartmentHead/Notifications";

// HR Admin
import AdminDashboard from "../pages/Admin/Dashboard";
import AdminManpowerRequests from "../pages/Admin/ManpowerRequests";
import JobLibrary from "../pages/Admin/JobLibrary";
import JobPosting from "../pages/Admin/JobPosting";
import Applicants from "../pages/Admin/Applicants";
import AiScreening from "../pages/Admin/AiScreening";
import Interviews from "../pages/Admin/Interviews";
import Pipeline from "../pages/Admin/Pipeline";
import Employees from "../pages/Admin/Employees";
import Reports from "../pages/Admin/Reports";
import AdminNotifications from "../pages/Admin/Notifications";
import Profile from "../pages/Admin/Profile";
import Settings from "../pages/Admin/Settings";

// COO
import CooDashboard from "../pages/Coo/Dashboard";
import ManpowerApprovals from "../pages/Coo/ManpowerApprovals";
import JobLibraryApprovals from "../pages/Coo/JobLibraryApprovals";
import JobPostingApprovals from "../pages/Coo/JobPostingApprovals";
import CooNotifications from "../pages/Coo/Notifications";

// Super Admin
import SuperAdminDashboard from "../pages/SuperAdmin/Dashboard";
import Users from "../pages/SuperAdmin/Users";
import Departments from "../pages/SuperAdmin/Departments";
import Roles from "../pages/SuperAdmin/Roles";
import SuperAdminSettings from "../pages/SuperAdmin/Settings";
import AuditLogs from "../pages/SuperAdmin/AuditLogs";
import HrManpowerRequests from "../pages/SuperAdmin/HrManpowerRequests";
import HrJobLibrary from "../pages/SuperAdmin/HrJobLibrary";
import HrJobPosting from "../pages/SuperAdmin/HrJobPosting";
import HrApplicants from "../pages/SuperAdmin/HrApplicants";
import HrAiScreening from "../pages/SuperAdmin/HrAiScreening";
import HrInterviews from "../pages/SuperAdmin/HrInterviews";
import HrPipeline from "../pages/SuperAdmin/HrPipeline";
import HrEmployees from "../pages/SuperAdmin/HrEmployees";
import HrReports from "../pages/SuperAdmin/HrReports";

// Debug (temporary)
import DebugPermissions from "../pages/DebugPermissions";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Public site (no auth required) ───────────────────────────── */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
          <Route path="/apply/:id" element={<Apply />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        {/* ── Auth pages (redirect to dashboard if already logged in) ───── */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/otp" element={<OtpVerification />} />
        </Route>

        {/* ── Access Denied ─────────────────────────────────────────────── */}
        <Route path="/access-denied" element={<AccessDenied />} />

        {/* ── Department Head (role-protected) ──────────────────────────── */}
        <Route element={<ProtectedRoute allowedRoles={["department_head"]} />}>
          <Route path="/department-head" element={<DepartmentHeadLayout />}>
            <Route index element={<Navigate to="/department-head/dashboard" replace />} />
            <Route path="dashboard" element={<DepartmentHeadDashboard />} />
            
            {/* Protected by permissions */}
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
          </Route>
        </Route>

        {/* ── HR Admin (role-protected) ─────────────────────────────────── */}
        <Route element={<ProtectedRoute allowedRoles={["hr_admin", "employee"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            
            {/* Protected by permissions */}
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
            
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>

        {/* ── COO (role-protected, own portal) ──────────────────────────── */}
        <Route element={<ProtectedRoute allowedRoles={["coo"]} />}>
          <Route path="/coo" element={<CooLayout />}>
            <Route index element={<Navigate to="/coo/dashboard" replace />} />
            <Route path="dashboard" element={<CooDashboard />} />
            
            {/* Protected by permissions */}
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
            <Route
              path="job-posting-approvals"
              element={
                <PermissionProtectedRoute permission="view_job_posting_approvals">
                  <JobPostingApprovals />
                </PermissionProtectedRoute>
              }
            />
            
            <Route path="notifications" element={<CooNotifications />} />
          </Route>
        </Route>

        {/* ── Super Admin (role-protected) ──────────────────────────────── */}
        <Route element={<ProtectedRoute allowedRoles={["super_admin"]} />}>
          <Route path="/superadmin" element={<SuperAdminLayout />}>
            <Route index element={<Navigate to="/superadmin/dashboard" replace />} />
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            
            {/* Protected by permissions */}
            <Route
              path="users"
              element={
                <PermissionProtectedRoute permission="view_users">
                  <Users />
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
            
            {/* Debug Page (temporary) */}
            <Route path="debug-permissions" element={<DebugPermissions />} />
            
            {/* HR Admin Access within SuperAdmin Layout */}
            <Route path="hr-manpower-requests" element={<HrManpowerRequests />} />
            <Route path="hr-job-library" element={<HrJobLibrary />} />
            <Route path="hr-job-posting" element={<HrJobPosting />} />
            <Route path="hr-applicants" element={<HrApplicants />} />
            <Route path="hr-ai-screening" element={<HrAiScreening />} />
            <Route path="hr-interviews" element={<HrInterviews />} />
            <Route path="hr-pipeline" element={<HrPipeline />} />
            <Route path="hr-employees" element={<HrEmployees />} />
            <Route path="hr-reports" element={<HrReports />} />
          </Route>
        </Route>

        {/* ── Fallback ──────────────────────────────────────────────────── */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}