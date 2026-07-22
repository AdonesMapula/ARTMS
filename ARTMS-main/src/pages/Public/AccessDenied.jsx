import { ShieldAlert, Home, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";

export default function AccessDenied() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    // Navigate based on user role
    if (user.role === "super_admin") {
      navigate("/superadmin/dashboard");
    } else if (user.role === "hr_admin") {
      navigate("/admin/dashboard");
    } else if (user.role === "coo") {
      navigate("/coo/dashboard");
    } else if (user.role === "department_head") {
      navigate("/department-head/dashboard");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-lg">
        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <ShieldAlert size={40} className="text-red-600" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-slate-900">
              Access Denied
            </h1>
            <p className="mt-3 text-base text-slate-600">
              You don't have permission to access this page.
            </p>

            {/* Details Box */}
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
              <p className="text-sm font-semibold text-amber-900">
                📋 What you can do:
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-amber-800">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-amber-600">•</span>
                  <span>
                    Contact your <strong>System Administrator</strong> to
                    request access
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-amber-600">•</span>
                  <span>
                    Check if you're logged in with the correct account
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-amber-600">•</span>
                  <span>Return to your dashboard to continue working</span>
                </li>
              </ul>
            </div>

            {/* User Info */}
            {user.name && (
              <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
                <p className="text-slate-500">Currently logged in as:</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {user.name}
                  {user.role && (
                    <span className="ml-2 rounded bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700">
                      {user.role.replace(/_/g, " ").toUpperCase()}
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={handleGoBack}
                className="flex-1 gap-2"
              >
                Go Back
              </Button>
              <Button
                variant="primary"
                onClick={handleGoHome}
                className="flex-1 gap-2"
              >
                <Home size={16} />
                Go to Dashboard
              </Button>
            </div>

            {/* Contact Support */}
            <div className="mt-6 border-t border-slate-200 pt-6">
              <p className="text-xs text-slate-500">
                Need help? Contact your administrator or IT support
              </p>
              <button className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#111A62] hover:underline">
                <Mail size={12} />
                support@accel4u.com
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          ARTMS - Accel4u Recruitment & Talent Management System
        </p>
      </div>
    </div>
  );
}
