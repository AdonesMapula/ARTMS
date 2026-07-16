import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import artmsLogo from "../../assets/Logo/ARTMS_LOGO.png";
import authService from "../../services/authService";

export default function ForgotPassword() {
  const [email, setEmail]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [sent, setSent]         = useState(false);
  const navigate                = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
      // After 1.5 s redirect to OTP page, passing email via state
      setTimeout(() => navigate("/otp", { state: { email } }), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Could not send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 py-16">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src={artmsLogo} alt="ARTMS" className="h-16 w-auto" />
          <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Password Recovery
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/8">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#060F5A] mb-6"
          >
            <ArrowLeft size={15} /> Back to login
          </Link>

          <h1 className="text-xl font-extrabold text-slate-900">Forgot Password</h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter your work email and we'll send a 6-digit OTP to reset your password.
          </p>

          {sent ? (
            <div className="mt-6 flex flex-col items-center gap-3 text-center">
              <CheckCircle size={40} className="text-green-500" />
              <p className="font-semibold text-slate-800">OTP sent!</p>
              <p className="text-sm text-slate-500">
                Check your inbox at <strong>{email}</strong>. Redirecting to verification…
              </p>
            </div>
          ) : (
            <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Work Email
                </label>
                <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50 focus-within:border-[#060F5A] focus-within:ring-2 focus-within:ring-[#060F5A]/20">
                  <Mail size={17} className="absolute left-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full rounded-xl bg-transparent py-3 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#060F5A] py-3 text-sm font-semibold text-white shadow-lg shadow-[#060F5A]/20 transition hover:bg-[#0B1B78] disabled:opacity-70"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>Send OTP <ArrowRight size={15} /></>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
