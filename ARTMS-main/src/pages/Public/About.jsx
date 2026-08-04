import { useEffect, useRef, useState } from "react";
import {
  FiCheckCircle,
  FiCpu,
  FiShield,
  FiTrendingUp,
  FiUserCheck,
  FiUsers,
  FiCalendar,
  FiBarChart2,
  FiLock,
  FiLayers,
  FiTarget,
  FiCompass,
} from "react-icons/fi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import GeometricBackground from "../../components/ui/GeometricBackground";

/* ----------------------------------------------------------------------
 * Images
 * -----------------------------------------------------------------------
 * These use hosted URLs so the page works out of the box. To use your own
 * photos instead, drop them in e.g. src/assets/images/ and import like:
 *
 *   import governancePhoto from "../../assets/images/governance.jpg";
 *   import missionPhoto from "../../assets/images/mission-vision.jpg";
 *
 * then swap the two constants below for governancePhoto / missionPhoto.
 * -------------------------------------------------------------------- */
const GOVERNANCE_IMAGE_URL =
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1400&auto=format&fit=crop";
const MISSION_IMAGE_URL =
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2000&auto=format&fit=crop";

/* ----------------------------------------------------------------------
 * Copy content — grounded in the ARTMS system modules: Applicant Tracking,
 * AI Recruitment Engine, Job Posting & PRF Workflow, Interview & Scheduling,
 * Employee Lifecycle, Performance Evaluation, and Analytics Reporting.
 * -------------------------------------------------------------------- */

const OFFERINGS = [
  "Applicant tracking & centralized resume database",
  "AI-assisted resume screening and job-role matching",
  "Job posting & Position Request Form (PRF) approval workflow",
  "Interview scheduling with automated reminders",
  "Employee lifecycle: onboarding, clearance, offboarding",
  "Attendance, performance, and hiring analytics reports",
];

const SERVICES = [
  "Finance",
  "Accounting and Bookkeeping",
  "Management Accounting/Controlling",
  "HR",
  "Payroll",
  "Customer Service Support",
  "Administration",
  "IT Service Desk",
  "And more",
];

const OPERATIONS = [
  {
    icon: <FiUserCheck aria-hidden="true" />,
    title: "AI screens, HR decides",
    desc: "Every AI recommendation is reviewed by HR before a hiring decision is made.",
  },
  {
    icon: <FiLock aria-hidden="true" />,
    title: "Role-based access by design",
    desc: "Super-Admin, Admin, COO, and HR each see only what their role requires.",
  },
  {
    icon: <FiCalendar aria-hidden="true" />,
    title: "One calendar, fewer missed steps",
    desc: "Interview scheduling and reminders run inside the same system as the application.",
  },
  {
    icon: <FiBarChart2 aria-hidden="true" />,
    title: "Decisions backed by data",
    desc: "Attendance, performance, and hiring trends roll up into a single reporting view.",
  },
];

const VALUES = [
  {
    icon: <FiUsers aria-hidden="true" />,
    title: "Human-first hiring",
    desc: "Accessible, transparent candidate journeys — no forced registration for applicants.",
  },
  {
    icon: <FiCpu aria-hidden="true" />,
    title: "AI-assisted workflow",
    desc: "Resume scoring, screening, and ranking that supports HR — never replaces it.",
  },
  {
    icon: <FiShield aria-hidden="true" />,
    title: "Governance-ready",
    desc: "Role-based consoles for Department Head, HR Admin, and Super Admin operations.",
  },
  {
    icon: <FiTrendingUp aria-hidden="true" />,
    title: "Enterprise analytics",
    desc: "Dashboards and pipeline views designed for hiring velocity and quality metrics.",
  },
];

/** Fades + slides children up the first time they enter the viewport
 *  — same pattern used on the Home page. */
