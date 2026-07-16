import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import DepartmentHeadLayout from "../layouts/DepartmentHeadLayout";
import AdminLayout from "../layouts/AdminLayout";
import SuperAdminLayout from "../layouts/SuperAdminLayout";
import ProtectedRoute from "../components/ProtectedRoute";
import GuestRoute from "../components/GuestRoute";

// Public
import Home from "../pages/Public/Home";
import About from "../pages/Public/About";
import Jobs from "../pages/Public/Jobs";
import JobDetails from "../pages/Public/JobDetails";
import Apply from "../pages/Public/Apply";
import Contact from "../pages/Public/Contact";
import NotFound from "../pages/Public/NotFound";

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
import ApplicantDetails from "../pages/Admin/ApplicantDetails";
import AiScreening from "../pages/Admin/AiScreening";
import Interviews from "../pages/Admin/Interviews";
import Pipeline from "../pages/Admin/Pipeline";
import Employees from "../pages/Admin/Employees";
import Reports from "../pages/Admin/Reports";
import AdminNotifications from "../pages/Admin/Notifications";
import Profile from "../pages/Admin/Profile";
import Settings from "../pages/Admin/Settings";

// Super Admin
import SuperAdminDashboard from "../pages/SuperAdmin/Dashboard";
import Users from "../pages/SuperAdmin/Users";
import Departments from "../pages/SuperAdmin/Departments";
import Roles from "../pages/SuperAdmin/Roles";
import SuperAdminSettings from "../pages/SuperAdmin/Settings";
import AuditLogs from "../pages/SuperAdmin/AuditLogs";

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

        {/* ── Department Head (role-protected) ──────────────────────────── */}
        <Route element={<ProtectedRoute allowedRoles={["department_head"]} />}>
          <Route path="/department-head" element={<DepartmentHeadLayout />}>
            <Route index element={<Navigate to="/department-head/dashboard" replace />} />
            <Route path="dashboard" element={<DepartmentHeadDashboard />} />
            <Route path="manpower-request" element={<ManpowerRequest />} />
            <Route path="request-history" element={<RequestHistory />} />
            <Route path="notifications" element={<DepartmentHeadNotifications />} />
          </Route>
        </Route>

        {/* ── HR Admin + COO (role-protected) ───────────────────────────── */}
        <Route element={<ProtectedRoute allowedRoles={["hr_admin", "coo", "employee"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="manpower-requests" element={<AdminManpowerRequests />} />
            <Route path="job-library" element={<JobLibrary />} />
            <Route path="job-posting" element={<JobPosting />} />
            <Route path="applicants" element={<Applicants />} />
            <Route path="applicants/:id" element={<ApplicantDetails />} />
            <Route path="ai-screening" element={<AiScreening />} />
            <Route path="interviews" element={<Interviews />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="employees" element={<Employees />} />
            <Route path="reports" element={<Reports />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>

        {/* ── Super Admin (role-protected) ──────────────────────────────── */}
        <Route element={<ProtectedRoute allowedRoles={["super_admin"]} />}>
          <Route path="/superadmin" element={<SuperAdminLayout />}>
            <Route index element={<Navigate to="/superadmin/dashboard" replace />} />
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="departments" element={<Departments />} />
            <Route path="roles" element={<Roles />} />
            <Route path="settings" element={<SuperAdminSettings />} />
            <Route path="audit-logs" element={<AuditLogs />} />
          </Route>
        </Route>

        {/* ── Fallback ──────────────────────────────────────────────────── */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}