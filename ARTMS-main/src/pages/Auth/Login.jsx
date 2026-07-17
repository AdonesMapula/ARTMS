import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, KeyRound, Eye, EyeOff, ArrowRight, ShieldCheck, ArrowLeft } from "lucide-react";
import artmsLogo from "../../assets/Logo/ARTMS_LOGO.png";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";

const BG_IMAGE_URL =
  "https://images.unsplash.com/photo-1524230507669-5ff97982bb5e?q=80&w=2000&auto=format&fit=crop";

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
    <div className="relative min-h-screen overflow-hidden bg-slate-100">
      {/* Background photo */}
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center grayscale"
        style={{ backgroundImage: `url(${BG_IMAGE_URL})` }}
        aria-hidden="true"
      />
      {/* Soft white wash so the card and copy stay legible */}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-white/85 to-slate-100/60"
        aria-hidden="true"
      />

      {/* Back to public site */}
      <Link
        to="/"
        className="absolute left-6 top-6 z-15 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-[#060F5A]"
      >
        <ArrowLeft size={16} />
        Back to website
      </Link>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-16">
        {/* Logo + heading */}
        <div
          className={`flex flex-col items-center text-center transition-all duration-700 ${
            loaded ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
          }`}
        >
          <img src={artmsLogo} alt="ARTMS logo" className="h-20 w-auto sm:h-24" />
          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Administrative Portal
          </p>
        </div>

        {/* Login card */}
        <div
          className={`mt-8 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-900/10 transition-all duration-700 ${
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

        {/* Role note */}
        <p
          className={`mt-5 flex items-center gap-1.5 text-xs text-slate-500 transition-all duration-700 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          style={{ transitionDelay: "200ms" }}
        >
          <ShieldCheck size={14} className="text-[var(--artms-accent)]" />
          One login for Department Heads, HR Admins, and Super Admins — access is routed by role.
        </p>

        {/* Disclaimer */}
        <p
          className={`mt-3 max-w-md text-center text-xs font-medium leading-relaxed text-[#060F5A]/70 transition-all duration-700 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          style={{ transitionDelay: "260ms" }}
        >
          Unauthorized access to this HR Information System is strictly prohibited and subject to
          organizational policy and legal action.
        </p>
      </div>
    </div>
  );
}