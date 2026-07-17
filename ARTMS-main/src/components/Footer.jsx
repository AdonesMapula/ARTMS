import { Link } from "react-router-dom";
import { FiLinkedin, FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import artmsLogoWhite from "../assets/Logo/LOGO_ARTMS_WHITE.png";

const EXPLORE_LINKS = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Job Postings", to: "/jobs" },
  { label: "Contact", to: "/contact" },
];

export default function Footer() {
  return (
    <footer className="bg-[#060F5A] text-white/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:px-10">
        {/* Brand */}
        <div>
          <Link to="/" className="flex items-center gap-3">
            <img src={artmsLogoWhite} alt="Accel4U logo" className="h-10 w-auto" />
            <div className="leading-tight">
            <p className="font-logo text-[2rem] font-extrabold tracking-[-0.03em] leading-none text-white">
              Accel4U
            </p>
              <p className="font-sans text-[11px] font-normal tracking-wide text-white/70">
                AI Recruitment and Talent Management System
              </p>
            </div>
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70">
            ARTMS is Accel4U Business Solutions Inc.'s centralized, AI-assisted
            platform for recruitment and employee record management — built to
            streamline applicant screening, improve data accuracy, and support
            faster, better-informed HR decisions.
          </p>
        </div>

        {/* Explore */}
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-white">
            Explore
          </p>
          <ul className="mt-4 space-y-3 text-sm text-white/70">
            {EXPLORE_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  className="transition-colors duration-200 hover:text-[var(--artms-accent)]"
                  to={link.to}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* For Teams */}
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-white">
            For Teams
          </p>
          <ul className="mt-4 space-y-3 text-sm text-white/70">
            <li>
              <Link
                className="transition-colors duration-200 hover:text-[var(--artms-accent)]"
                to="/login"
              >
                Admin Login
              </Link>
            </li>
            <li className="max-w-[200px] text-xs leading-relaxed text-white/50">
              Reserved for Department Heads, HR Admins, and Super Admins.
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-white">
            Contact
          </p>
          <ul className="mt-4 space-y-3 text-sm text-white/70">
            <li className="flex items-center gap-3">
              <FiMapPin className="shrink-0 text-[var(--artms-accent)]" aria-hidden="true" />
              <span>Philippines &middot; Accel4U Business Solutions Inc.</span>
            </li>
            <li className="flex items-center gap-3">
              <FiMail className="shrink-0 text-[var(--artms-accent)]" aria-hidden="true" />
              <span>hr@accel4u.example</span>
            </li>
            <li className="flex items-center gap-3">
              <FiPhone className="shrink-0 text-[var(--artms-accent)]" aria-hidden="true" />
              <span>+63 000 000 0000</span>
            </li>
            <li className="flex items-center gap-3">
              <FiLinkedin className="shrink-0 text-[var(--artms-accent)]" aria-hidden="true" />
              <span>Accel4U Careers</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 bg-[#040a3e]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-5 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <p>&copy; {new Date().getFullYear()} Accel4U Business Solutions Inc. All rights reserved.</p>
          <p>ARTMS &mdash; AI Recruitment and Talent Management System</p>
        </div>
      </div>
    </footer>
  );
}