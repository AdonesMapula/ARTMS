import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, ShieldCheck } from "lucide-react";
import artmsLogo from "../assets/Logo/LOGO_ARTMS_BLUE.png";
import artmsLogoWhite from "../assets/Logo/LOGO_ARTMS_WHITE.png";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Job Postings", to: "/jobs" },
  { label: "Contact", to: "/contact" },
];

// Only the homepage has a full-bleed hero photo behind the navbar, so only
// that route is allowed to start transparent. Every other page gets the
// solid white navbar straight away.
const TRANSPARENT_ROUTES = ["/"];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolledPast, setScrolledPast] = useState(false);
  const { pathname } = useLocation();

  const hasHero = TRANSPARENT_ROUTES.includes(pathname);
  const scrolled = !hasHero || scrolledPast;

  useEffect(() => {
    if (!hasHero) return; // no hero on this route, navbar just stays solid
    const onScroll = () => setScrolledPast(window.scrollY > 24);
    onScroll(); // set correct state on mount (e.g. page loaded already scrolled)
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hasHero]);

  // reset the mobile menu whenever the route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const linkClasses = ({ isActive }) =>
    [
      "relative text-sm font-medium transition-colors duration-200",
      isActive
        ? "text-[var(--artms-accent)]"
        : scrolled
        ? "text-slate-600 hover:text-[#060F5A]"
        : "text-white/85 hover:text-white",
    ].join(" ");

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 w-full transition-colors duration-300",
        scrolled
          ? "border-b border-[var(--artms-border)] bg-white shadow-sm"
          : "border-b border-transparent bg-transparent",
      ].join(" ")}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        {/* Logo + brand text — swaps to the white mark while transparent over the hero */}
        <Link to="/" className="flex items-center gap-3">
          <img
            src={scrolled ? artmsLogo : artmsLogoWhite}
            alt="Accel4U logo"
            className="h-10 w-auto transition-opacity duration-300"
          />
          <div className="flex flex-col leading-tight">
          <span
            className={[
              "font-logo text-[2rem] font-extrabold tracking-[-0.03em] leading-none transition-colors duration-300",
              scrolled ? "text-[#111A62]" : "text-white",
            ].join(" ")}
          >
            Accel4U
          </span> 
            <span
              className={[
                "font-sans text-[11px] font-normal tracking-wide transition-colors duration-300",
                scrolled ? "text-slate-500" : "text-white/80",
              ].join(" ")}
            >
              AI Recruitment and Talent Management System
            </span>
          </div>
        </Link>

        {/* Right-side cluster: nav links + Admin Login grouped together */}
        <div className="hidden items-center gap-9 md:flex">
          <ul className="flex items-center gap-9">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} className={linkClasses} end={link.to === "/"}>
                  {({ isActive }) => (
                    <span className="pb-1">
                      {link.label}
                      <span
                        className={[
                          "absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-[var(--artms-accent)] transition-opacity",
                          isActive ? "opacity-100" : "opacity-0",
                        ].join(" ")}
                      />
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Admin login */}
          <Link
            to="/login"
            className={[
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-200 hover:scale-[1.03]",
              scrolled
                ? "bg-[#060F5A] text-white hover:bg-[#040a3e]"
                : "bg-white/10 text-white backdrop-blur-sm border border-white/30 hover:bg-white/20",
            ].join(" ")}
          >
            <ShieldCheck size={16} className="text-[var(--artms-accent)]" />
            Sign In
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className={scrolled ? "text-[var(--artms-primary)] md:hidden" : "text-white md:hidden"}
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div
          className={[
            "px-6 pb-6 md:hidden",
            scrolled
              ? "border-t border-[var(--artms-border)] bg-white"
              : "border-t border-white/15 bg-[#060F5A]/95 backdrop-blur",
          ].join(" ")}
        >
          <ul className="flex flex-col gap-4 pt-4">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === "/"}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    isActive
                      ? "text-[var(--artms-accent)] font-semibold"
                      : scrolled
                      ? "text-slate-600 hover:text-[#060F5A] font-medium"
                      : "text-white/85 hover:text-white font-medium"
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
          {/* Mobile menu Admin Login */}
          <Link
            to="/login"
            onClick={() => setOpen(false)}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#060F5A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#040a3e]"
          >
            <ShieldCheck size={16} className="text-[var(--artms-accent)]" />
            Sign In
          </Link>
        </div>
      )}
    </header>
  );
}