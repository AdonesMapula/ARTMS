import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, KeyRound, Eye, EyeOff, ArrowRight, ShieldCheck, ArrowLeft, RefreshCw, Lock, Clock } from "lucide-react";
import artmsLogo from "../../assets/Logo/ARTMS_LOGO_white.png";
import loginBg from "../../assets/Backgrounds/login-bg.jpg";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ── Login Steps: 'credentials' | 'otp' ──
  const [loginStep, setLoginStep] = useState("credentials");
  const [verificationId, setVerificationId] = useState("");
  const [emailHint, setEmailHint] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes (in seconds)
  const [resendCooldown, setResendCooldown] = useState(60); // 60 seconds

  const emailRef = useRef();
  const passwordRef = useRef();
  const digitRefs = useRef([]);

  const { login, verifyLoginOtp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const t = requestAnimationFrame(() => setLoaded(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // ── Countdown Timer for OTP Expiration ──
  useEffect(() => {
    if (loginStep !== "otp" || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [loginStep, timeLeft]);

  // ── Resend Cooldown Timer ──
  useEffect(() => {
    if (loginStep !== "otp" || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [loginStep, resendCooldown]);

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ── Step 1: Submit Credentials ──
  const handleCredentialSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    const email = (emailRef.current?.value || "").trim();
    const password = (passwordRef.current?.value || "").trim();

    if (!email || !password) {
      setError("Please enter both email and password.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await login(email, password);

      // Super Admin: direct token login
      if (response.token && response.user) {
        navigate(authService.getRolePath(response.user.role), { replace: true });
        return;
      }

      // Non-Super-Admin: requires OTP
      if (response.requires_otp) {
        setVerificationId(response.verification_id);
        setEmailHint(response.email_hint || email);
        setTimeLeft(response.expires_in || 600);
        setResendCooldown(60);
        setOtpDigits(["", "", "", "", "", ""]);
        setLoginStep("otp");
        setTimeout(() => {
          digitRefs.current[0]?.focus();
        }, 100);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed. Please check your credentials.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Handle Single Digit Change in 6-Box Input ──
  const handleDigitChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, "");
    if (!cleanVal && value !== "") return;

    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal ? cleanVal.slice(-1) : "";
    setOtpDigits(newDigits);
    setError("");

    // Auto-advance to next box if digit entered
    if (cleanVal && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }

    // If all 6 digits are filled, auto-submit
    if (cleanVal && index === 5 && newDigits.every((d) => d !== "")) {
      const fullOtp = newDigits.join("");
      executeOtpVerification(fullOtp);
    }
  };

  // ── Handle Key Navigation (Backspace / Arrow) ──
  const handleDigitKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        digitRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      digitRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }
  };

  // ── Handle Paste of 6-digit Code ──
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newDigits = ["", "", "", "", "", ""];
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i];
    }
    setOtpDigits(newDigits);

    if (pastedData.length >= 6) {
      digitRefs.current[5]?.focus();
      executeOtpVerification(pastedData);
    } else {
      digitRefs.current[pastedData.length]?.focus();
    }
  };

  // ── Step 2: Verify OTP ──
  const executeOtpVerification = async (otpCode) => {
    if (!otpCode || otpCode.length !== 6) {
      setError("Please enter all 6 digits of the verification code.");
      return;
    }

    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const user = await verifyLoginOtp(verificationId, otpCode);
      navigate(authService.getRolePath(user.role), { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid or expired verification code.";
      setError(msg);
      // Clear OTP digits on error and refocus first box
      setOtpDigits(["", "", "", "", "", ""]);
      digitRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpFormSubmit = (e) => {
    e.preventDefault();
    const fullOtp = otpDigits.join("");
    executeOtpVerification(fullOtp);
  };

  // ── Resend OTP ──
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const res = await authService.resendLoginOtp(verificationId);
      setSuccess(res.message || "A new verification code has been sent to your email.");
      setResendCooldown(60);
      setTimeLeft(600);
      setOtpDigits(["", "", "", "", "", ""]);
      digitRefs.current[0]?.focus();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to resend code. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Back to Credentials ──
  const handleBackToCredentials = () => {
    setLoginStep("credentials");
    setError("");
    setSuccess("");
    setOtpDigits(["", "", "", "", "", ""]);
    setVerificationId("");
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
      {/* Soft accent glow */}
      <div
        className="pointer-events-none fixed -bottom-32 -right-24 z-0 h-96 w-96 rounded-full bg-[#F97316]/20 blur-[100px]"
        aria-hidden="true"
      />

      {/* Everything else sits above background */}
      <div className="relative z-10">
        {/* Back to public site */}
        <Link
          to="/"
          className="fixed left-6 top-6 z-20 inline-flex items-center gap-1.5 text-sm font-semibold text-white/90 transition-colors hover:text-white"
          style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}
        >
          <ArrowLeft size={16} />
          Back to website
        </Link>

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

          {/* Login Card */}
          <div
            className={`mt-8 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-black/30 transition-all duration-700 ${
              loaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
            style={{ transitionDelay: "120ms" }}
          >
            {loginStep === "credentials" ? (
              /* ── STEP 1: CREDENTIALS FORM ── */
              <>
                <h1 className="text-xl font-extrabold text-slate-900">Secure Login</h1>
                <p className="mt-1 text-sm text-slate-500">
                  Please verify your credentials to continue.
                </p>

                <form className="mt-6 grid gap-5" onSubmit={handleCredentialSubmit}>
                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                      {error}
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
                    <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">
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
                    className="group mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#060F5A] py-3 text-sm font-semibold text-white shadow-lg shadow-[#060F5A]/20 transition-all duration-200 hover:scale-[1.01] hover:bg-[#0B1B78] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Verifying credentials...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* ── STEP 2: 6-DIGIT OTP VERIFICATION FORM ── */
              <div>
                <button
                  type="button"
                  onClick={handleBackToCredentials}
                  className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-[#060F5A]"
                >
                  <ArrowLeft size={14} /> Back to credentials
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-[#060F5A]">
                    <Lock size={22} />
                  </div>
                  <div>
                    <h1 className="text-xl font-extrabold text-slate-900">Verify Identity</h1>
                    <p className="text-xs font-medium text-slate-500">
                      Two-Factor Authentication Required
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm text-slate-600">
                  We sent a 6-digit verification code to{" "}
                  <span className="font-semibold text-slate-900">{emailHint || "your registered email"}</span>.
                </p>

                {error && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                    {success}
                  </div>
                )}

                <form className="mt-6 grid gap-5" onSubmit={handleOtpFormSubmit}>
                  {/* 6-Box OTP Inputs */}
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Security Code
                    </label>
                    <div className="flex justify-between gap-2 sm:gap-2.5" onPaste={handlePaste}>
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (digitRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                          className="h-12 w-11 rounded-xl border border-slate-300 bg-slate-50 text-center text-xl font-extrabold text-slate-900 shadow-sm transition-all focus:border-[#060F5A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#060F5A]/20 sm:h-14 sm:w-13"
                          autoComplete="one-time-code"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Expiration Countdown Banner */}
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock size={14} className={timeLeft < 60 ? "text-red-500" : "text-slate-400"} />
                      Code expires in:
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        timeLeft < 60 ? "text-red-600 animate-pulse" : "text-slate-900"
                      }`}
                    >
                      {formatTime(timeLeft)}
                    </span>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading || otpDigits.some((d) => d === "")}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#060F5A] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#060F5A]/20 transition-all duration-200 hover:scale-[1.01] hover:bg-[#0B1B78] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        Verify & Sign In
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  {/* Resend Code Button with Cooldown */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || isLoading}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#060F5A] transition-colors hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
                    >
                      <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
                      {resendCooldown > 0
                        ? `Resend code in ${resendCooldown}s`
                        : "Didn't receive code? Resend"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

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
              Secure 2FA enabled for all HR, Executive, and Staff accounts.
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