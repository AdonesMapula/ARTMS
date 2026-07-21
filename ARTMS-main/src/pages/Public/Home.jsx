import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Building2,
  MapPin,
  Sparkles,
  Search,
  FileText,
  ScanSearch,
  CalendarCheck2,
  BadgeCheck,
  UserCheck2,
  Cpu,
  Users,
  ShieldCheck,
  BarChart3,
  TrendingUp,
  Award,
  Target,
} from "lucide-react";

/* Swap for your own photo — a wide, high-res office / team shot works best
   since it sits behind the navy wash. */
const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=2000&auto=format&fit=crop";

/**
 * ARTMS — Job Board & Talent Recruitment landing page
 * -----------------------------------------------------------------------
 * Palette (unchanged from source brand):
 *   --navy      #060F5A   dominant / trust anchor
 *   --navy-ink  #0B1B78   secondary navy for gradients
 *   --paper     #F8FAFC   page background
 *   --accent    #F97316   vibrant orange — reserved ONLY for CTAs + active states
 *   --slate     #1E293B   body copy
 *   --line      #E2E8F0   hairline borders
 * Type: Inter for both display & body, leaned on weight/tracking for hierarchy.
 * Signature element: the "live openings" counter chip in the hero + the
 * card's sliding "Apply Now" micro-interaction — small, restrained motion
 * rather than page-wide decoration.
 * ------------------------------------------------------------------------
 */

const TOKENS = {
  navy: "#060F5A",
  navyInk: "#0B1B78",
  paper: "#F8FAFC",
  accent: "#F97316",
  accentDark: "#EA580C",
  slate: "#1E293B",
  slateSoft: "#64748B",
  line: "#E2E8F0",
};

const ARTMS_FEATURES = [
  {
    icon: Cpu,
    title: "AI Recruitment Engine",
    desc: "Screens resumes, extracts skills, and ranks applicants with a confidence score — HR still makes the final call.",
  },
  {
    icon: Users,
    title: "Employee Lifecycle",
    desc: "Tracks each hire from onboarding through clearance, resignation, or termination in one connected record.",
  },
  {
    icon: ShieldCheck,
    title: "Role-Based Governance",
    desc: "Super-Admin, Admin, COO, and HR each get scoped access, with every action logged for accountability.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reporting",
    desc: "Consolidates attendance, performance, and hiring data into reports built for management decisions.",
  },
];

const PROCESS_STEPS = [
  {
    id: 1,
    icon: FileText,
    module: "Job Library & Posting",
    title: "Browse & apply",
    description:
      "Candidates browse open roles and submit an application with a CV upload — no account or registration required to get started.",
  },
  {
    id: 2,
    icon: ScanSearch,
    module: "AI Recruitment Engine",
    title: "AI resume screening",
    description:
      "The system extracts skills from the uploaded CV, matches them against the job requirements, and produces a confidence-scored ranking.",
  },
  {
    id: 3,
    icon: CalendarCheck2,
    module: "Interview & Scheduling",
    title: "Interview coordination",
    description:
      "Shortlisted candidates move into scheduling, with automated reminders keeping applicants and HR aligned on interview timing.",
  },
  {
    id: 4,
    icon: BadgeCheck,
    module: "HR Decision Support",
    title: "AI-assisted, HR-approved",
    description:
      "HR reviews an AI-generated interview summary and recommendation for context — but the final hiring decision always stays with HR.",
  },
  {
    id: 5,
    icon: UserCheck2,
    module: "Employee Lifecycle",
    title: "Onboarding",
    description:
      "Hired applicants are onboarded and issued an Employee ID, with clearance and documentation tracked from day one.",
  },
];

const FEATURED_JOBS = [
  {
    id: 1,
    company: "Nimbus Cloud Systems",
    initials: "NC",
    title: "Senior Product Designer",
    location: "Remote · US",
    type: "Full-time",
    salary: "$120k – $150k",
  },
  {
    id: 2,
    company: "Fieldstone Analytics",
    initials: "FA",
    title: "Backend Engineer, Payments",
    location: "New York, NY",
    type: "Full-time",
    salary: "$135k – $165k",
  },
  {
    id: 3,
    company: "Harbor & Co.",
    initials: "HC",
    title: "Talent Acquisition Lead",
    location: "Austin, TX",
    type: "Hybrid",
    salary: "$95k – $118k",
  },
];

