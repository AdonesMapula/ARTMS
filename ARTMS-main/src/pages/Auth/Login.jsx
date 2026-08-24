import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, KeyRound, Eye, EyeOff, ArrowRight, ShieldCheck, ArrowLeft, RefreshCw } from "lucide-react";
import artmsLogo from "../../assets/Logo/ARTMS_LOGO_white.png";
import loginBg from "../../assets/Backgrounds/login-bg.jpg";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";

export default function Login() {
  const [step, setStep] = useState("credentials"); // "credentials" | "otp"
  const [showPassword, setShowPassword] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // OTP State
  const [verificationId, setVerificationId] = useState("");
  const [emailHint, setEmailHint] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [resendCooldown, setResendCooldown] = useState(60);

  const emailRef    = useRef();
  const passwordRef = useRef();
  const otpInputRefs = useRef([]);

  const { login, verifyLoginOtp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const t = requestAnimationFrame(() => setLoaded(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Expiration countdown timer (10 mins)
  useEffect(() => {
    if (step !== "otp") return;
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [step, timeLeft]);

  // Resend cooldown timer (60s)
  useEffect(() => {
    if (step !== "otp") return;
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  // Focus first OTP input when entering OTP step
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // Format seconds to mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // ── STEP 1: CREDENTIALS SUBMISSION ─────────────────────────────────────────
  const handleCredentialsSubmit = async (e) => {
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

      // Check if user requires OTP verification (Non-Super-Admin)
      if (response && response.requires_otp) {
        setVerificationId(response.verification_id);
        setEmailHint(response.email_hint || email);
        setTimeLeft(response.expires_in || 600);
        setResendCooldown(response.resend_cooldown || 60);
        setOtpDigits(["", "", "", "", "", ""]);
        setStep("otp");
      } else if (response && response.role) {
        // Direct Login (Super Admin)
        navigate(authService.getRolePath(response.role), { replace: true });
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

  // ── STEP 2: OTP DIGIT HANDLING ─────────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const updated = [...otpDigits];
      updated[index] = "";
      setOtpDigits(updated);
      return;
    }

    const digit = cleaned[cleaned.length - 1]; // take the latest typed digit
    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);

    // Auto-advance to next input
    if (index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const digits = pastedData.split("");
    const updated = [...otpDigits];
    digits.forEach((d, i) => {
      if (i < 6) updated[i] = d;
    });
    setOtpDigits(updated);

    const targetIndex = Math.min(digits.length, 5);
    otpInputRefs.current[targetIndex]?.focus();
  };

  // ── STEP 3: OTP VERIFICATION SUBMISSION ────────────────────────────────────
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const fullOtp = otpDigits.join("");

    if (fullOtp.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    if (timeLeft <= 0) {
      setError("Verification code has expired. Please click Resend Code below.");
      return;
    }

    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const user = await verifyLoginOtp(verificationId, fullOtp);
      navigate(authService.getRolePath(user.role), { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid or expired verification code.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ── STEP 4: RESEND OTP ─────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;

    setError("");
    setSuccess("");
    setIsResending(true);

    try {
      const res = await authService.resendLoginOtp(verificationId);
      if (res.verification_id) {
        setVerificationId(res.verification_id);
      }
      setTimeLeft(res.expires_in || 600);
      setResendCooldown(res.resend_cooldown || 60);
      setOtpDigits(["", "", "", "", "", ""]);
      setSuccess("A new 6-digit verification code has been sent to your email.");
      setTimeout(() => setSuccess(""), 4000);
      otpInputRefs.current[0]?.focus();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to resend code. Please try again.";
      setError(msg);
    } finally {
      setIsResending(false);
    }
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

      {/* Everything else sits above the fixed background layers */}
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

          {/* Login / OTP Card */}
          <div
            className={`mt-8 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-black/30 transition-all duration-700 ${
              loaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
            style={{ transitionDelay: "120ms" }}
          >
            {step === "credentials" ? (
              // ── CREDENTIALS VIEW ──────────────────────────────────────────
              <>
                <h1 className="text-xl font-extrabold text-slate-900">Secure Login</h1>
                <p className="mt-1 text-sm text-slate-500">
                  Please verify your credentials to continue.
                </p>

                <form className="mt-6 grid gap-5" onSubmit={handleCredentialsSubmit}>
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
                    <div className="group relative flex items-center rounded-xl border border-slate-200 bg-slate-50 transition-colors focus-within:border-[var(--artms-accent)] focus-within:bg-white focus-within:ring-2 focus-within:ring-[var(--artms-accent)]/20">
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
                    <div className="group relative flex items-center rounded-xl border border-slate-200 bg-slate-50 transition-colors focus-within:border-[var(--artms-accent)] focus-within:bg-white focus-within:ring-2 focus-within:ring-[var(--artms-accent)]/20">
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

                  {/* Forgot password */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-[#060F5A] focus:ring-[var(--artms-accent)]"
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
                        Verifying...
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
              // ── 6-DIGIT OTP VERIFICATION VIEW ─────────────────────────────
              <>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("credentials");
                      setError("");
                      setSuccess("");
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-[#060F5A]"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    <ShieldCheck size={13} /> 2FA Verification
                  </span>
                </div>

                <h1 className="mt-3 text-xl font-extrabold text-slate-900">Verify Identity</h1>
                <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                  We sent a 6-digit verification code to <span className="font-semibold text-slate-800">{emailHint}</span>.
                </p>

                <form className="mt-6 grid gap-5" onSubmit={handleOtpSubmit}>
                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                      {success}
                    </div>
                  )}

                  {/* 6 Individual Numeric OTP Input Slots */}
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">
                      Enter 6-Digit Code
                    </label>
                    <div className="flex justify-between gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (otpInputRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e.target)}
                          className="h-13 w-11 sm:h-14 sm:w-12 rounded-xl border border-slate-200 bg-slate-50 text-center text-xl sm:text-2xl font-extrabold text-slate-900 shadow-sm transition-all focus:border-[#060F5A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#060F5A]/20"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Expiration Timer & Resend Controls */}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div>
                      {timeLeft > 0 ? (
                        <span>
                          Code expires in: <strong className="text-slate-800 font-mono">{formatTime(timeLeft)}</strong>
                        </span>
                      ) : (
                        <span className="text-red-600 font-semibold">Code expired</span>
                      )}
                    </div>

                    <div>
                      {resendCooldown > 0 ? (
                        <span className="text-slate-400">
                          Resend in <strong className="font-mono">{resendCooldown}s</strong>
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={isResending}
                          onClick={handleResendOtp}
                          className="inline-flex items-center gap-1 font-semibold text-[#060F5A] hover:underline disabled:opacity-50"
                        >
                          <RefreshCw size={12} className={isResending ? "animate-spin" : ""} />
                          Resend Code
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Verify Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading || otpDigits.join("").length < 6 || timeLeft <= 0}
                    className="group mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#060F5A] py-3 text-sm font-semibold text-white shadow-lg shadow-[#060F5A]/20 transition-all duration-200 hover:scale-[1.01] hover:bg-[#0B1B78] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Verifying OTP...
                      </>
                    ) : (
                      <>
                        Verify & Sign In
                        <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Footer note */}
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
              Enterprise access protected with 2FA email verification.
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