function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`artms-reveal ${visible ? "artms-reveal-visible" : ""} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

export default function About() {
  const [introLoaded, setIntroLoaded] = useState(false);

  useEffect(() => {
    // trigger the intro entrance animation right after mount, same as the Home hero
    const t = requestAnimationFrame(() => setIntroLoaded(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div className="bg-[#F8FAFC]">
      {/* ── HERO — photo + navy wash + grid, identical to Home/Jobs/ApplicationGuide ── */}
      <section className="relative isolate overflow-hidden">
        {/* Background photo with navy wash */}
        <div
          className="absolute inset-0 -z-20 scale-105 bg-cover bg-center"
          style={{ backgroundImage: "url(https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2000&auto=format&fit=crop)" }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "linear-gradient(135deg, rgba(6,15,90,0.96) 0%, rgba(11,27,120,0.90) 50%, rgba(6,15,90,0.84) 100%)" }}
          aria-hidden="true"
        />
        {/* 24px grid overlay masked to radial — same as Home hero */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            maskImage: "radial-gradient(circle at 50% 40%, black 20%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(circle at 50% 40%, black 20%, transparent 75%)",
          }}
          aria-hidden="true"
        />
        {/* Floating glow orbs */}
        <div className="pointer-events-none absolute -left-32 top-10 -z-10 h-72 w-72 rounded-full blur-3xl" style={{ backgroundColor: "rgba(249,115,22,0.08)" }} aria-hidden="true" />
        <div className="pointer-events-none absolute -right-32 bottom-0 -z-10 h-64 w-64 rounded-full blur-3xl" style={{ backgroundColor: "rgba(99,102,241,0.10)" }} aria-hidden="true" />

        <div className="mx-auto flex min-h-[420px] max-w-7xl flex-col items-center justify-center px-6 pt-28 pb-16 text-center lg:px-10">
          {/* Badge */}
          <div
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-500/40 bg-orange-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--artms-accent)] transition-all duration-700"
            style={{
              opacity: introLoaded ? 1 : 0,
              transform: introLoaded ? "translateY(0)" : "translateY(10px)",
            }}
          >
            <FiCompass size={14} />
            About ARTMS
          </div>

          <h1
            className="max-w-4xl text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl transition-all duration-700"
            style={{
              opacity: introLoaded ? 1 : 0,
              transform: introLoaded ? "translateY(0)" : "translateY(24px)",
              transitionDelay: "100ms",
            }}
          >
            Revolutionizing HR Operations with <span className="text-[var(--artms-accent)]">AI Technology</span>
          </h1>

          <p
            className="mt-5 max-w-2xl text-base leading-relaxed text-indigo-100/80 sm:text-lg transition-all duration-700"
            style={{
              opacity: introLoaded ? 1 : 0,
              transform: introLoaded ? "translateY(0)" : "translateY(24px)",
              transitionDelay: "220ms",
            }}
          >
            ARTMS is an AI Recruitment and Talent Management System built to replace manual,
            spreadsheet-driven HR work with one centralized platform — covering everything from a candidate's first application to their full employee lifecycle.
          </p>
        </div>
      </section>

      {/* ── QUICK STATS BAR — solid navy, identical to ApplicationGuide ── */}
      <div style={{ backgroundColor: "#060F5A" }} className="border-y border-white/10">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid grid-cols-3 divide-x divide-white/10">
            {[
              { val: "AI-Powered", label: "Recruitment Engine" },
              { val: "End-to-End", label: "Employee Lifecycle" },
              { val: "Role-Based", label: "Access Control" },
            ].map((s, i) => (
              <div key={i} className="px-6 py-5 text-center">
                <p className="text-lg font-extrabold text-white">{s.val}</p>
                <p className="mt-0.5 text-xs text-indigo-100/60">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* ---------------- Three-column overview ---------------- */}
      <section className="relative isolate overflow-hidden mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <GeometricBackground variant="polygons" />
        <div className="pointer-events-none absolute -left-20 top-1/2 -z-10 h-80 w-80 -translate-y-1/2 rounded-full blur-3xl opacity-30" style={{ background: "radial-gradient(circle, rgba(6,15,90,0.08) 0%, transparent 70%)" }} aria-hidden="true" />

        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3 lg:divide-x lg:divide-[var(--artms-border)]">

          {/* Column 1 — what it offers */}
          <Reveal className="lg:pr-8">
            <h2 className="text-lg font-extrabold text-[#060F5A]">What ARTMS Offers</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              A single suite of recruitment and workforce tools, ready to replace
              disconnected tools and manual tracking.
            </p>
            <ul className="mt-5 space-y-3">
              {OFFERINGS.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <FiCheckCircle
                    className="mt-0.5 shrink-0 text-[var(--artms-accent)]"
                    size={16}
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Column 2 — comprehensive services */}
          <Reveal delay={80} className="lg:px-8">
            <h2 className="text-lg font-extrabold text-[#060F5A]">Comprehensive Services</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              We offer and implement a robust suite of outsourcing solutions, including:
            </p>
            <ul className="mt-5 space-y-3">
              {SERVICES.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <FiCheckCircle
                    className="mt-0.5 shrink-0 text-[var(--artms-accent)]"
                    size={16}
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Column 3 — how it operates */}
          <Reveal delay={160} className="lg:pl-8">
            <h2 className="text-lg font-extrabold text-[#060F5A]">Built for Real HR Operations</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Designed around how HR teams actually work day to day, not around a
              theoretical process.
            </p>
            <ul className="mt-5 space-y-4">
              {OPERATIONS.map((op) => (
                <li key={op.title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#060F5A]/8 text-[#060F5A]">
                    {op.icon}
                  </span>
                  <p className="text-sm leading-relaxed text-slate-700">
                    <span className="font-semibold text-[#060F5A]">{op.title}.</span>{" "}
                    {op.desc}
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ---------------- Vision & Mission — full navy, with background photo ---------------- */}
      <section className="relative isolate overflow-hidden">
        {/* Background photo */}
        <div
          className="absolute inset-0 -z-20 scale-105 bg-cover bg-center"
          style={{ backgroundImage: `url(${MISSION_IMAGE_URL})` }}
          aria-hidden="true"
        />
        {/* Full navy wash */}
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-br from-[#060F5A]/96 via-[#0B1B78]/92 to-[#060F5A]/90"
          aria-hidden="true"
        />
        {/* decorative rings, echoes the brand mark */}
        <svg
          className="pointer-events-none absolute -left-20 -bottom-20 h-80 w-80 opacity-[0.08]"
          viewBox="0 0 200 200"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="100" cy="100" r="99" stroke="var(--artms-accent)" strokeWidth="1.5" />
          <circle cx="100" cy="100" r="72" stroke="var(--artms-accent)" strokeWidth="1.5" />
          <circle cx="100" cy="100" r="45" stroke="var(--artms-accent)" strokeWidth="1.5" />
        </svg>

        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          <Reveal>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
              Why We Built This
            </p>
            <h2 className="mt-2 max-w-xl text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Vision & Mission
            </h2>
          </Reveal>

          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <Reveal delay={100} className="h-full">
              <div className="h-full flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:p-8">
                <div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[var(--artms-accent)]">
                    <FiCompass size={18} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-lg font-extrabold text-white">Vision</h3>
                  <p className="mt-2 text-sm leading-relaxed text-indigo-100/80">
                    A hiring and talent management experience where AI handles the
                    repetitive work, so HR teams can spend their time on the decisions
                    that actually need a human.
                  </p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={200} className="h-full">
              <div className="h-full flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:p-8">
                <div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[var(--artms-accent)]">
                    <FiTarget size={18} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-lg font-extrabold text-white">Mission</h3>
                  <p className="mt-2 text-sm leading-relaxed text-indigo-100/80">
                    Deliver a secure, centralized platform that connects recruitment and
                    employee records end to end, cutting manual tracking and giving
                    every hiring decision a clear, auditable trail.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------- Values ---------------- */}
      <section className="relative isolate overflow-hidden mx-auto max-w-7xl px-6 py-20 lg:px-10">
        {/* Background Dot Texture & Glow Orbs */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(6,15,90,0.035) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute -right-20 top-1/2 -z-10 h-80 w-80 -translate-y-1/2 rounded-full blur-3xl opacity-25" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.10) 0%, transparent 70%)" }} aria-hidden="true" />

        <Reveal>

          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
                What We Stand For
              </p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#060F5A] sm:text-3xl">
                Principles behind the platform
              </h2>
            </div>
          </div>
        </Reveal>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v, i) => (
            <Reveal key={v.title} delay={i * 80} className="h-full">
              <div
                className="group relative h-full overflow-hidden rounded-2xl border bg-white/80 backdrop-blur-sm p-6 transition-all duration-300 hover:-translate-y-1"
                style={{ borderColor: "#E2E8F0", boxShadow: "0 4px 16px -10px rgba(6,15,90,0.10)" }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "rgba(249,115,22,0.35)";
                  e.currentTarget.style.boxShadow = "0 16px 40px -16px rgba(6,15,90,0.18)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "#E2E8F0";
                  e.currentTarget.style.boxShadow = "0 4px 16px -10px rgba(6,15,90,0.10)";
                }}
              >
                {/* Accent top bar on hover */}
                <div
                  className="absolute left-0 top-0 h-0.5 w-full origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                  style={{ background: "linear-gradient(90deg, #F97316, #EA580C)" }}
                  aria-hidden="true"
                />

                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110"
                  style={{ backgroundColor: "#EEF1FB", color: "#060F5A" }}
                >
                  {v.icon}
                </div>

                <h3 className="mt-4 text-base font-extrabold text-[#060F5A]">{v.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{v.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Scroll-reveal transition classes + reduced-motion fallback — same as Home */}
      <style>{`
        .artms-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 600ms ease, transform 600ms ease;
        }
        .artms-reveal-visible {
          opacity: 1;
          transform: translateY(0);
        }
        @media (prefers-reduced-motion: reduce) {
          .artms-reveal {
            opacity: 1;
            transform: none;
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}