import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import artmsLogo from "../../assets/Logo/ARTMS_LOGO_white.png";
import loginBg from "../../assets/Backgrounds/login-bg.jpg";
import axios from "axios";
import { API_BASE_URL as API_URL } from "../../services/api";

export default function SetupAccount() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordRef = useRef();
  const confirmRef = useRef();
  
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const token = searchParams.get("token");

  const navigate = useNavigate();

  useEffect(() => {
    const t = requestAnimationFrame(() => setLoaded(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const password = (passwordRef.current?.value || "").trim();
    const password_confirmation = (confirmRef.current?.value || "").trim();
    
    if (password !== password_confirmation) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      await axios.post(`${API_URL}/auth/setup-account`, {
        email: (email || "").trim(),
        token: (token || "").trim(),
        password,
        password_confirmation,
      });
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to setup account. The link may have expired.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-900">
      <div
        className="fixed inset-0 z-0 scale-105 bg-cover bg-center"
        style={{ backgroundImage: `url(${loginBg})` }}
        aria-hidden="true"
      />
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
      <div
        className="pointer-events-none fixed -bottom-32 -right-24 z-0 h-96 w-96 rounded-full bg-[#F97316]/20 blur-[100px]"
        aria-hidden="true"
      />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-16">
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
            Account Setup
          </p>
        </div>

        <div
          className={`mt-8 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-black/30 transition-all duration-700 ${
            loaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
          style={{ transitionDelay: "120ms" }}
        >
          {success ? (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
                <ShieldCheck size={32} className="text-emerald-600" />
              </div>
              <h1 className="text-xl font-extrabold text-slate-900">Account Setup Complete</h1>
              <p className="mt-2 text-sm text-slate-600">
                Your email has been verified and your new password is set. You can now log in to the system.
              </p>
              <Link
                to="/login"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#060F5A] to-[#111A62] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#060F5A]/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#060F5A]/30 active:translate-y-0 active:shadow-md"
              >
                Go to Login
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-extrabold text-slate-900">Welcome!</h1>
              <p className="mt-1 text-sm text-slate-500">
                Please set a new password to verify your email and activate your account.
              </p>

              <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    disabled
                    value={email || ""}
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-medium text-slate-500"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">
                    New Password
                  </label>
                  <div className="group relative flex items-center rounded-xl border border-slate-200 bg-slate-50 transition-colors focus-within:border-[#F97316] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#F97316]/20">
                    <KeyRound size={18} className="pointer-events-none absolute left-3.5 text-slate-400 group-focus-within:text-[#F97316]" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      ref={passwordRef}
                      onKeyDown={(e) => { if (e.key === " ") e.preventDefault(); }}
                      onChange={(e) => { if (e.target.value.includes(" ")) e.target.value = e.target.value.replace(/\s+/g, ""); }}
                      onBlur={(e) => { e.target.value = e.target.value.trim(); }}
                      className="w-full bg-transparent py-3 pl-10 pr-12 text-sm font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400"
                      placeholder="At least 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="password_confirmation" className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Confirm Password
                  </label>
                  <div className="group relative flex items-center rounded-xl border border-slate-200 bg-slate-50 transition-colors focus-within:border-[#F97316] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#F97316]/20">
                    <KeyRound size={18} className="pointer-events-none absolute left-3.5 text-slate-400 group-focus-within:text-[#F97316]" />
                    <input
                      id="password_confirmation"
                      type={showConfirm ? "text" : "password"}
                      required
                      ref={confirmRef}
                      onKeyDown={(e) => { if (e.key === " ") e.preventDefault(); }}
                      onChange={(e) => { if (e.target.value.includes(" ")) e.target.value = e.target.value.replace(/\s+/g, ""); }}
                      onBlur={(e) => { e.target.value = e.target.value.trim(); }}
                      className="w-full bg-transparent py-3 pl-10 pr-12 text-sm font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400"
                      placeholder="Confirm your new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email || !token}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F97316] to-[#ea6a0a] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#F97316]/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#F97316]/30 active:translate-y-0 active:shadow-md disabled:pointer-events-none disabled:opacity-70"
                >
                  {isLoading ? "Saving..." : "Save and Continue"}
                  {!isLoading && <ArrowRight size={16} />}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
