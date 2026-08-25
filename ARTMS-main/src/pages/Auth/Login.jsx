import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail, KeyRound, Eye, EyeOff, ArrowRight, ShieldCheck, ArrowLeft,
  RotateCcw, CheckCircle2, AlertCircle, Lock
} from "lucide-react";
import artmsLogo from "../../assets/Logo/ARTMS_LOGO_white.png";
import loginBg from "../../assets/Backgrounds/login-bg.jpg";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 2-Step Flow State
  const [step, setStep] = useState("credentials"); // "credentials" | "otp"
  const [verificationId, setVerificationId] = useState("");
  const [emailHint, setEmailHint] = useState("");
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [expiresIn, setExpiresIn] = useState(600);

  const emailRef    = useRef();
  const passwordRef = useRef();
  const otpInputsRef = useRef([]);

  const { login, verifyLoginOtp, resendLoginOtp } = useAuth();
  const navigate   = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const t = requestAnimationFrame(() => setLoaded(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Countdown timer for OTP Expiry and Resend Cooldown
  useEffect(() => {
    if (step !== "otp") return;

    const timer = setInterval(() => {
      setExpiresIn((prev) => (prev > 0 ? prev - 1 : 0));
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  // Focus first OTP input on step change
  useEffect(() => {
    if (step === "otp" && otpInputsRef.current[0]) {
      setTimeout(() => otpInputsRef.current[0]?.focus(), 150);
    }
  }, [step]);

  // Format seconds to mm:ss
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // ── Step 1: Submit Credentials ──────────────────────────────────────────
  const handleCredentialSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsLoading(true);

    const email = (emailRef.current?.value || "").trim();
    const password = (passwordRef.current?.value || "").trim();

    if (!email || !password) {
      setError("Please enter both email and password.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await login(email, password);

      // If OTP verification is required (non-Super-Admin)
      if (result && result.requires_otp) {
        setVerificationId(result.verification_id);
        setEmailHint(result.email_hint || email);
        setExpiresIn(result.expires_in || 600);
        setResendCooldown(result.resend_cooldown || 60);
        setOtpValues(["", "", "", "", "", ""]);
        setStep("otp");
      } else if (result && result.role) {
        // Direct login (Super Admin)
        navigate(authService.getRolePath(result.role), { replace: true });
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Login failed. Please check your credentials.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: Handle OTP Input Navigation ────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste of multiple characters
      const pasted = value.replace(/\D/g, "").slice(0, 6).split("");
      if (pasted.length > 0) {
        const next = [...otpValues];
        pasted.forEach((char, i) => {
          if (index + i < 6) next[index + i] = char;
        });
        setOtpValues(next);
        const focusIdx = Math.min(index + pasted.length, 5);
        otpInputsRef.current[focusIdx]?.focus();
      }
      return;
    }

    // Only allow digits
    const cleanDigit = value.replace(/\D/g, "");
    const next = [...otpValues];
    next[index] = cleanDigit;
    setOtpValues(next);

    // Auto-advance to next input if digit entered
    if (cleanDigit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const next = [...otpValues];
    pastedData.split("").forEach((char, i) => {
      if (i < 6) next[i] = char;
    });
    setOtpValues(next);
    const focusIdx = Math.min(pastedData.length, 5);
    otpInputsRef.current[focusIdx]?.focus();
  };

  // ── Step 2: Submit OTP Verification ────────────────────────────────────
  const handleOtpSubmit = async (e) => {
    e?.preventDefault();
    setError("");
    setSuccessMsg("");

    const fullOtp = otpValues.join("").trim();
    if (fullOtp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsLoading(true);

    try {
      const user = await verifyLoginOtp(verificationId, fullOtp);
      navigate(authService.getRolePath(user.role), { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Verification failed. Please check your code and try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: Resend OTP Code ───────────────────────────────────────────
  const handleResendCode = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setError("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      const response = await resendLoginOtp(verificationId);
      setSuccessMsg(response.message || "A new verification code has been sent to your email.");
      setResendCooldown(response.resend_cooldown || 60);
      setExpiresIn(response.expires_in || 600);
      setOtpValues(["", "", "", "", "", ""]);
      otpInputsRef.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    setStep("credentials");
    setError("");
    setSuccessMsg("");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-900">
      {/* Background photo */}
      <div
        className="fixed inset-0 z-0 scale-105 bg-cover bg-center"
        style={{ backgroundImage: `url(${loginBg})` }}
        aria-hidden="true"
      />
      {/* Layered navy vignette */}
      <div
        className="fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(120% 65% at 50% 38%, rgba(6,15,90,0.10) 0%, rgba(6,15,90,0.55) 100%)",
        }}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 z-0 bg-gradient-to-b from-[#060F5A]/45 via-transparent to-[#060F5A]/55"
        aria-hidden="true"
      />
      {/* Soft accent glow, bottom-right */}
      <div
        className="pointer-events-none fixed -bottom-32 -right-24 z-0 h-96 w-96 rounded-full bg-[#F97316]/20 blur-[100px]"
        aria-hidden="true"
      />

      {/* Main container */}
      <div className="relative z-10">
        {/* Top left link */}
        {step === "credentials" ? (
          <Link
            to="/"
            className="fixed left-6 top-6 z-20 inline-flex items-center gap-1.5 text-sm font-semibold text-white/90 transition-colors hover:text-white"
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}
          >
            <ArrowLeft size={16} />
            Back to website
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleBackToCredentials}
            className="fixed left-6 top-6 z-20 inline-flex items-center gap-1.5 text-sm font-semibold text-white/90 transition-colors hover:text-white cursor-pointer"
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}
          >
            <ArrowLeft size={16} />
            Change Email / Password
          </button>
        )}

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-16">
          {/* Logo + heading */}
          <div
            className={`relative flex flex-col items-center text-center transition-all duration-700 ${
              loaded ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
            }`}
          >
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-40 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40 blur-3xl"
              aria-hidden="true"
            />
            <img
              src={artmsLogo}
              alt="ARTMS logo"
              className="h-20 w-auto drop-shadow-[0_4px_16px_rgba(0,0,0,0.35)] sm:h-24"
            />
            <p
              className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/90"
              style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}
            >
              Administrative Portal
            </p>
          </div>

          {/* Card */}
          <div
            className={`mt-8 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-black/30 transition-all duration-500 ${
              loaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
            style={{ transitionDelay: "120ms" }}
          >
            {/* ── STEP 1: EMAIL & PASSWORD ────────────────────────────── */}
            {step === "credentials" ? (
              <>
                <h1 className="text-xl font-extrabold text-slate-900">Sign In</h1>
                <p className="mt-1 text-sm text-slate-500">
                  Please enter your credentials to access the platform.
                </p>

                <form className="mt-6 grid gap-5" onSubmit={handleCredentialSubmit}>
                  {/* Error Alert */}
                  {error && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                      <AlertCircle size={18} className="shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Email Address
                    </label>
                    <div className="group relative flex items-center rounded-xl border border-slate-200 bg-slate-50 transition-colors focus-within:border-[#060F5A] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#060F5A]/20">
                      <Mail
                        size={18}
                        className="pointer-events-none absolute left-3.5 text-slate-400 group-focus-within:text-[#060F5A]"
                      />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        ref={emailRef}
                        placeholder="username@company.com"
                        autoComplete="username"
                        onBlur={(e) => {
                          e.target.value = e.target.value.trim();
                        }}
                        className="w-full rounded-xl bg-transparent py-3 pl-11 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label
                      htmlFor="password"
                      className="mb-1.5 block text-sm font-semibold text-slate-700"
                    >
                      Password
                    </label>
                    <div className="group relative flex items-center rounded-xl border border-slate-200 bg-slate-50 transition-colors focus-within:border-[#060F5A] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#060F5A]/20">
                      <KeyRound
                        size={18}
                        className="pointer-events-none absolute left-3.5 text-slate-400 group-focus-within:text-[#060F5A]"
                      />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        ref={passwordRef}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        onKeyDown={(e) => {
                          if (e.key === " ") e.preventDefault();
                        }}
                        onChange={(e) => {
                          if (e.target.value.includes(" ")) {
                            e.target.value = e.target.value.replace(/\s+/g, "");
                          }
                        }}
                        onBlur={(e) => {
                          e.target.value = e.target.value.trim();
                        }}
                        className="w-full rounded-xl bg-transparent py-3 pl-11 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3.5 text-slate-400 transition-colors hover:text-[#060F5A]"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Remember me / forgot */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-[#060F5A] focus:ring-[#060F5A]"
                      />
                      Remember Me
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-sm font-semibold text-[#060F5A] hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#060F5A] py-3 text-sm font-semibold text-white shadow-lg shadow-[#060F5A]/20 transition-all duration-200 hover:scale-[1.01] hover:bg-[#0B1B78] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Validating Credentials...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* ── STEP 2: 6-DIGIT OTP VERIFICATION ──────────────────── */
              <>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#060F5A] shadow-inner">
                    <Lock size={22} />
                  </div>
                  <div>
                    <h1 className="text-xl font-extrabold text-slate-900">Two-Step Verification</h1>
                    <p className="text-xs font-semibold text-[#060F5A]">Security Code Required</p>
                  </div>
                </div>

                <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                  We sent a 6-digit verification code to{" "}
                  <strong className="text-slate-900 font-semibold">{emailHint}</strong>.
                </p>

                {/* Alerts */}
                {error && (
                  <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-600" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <form className="mt-6" onSubmit={handleOtpSubmit}>
                  {/* 6 Digit OTP Input Grid */}
                  <div className="flex items-center justify-between gap-2 sm:gap-2.5" onPaste={handleOtpPaste}>
                    {otpValues.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputsRef.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className={`h-13 w-11 sm:h-14 sm:w-13 text-center text-xl font-bold text-slate-900 rounded-xl border ${
                          digit
                            ? "border-[#060F5A] bg-blue-50/40 ring-2 ring-[#060F5A]/15"
                            : "border-slate-200 bg-slate-50 focus:border-[#060F5A] focus:bg-white focus:ring-2 focus:ring-[#060F5A]/20"
                        } outline-none transition-all`}
                        autoComplete="one-time-code"
                      />
                    ))}
                  </div>

                  {/* Expiration Timer & Resend */}
                  <div className="mt-5 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>
                      Code expires in:{" "}
                      <strong className={`font-mono font-semibold ${expiresIn < 60 ? "text-red-600" : "text-slate-800"}`}>
                        {formatTimer(expiresIn)}
                      </strong>
                    </span>

                    {resendCooldown > 0 ? (
                      <span className="text-slate-400">
                        Resend in <strong className="font-mono text-slate-600">{resendCooldown}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1 font-semibold text-[#060F5A] hover:underline cursor-pointer disabled:opacity-50"
                      >
                        <RotateCcw size={13} />
                        Resend Code
                      </button>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading || otpValues.join("").length !== 6 || expiresIn === 0}
                    className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#060F5A] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#060F5A]/20 transition-all duration-200 hover:scale-[1.01] hover:bg-[#0B1B78] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Verifying Code...
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} />
                        Verify & Sign In
                      </>
                    )}
                  </button>

                  {/* Back to credentials link */}
                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={handleBackToCredentials}
                      className="text-xs font-semibold text-slate-500 hover:text-[#060F5A] hover:underline cursor-pointer"
                    >
                      Use a different account or re-enter password
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* Footer Security Disclaimer */}
          <div
            className={`mt-6 max-w-lg text-center transition-all duration-700 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            <p
              className="flex items-center justify-center gap-1.5 text-xs font-medium text-white/90"
              style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
            >
              <ShieldCheck size={14} className="text-[#F97316]" />
              Role-Based Authentication & Two-Step Verification Protected
            </p>
            <p
              className="mt-2 text-xs font-medium leading-relaxed text-white/70"
              style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
            >
              Unauthorized access to this HR Information System is strictly prohibited and subject to
              organizational policy and legal action.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}