import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, KeyRound, Eye, EyeOff, ArrowRight, ShieldCheck, ArrowLeft } from "lucide-react";
import artmsLogo from "../../assets/Logo/ARTMS_LOGO_white.png";
import loginBg from "../../assets/Backgrounds/login-bg.jpg";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const emailRef    = useRef();
  const passwordRef = useRef();

  const { login } = useAuth();
  const navigate   = useNavigate();

  useEffect(() => {
    const t = requestAnimationFrame(() => setLoaded(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const user = await login(emailRef.current.value, passwordRef.current.value);
      // Role-based redirect after successful login
      navigate(authService.getRolePath(user.role), { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Login failed. Please check your credentials.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-900">
      {/* Background photo — fixed + z-0 so it reliably paints as the base
          layer regardless of any stacking context created higher up the
          component tree (negative z-index can get trapped behind an
          ancestor's own background in that situation, which is what was
          happening before). */}
      <div
        className="fixed inset-0 z-0 scale-105 bg-cover bg-center"
        style={{ backgroundImage: `url(${loginBg})` }}
        aria-hidden="true"
      />
      {/* Layered navy vignette — darker toward the edges (where text sits),
          lighter through the middle (where the photo and card breathe).
          This replaces a flat transparent tint with an actual designed
          scrim instead of a plain wash. */}
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
      {/* Soft accent glow, bottom-right — a bit of brand warmth without a hard shape */}
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
          {/* Soft glow behind the logo instead of a hard-edged box */}
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

        {/* Login card */}
        <div
          className={`mt-8 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-black/30 transition-all duration-700 ${
            loaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
          style={{ transitionDelay: "120ms" }}
        >
          <h1 className="text-xl font-extrabold text-slate-900">Login</h1>
          <p className="mt-1 text-sm text-slate-500">
            Please verify your credentials to continue.
          </p>

          <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
            {/* Error message */}
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
                  Signing in...
                </>
              ) : (
                <>
                  Secure Login
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
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
            One login for Department Heads, HR Admins, and Super Admins — access is routed by role.
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