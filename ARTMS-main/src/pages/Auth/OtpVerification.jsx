import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Eye, EyeOff } from "lucide-react";
import artmsLogo from "../../assets/Logo/ARTMS_LOGO.png";
import authService from "../../services/authService";

export default function OtpVerification() {
  const { state }             = useLocation();        // { email } passed from ForgotPassword
  const navigate              = useNavigate();

  const [email, setEmail]     = useState(state?.email || "");
  const [otp, setOtp]         = useState("");
  const [step, setStep]       = useState("verify");   // "verify" | "reset"
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  const passwordRef    = useRef();
  const confirmRef     = useRef();
  const [showPw, setShowPw]   = useState(false);

  // Step 1 — verify the OTP
  const handleVerify = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await authService.verifyOtp(email, otp);
      setStep("reset");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — set new password
  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    const pw  = passwordRef.current.value;
    const cpw = confirmRef.current.value;
    if (pw !== cpw) { setError("Passwords do not match."); return; }
    if (pw.length < 8) { setError("Password must be at least 8 characters."); return; }

    setLoading(true);
    try {
      await authService.resetPassword(email, otp, pw, cpw);
      setSuccess("Password reset successfully! Redirecting to login…");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    setError(""); setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSuccess("New OTP sent to your email.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to resend OTP.");
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
            OTP Verification
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/8">
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#060F5A] mb-6"
          >
            <ArrowLeft size={15} /> Back
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck size={28} className="text-[#060F5A]" />
            <div>
              <h1 className="text-lg font-extrabold text-slate-900">
                {step === "verify" ? "Enter OTP" : "Set New Password"}
              </h1>
              <p className="text-sm text-slate-500">
                {step === "verify"
                  ? `We sent a 6-digit code to ${email || "your email"}.`
                  : "Choose a strong new password."}
              </p>
            </div>
          </div>

          {error   && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}
          {success && <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">{success}</div>}

          {step === "verify" ? (
            <form className="grid gap-4" onSubmit={handleVerify}>
              {/* Email (editable in case they navigated here directly) */}
              {!state?.email && (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
                  <input
                    type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm focus:outline-none focus:border-[#060F5A] focus:ring-2 focus:ring-[#060F5A]/20"
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">6-Digit OTP</label>
                <input
                  type="text" required maxLength={6} value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-center text-2xl font-bold tracking-[0.4em] focus:outline-none focus:border-[#060F5A] focus:ring-2 focus:ring-[#060F5A]/20"
                />
              </div>

              <button
                type="submit" disabled={loading || otp.length < 6}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#060F5A] py-3 text-sm font-semibold text-white disabled:opacity-60 transition hover:bg-[#0B1B78]"
              >
                {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : "Verify OTP"}
              </button>

              <button
                type="button" onClick={handleResend} disabled={loading}
                className="text-sm font-semibold text-[#060F5A] hover:underline text-center"
              >
                Didn't receive it? Resend OTP
              </button>
            </form>
          ) : (
            <form className="grid gap-4" onSubmit={handleReset}>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">New Password</label>
                <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50 focus-within:border-[#060F5A] focus-within:ring-2 focus-within:ring-[#060F5A]/20">
                  <input
                    ref={passwordRef} type={showPw ? "text" : "password"} required minLength={8}
                    placeholder="Min. 8 characters"
                    className="w-full rounded-xl bg-transparent py-3 pl-4 pr-11 text-sm focus:outline-none"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3.5 text-slate-400">
                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Confirm Password</label>
                <input
                  ref={confirmRef} type="password" required minLength={8}
                  placeholder="Repeat your new password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm focus:outline-none focus:border-[#060F5A] focus:ring-2 focus:ring-[#060F5A]/20"
                />
              </div>

              <button
                type="submit" disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#060F5A] py-3 text-sm font-semibold text-white disabled:opacity-60 transition hover:bg-[#0B1B78]"
              >
                {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : "Reset Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