/** Fades + slides children up the first time they enter the viewport. */
function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(22px)",
        transition: `opacity 640ms ease ${delay}ms, transform 640ms ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/** Custom hook for counting animation */
function useCountAnimation(end, duration = 2000, start = 0) {
  const [count, setCount] = useState(start);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOutQuart * (end - start) + start);
      
      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [isActive, end, start, duration]);

  return [count, setIsActive];
}

function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={
        "group inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white shadow-[0_10px_30px_-10px_rgba(249,115,22,0.55)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-10px_rgba(249,115,22,0.65)] active:translate-y-0 " +
        className
      }
      style={{ backgroundColor: TOKENS.accent }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={
        "inline-flex items-center justify-center gap-2 rounded-xl border-2 px-6 py-3.5 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 " +
        className
      }
      style={{ borderColor: "rgba(255,255,255,0.4)", color: "#FFFFFF" }}
    >
      {children}
    </button>
  );
}

/** Animated badge with counting number */
function CountingBadge() {
  const [count, setIsActive] = useCountAnimation(1240, 2500, 0);
  const badgeRef = useRef(null);

  useEffect(() => {
    const node = badgeRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsActive(true);
          io.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [setIsActive]);

  return (
    <div
      ref={badgeRef}
      className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em]"
      style={{
        borderColor: "rgba(249,115,22,0.4)",
        color: TOKENS.accent,
        backgroundColor: "rgba(249,115,22,0.08)",
      }}
    >
      <Sparkles size={13} /> 
      <span className="tabular-nums">{count.toLocaleString()}</span> roles hiring right now
    </div>
  );
}

export default function JobBoardLanding() {
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setHeroLoaded(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div style={{ backgroundColor: TOKENS.paper, fontFamily: "Inter, sans-serif" }}>
      {/* ---------------- Hero ---------------- */}
      <section id="home" className="relative isolate overflow-hidden">
        {/* Background photo */}
        <div
          className="absolute inset-0 -z-20 scale-105 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMAGE_URL})` }}
          aria-hidden="true"
        />
        {/* Brand-navy wash over the photo — same treatment as the original hero */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: `linear-gradient(135deg, rgba(6,15,90,0.95) 0%, rgba(11,27,120,0.88) 50%, rgba(6,15,90,0.80) 100%)`,
          }}
          aria-hidden="true"
        />
        {/* subtle vignette so the top/bottom edges stay readable */}
        <div
          className="absolute inset-0 -z-10 opacity-70"
          style={{
            background: `linear-gradient(to top, ${TOKENS.navy} 0%, transparent 40%)`,
          }}
          aria-hidden="true"
        />

        <div className="mx-auto flex min-h-[620px] max-w-7xl flex-col items-center justify-center px-6 py-24 text-center lg:px-10">
          <div
            className="mb-6 transition-all duration-700"
            style={{
              opacity: heroLoaded ? 1 : 0,
              transform: heroLoaded ? "translateY(0)" : "translateY(10px)",
            }}
          >
            <CountingBadge />
          </div>

          <h1
            className="max-w-4xl text-4xl font-extrabold leading-[1.08] tracking-tight text-white transition-all duration-700 sm:text-6xl"
            style={{
              opacity: heroLoaded ? 1 : 0,
              transform: heroLoaded ? "translateY(0)" : "translateY(24px)",
              transitionDelay: "100ms",
            }}
          >
            Connecting Top Talent with{" "}
            <span style={{ color: TOKENS.accent }}>Exceptional Opportunities</span>
          </h1>

          <p
            className="mt-6 max-w-xl text-base leading-relaxed text-indigo-100/80 transition-all duration-700 sm:text-lg"
            style={{
              opacity: heroLoaded ? 1 : 0,
              transform: heroLoaded ? "translateY(0)" : "translateY(24px)",
              transitionDelay: "220ms",
            }}
          >
            A modern hiring platform that pairs AI-assisted screening with a clean,
            human-first experience — so candidates find the right role, and teams
            find the right hire, faster.
          </p>

          <div
            className="mt-10 flex flex-col items-center gap-4 transition-all duration-700 sm:flex-row"
            style={{
              opacity: heroLoaded ? 1 : 0,
              transform: heroLoaded ? "translateY(0)" : "translateY(24px)",
              transitionDelay: "340ms",
            }}
          >
            <Link to="/jobs">
              <PrimaryButton>
                Explore Job Openings <ArrowRight size={16} />
              </PrimaryButton>
            </Link>
            <Link to="/about">
              <SecondaryButton>Learn More About Us</SecondaryButton>
            </Link>
          </div>

        </div>
      </section>

      {/* ---------------- Infinite Stats Marquee ---------------- */}
      <InfiniteStatsMarquee />

      {/* ---------------- What is ARTMS ---------------- */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10 bg-[#FCF8F8]">
        <Reveal>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_1fr] lg:items-end">
            <div>
              <p
                className="text-xs font-black uppercase tracking-[0.22em]"
                style={{ color: TOKENS.accent }}
              >
                What is ARTMS
              </p>
              <h2
                className="mt-3 text-2xl font-extrabold leading-snug tracking-tight sm:text-3xl"
                style={{ color: TOKENS.navy }}
              >
                One system for hiring, growing, and managing your people
              </h2>
            </div>
            <p className="text-sm leading-relaxed sm:text-base" style={{ color: TOKENS.slateSoft }}>
              ARTMS is a centralized AI Recruitment and Talent Management System that
              replaces scattered spreadsheets and manual tracking with a single source
              of truth — from the moment a candidate applies to the day they become
              part of the team.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ARTMS_FEATURES.map((f, i) => {
            const FeatureIcon = f.icon;
            return (
              <Reveal key={f.title} delay={i * 80}>
                <div
                  className="group h-full rounded-[12px] border bg-white p-6 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    borderColor: TOKENS.line,
                    boxShadow: "0 4px 16px -10px rgba(6,15,90,0.12)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 20px 40px -18px rgba(6,15,90,0.20)";
                    e.currentTarget.style.borderColor = "rgba(249,115,22,0.35)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 4px 16px -10px rgba(6,15,90,0.12)";
                    e.currentTarget.style.borderColor = TOKENS.line;
                  }}
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-300"
                    style={{ backgroundColor: "#EEF1FB", color: TOKENS.navy }}
                  >
                    <FeatureIcon size={20} />
                  </div>
                  <h3 className="mt-4 text-base font-extrabold" style={{ color: TOKENS.navy }}>
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: TOKENS.slateSoft }}>
                    {f.desc}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ---------------- How ARTMS Works (interactive process) ---------------- */}
      <ProcessSection />

      {/* ---------------- Featured Jobs Preview ---------------- */}
      <section id="jobs" className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p
                className="text-xs font-black uppercase tracking-[0.22em]"
                style={{ color: TOKENS.accent }}
              >
                Featured Jobs Preview
              </p>
              <h2
                className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl"
                style={{ color: TOKENS.navy }}
              >
                Roles hiring managers are prioritizing this week
              </h2>
            </div>
            <a
              href="#jobs"
              className="inline-flex items-center gap-1.5 text-sm font-bold transition-colors"
              style={{ color: TOKENS.navy }}
            >
              Browse all jobs <ArrowRight size={15} />
            </a>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {FEATURED_JOBS.map((job, i) => (
            <Reveal key={job.id} delay={i * 100}>
              <JobCard job={job} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- About strip ---------------- */}
      <section id="about" style={{ backgroundColor: TOKENS.navy }} className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-3">
            {[
              { value: "15+", label: "Years of Industry Expertise" },
              { value: "10k+", label: "Successful Placements" },
              { value: "24/7", label: "Recruitment Automation" },
            ].map((stat, i) => (
              <Reveal key={stat.label} delay={i * 90}>
                <div className="border-t pt-6" style={{ borderColor: "rgba(255,255,255,0.14)" }}>
                  <p className="text-3xl font-extrabold sm:text-4xl" style={{ color: TOKENS.accent }}>
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm text-indigo-100/70">{stat.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Contact CTA ---------------- */}
      <section id="contact" className="mx-auto max-w-7xl px-6 py-24 text-center lg:px-10">
        <Reveal>
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: TOKENS.navy }}>
            Ready to find your next great hire — or your next great role?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base" style={{ color: TOKENS.slateSoft }}>
            Reach the team behind ARTMS and we'll get back to you within one business day.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <PrimaryButton style={{ backgroundColor: TOKENS.accent }}>
              Contact Us <ArrowUpRight size={16} />
            </PrimaryButton>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 px-6 py-3.5 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5"
              style={{ borderColor: TOKENS.navy, color: TOKENS.navy }}
            >
              View Job Post Guide
            </button>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

/** Infinite scrolling stats marquee */
function InfiniteStatsMarquee() {
  const stats = [
    { icon: TrendingUp, label: "95% Match Accuracy", color: TOKENS.accent },
    { icon: Users, label: "10,000+ Candidates", color: TOKENS.navy },
    { icon: Award, label: "500+ Companies", color: TOKENS.accent },
    { icon: Target, label: "AI-Powered Screening", color: TOKENS.navy },
    { icon: BadgeCheck, label: "Verified Employers", color: TOKENS.accent },
    { icon: Briefcase, label: "1,240+ Active Jobs", color: TOKENS.navy },
  ];

  // Duplicate the stats array for seamless loop
  const duplicatedStats = [...stats, ...stats];

  return (
    <section 
      className="relative overflow-hidden py-8"
      style={{ 
        backgroundColor: TOKENS.navy,
        borderTop: `1px solid rgba(255,255,255,0.1)`,
        borderBottom: `1px solid rgba(255,255,255,0.1)`
      }}
    >
      <div className="flex animate-marquee whitespace-nowrap">
        {duplicatedStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="mx-8 inline-flex items-center gap-3"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ 
                  backgroundColor: "rgba(249,115,22,0.15)",
                  color: TOKENS.accent 
                }}
              >
                <Icon size={20} />
              </div>
              <span 
                className="text-sm font-bold"
                style={{ color: "rgba(255,255,255,0.9)" }}
              >
                {stat.label}
              </span>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}

function ProcessSection() {
  const [active, setActive] = useState(0);
  const total = PROCESS_STEPS.length;
  const activeStep = PROCESS_STEPS[active];
  const Icon = activeStep.icon;

  return (
    <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
      <Reveal>
        <p
          className="text-xs font-black uppercase tracking-[0.22em]"
          style={{ color: TOKENS.accent }}
        >
          How ARTMS Works
        </p>
        <h2
          className="mt-2 max-w-2xl text-2xl font-extrabold tracking-tight sm:text-3xl"
          style={{ color: TOKENS.navy }}
        >
          From application to onboarding, guided by AI, decided by HR
        </h2>
        <p className="mt-3 max-w-2xl text-sm sm:text-base" style={{ color: TOKENS.slateSoft }}>
          Tap a stage to see how it works.
        </p>
      </Reveal>

      <Reveal delay={100}>
        <div className="mt-12">
          {/* Stepper rail */}
          <div className="relative">
            <div
              className="absolute left-0 right-0 top-5 h-[3px] rounded-full"
              style={{ backgroundColor: TOKENS.line }}
              aria-hidden="true"
            />
            <div
              className="absolute left-0 top-5 h-[3px] rounded-full transition-all duration-500 ease-out"
              style={{
                backgroundColor: TOKENS.accent,
                width: `${(active / (total - 1)) * 100}%`,
              }}
              aria-hidden="true"
            />

            <div className="relative grid grid-cols-5 gap-2">
              {PROCESS_STEPS.map((step, i) => {
                const StepIcon = step.icon;
                const isActive = i === active;
                const isDone = i < active;
                return (
                  <button
                    key={step.id}
                    onClick={() => setActive(i)}
                    className="group flex flex-col items-center gap-3 rounded-xl py-1 text-center focus:outline-none"
                    aria-current={isActive ? "step" : undefined}
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-xs font-black transition-all duration-300"
                      style={{
                        backgroundColor: isActive || isDone ? TOKENS.accent : "#FFFFFF",
                        borderColor: isActive || isDone ? TOKENS.accent : TOKENS.line,
                        color: isActive || isDone ? "#FFFFFF" : TOKENS.slateSoft,
                        boxShadow: isActive
                          ? "0 8px 18px -6px rgba(249,115,22,0.55)"
                          : "none",
                        transform: isActive ? "scale(1.08)" : "scale(1)",
                      }}
                    >
                      {step.id}
                    </span>
                    <span
                      className="hidden text-xs font-bold leading-tight transition-colors duration-200 sm:block"
                      style={{ color: isActive ? TOKENS.navy : TOKENS.slateSoft }}
                    >
                      {step.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active step detail panel */}
          <div
            key={activeStep.id}
            className="mt-10 grid gap-8 rounded-[12px] border bg-white p-8 sm:p-10 lg:grid-cols-[auto_1fr] lg:items-start"
            style={{
              borderColor: TOKENS.line,
              boxShadow: "0 20px 48px -24px rgba(6,15,90,0.18)",
              animation: "artms-fade-in 420ms ease",
            }}
          >
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
              style={{ backgroundColor: "#EEF1FB", color: TOKENS.navy }}
            >
              <Icon size={28} />
            </div>
            <div>
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide"
                style={{ backgroundColor: "rgba(249,115,22,0.1)", color: TOKENS.accentDark }}
              >
                {activeStep.module}
              </span>
              <h3
                className="mt-3 text-xl font-extrabold tracking-tight sm:text-2xl"
                style={{ color: TOKENS.navy }}
              >
                {activeStep.title}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed sm:text-base" style={{ color: TOKENS.slate }}>
                {activeStep.description}
              </p>

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={() => setActive((a) => Math.max(0, a - 1))}
                  disabled={active === 0}
                  className="rounded-lg border px-4 py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ borderColor: TOKENS.line, color: TOKENS.navy }}
                >
                  Back
                </button>
                <button
                  onClick={() => setActive((a) => Math.min(total - 1, a + 1))}
                  disabled={active === total - 1}
                  className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ backgroundColor: TOKENS.navy }}
                >
                  Next stage <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      <style>{`
        @keyframes artms-fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}

function JobCard({ job }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative flex h-full flex-col rounded-[12px] border bg-white p-6 transition-all duration-300"
      style={{
        borderColor: hovered ? "rgba(249,115,22,0.35)" : TOKENS.line,
        boxShadow: hovered
          ? "0 20px 40px -18px rgba(6,15,90,0.22)"
          : "0 4px 16px -8px rgba(6,15,90,0.10)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-black"
          style={{ backgroundColor: "#EEF1FB", color: TOKENS.navy }}
        >
          {job.initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold" style={{ color: TOKENS.slateSoft }}>
            {job.company}
          </p>
          <p className="flex items-center gap-1 text-[11px]" style={{ color: TOKENS.slateSoft }}>
            <Building2 size={11} /> Verified employer
          </p>
        </div>
      </div>

      <h3 className="mt-5 text-lg font-extrabold leading-snug" style={{ color: TOKENS.navy }}>
        {job.title}
      </h3>

      <div className="mt-3 flex flex-wrap gap-2">
        <span
          className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold"
          style={{ backgroundColor: "#EEF1FB", color: TOKENS.navy }}
        >
          <MapPin size={11} /> {job.location}
        </span>
        <span
          className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold"
          style={{ backgroundColor: "#EEF1FB", color: TOKENS.navy }}
        >
          <Briefcase size={11} /> {job.type}
        </span>
      </div>

      <p className="mt-4 text-sm font-bold" style={{ color: TOKENS.slate }}>
        {job.salary}
      </p>

      <div className="mt-6 flex-1" />

      <button
        className="relative mt-2 flex h-11 w-full items-center justify-center overflow-hidden rounded-xl text-sm font-bold text-white transition-colors duration-300"
        style={{ backgroundColor: hovered ? TOKENS.accentDark : TOKENS.navy }}
      >
        <span
          className="flex items-center gap-1.5 transition-transform duration-300"
          style={{ transform: hovered ? "translateX(-2px)" : "translateX(0)" }}
        >
          Apply Now
          <ArrowRight
            size={15}
            className="transition-transform duration-300"
            style={{ transform: hovered ? "translateX(3px)" : "translateX(0)" }}
          />
        </span>
      </button>
    </div>
  );
}