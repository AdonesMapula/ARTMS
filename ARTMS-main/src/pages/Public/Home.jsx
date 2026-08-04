import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import GeometricBackground from "../../components/ui/GeometricBackground";
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
  ChevronDown,
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

// Headline animation data with multiple phrase variations
const HERO_HEADLINES = [
  { prefix: "Connecting Top Talent with", highlight: "Exceptional Opportunities" },
  { prefix: "Streamlining Hiring with", highlight: "AI-Powered Precision" },
  { prefix: "Accelerate Growth through", highlight: "Intelligent Recruitment" },
  { prefix: "Empowering HR Teams with", highlight: "Smart Decision Support" },
  { prefix: "Helping Careers through", highlight: "Next-Gen Technology" },
  { prefix: "AI Recruitment & Talent", highlight: "Management System" },
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

function StatCounter({ value, suffix = "" }) {
  const numericValue = parseInt(value.replace(/\D/g, ""), 10);
  const [count, setIsActive] = useCountAnimation(numericValue, 1800, 0);
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
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
    <p ref={ref} className="text-3xl font-extrabold sm:text-4xl" style={{ color: TOKENS.accent }}>
      {count}{suffix}
    </p>
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
function CountingBadge({ targetCount = 0 }) {
  const [count, setIsActive] = useCountAnimation(targetCount, 1500, 0);
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
  }, [targetCount, setIsActive]);

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
      <span className="tabular-nums">+{count.toLocaleString()}</span> {count === 1 ? "role" : "roles"} hiring right now
    </div>
  );
}

const TEXT_REVEAL_TRANSITIONS = [
  { in: "textRevealSlideIn 520ms cubic-bezier(0.16, 1, 0.3, 1) forwards", out: "textRevealSlideOut 400ms cubic-bezier(0.7, 0, 0.84, 0) forwards" },
  { in: "textRevealFlipIn 550ms cubic-bezier(0.16, 1, 0.3, 1) forwards", out: "textRevealFlipOut 400ms cubic-bezier(0.7, 0, 0.84, 0) forwards" },
  { in: "textRevealZoomIn 520ms cubic-bezier(0.16, 1, 0.3, 1) forwards", out: "textRevealZoomOut 400ms cubic-bezier(0.7, 0, 0.84, 0) forwards" },
  { in: "textRevealSwipeIn 520ms cubic-bezier(0.16, 1, 0.3, 1) forwards", out: "textRevealSwipeOut 400ms cubic-bezier(0.7, 0, 0.84, 0) forwards" },
];

function FlipHeadline({ headlines = HERO_HEADLINES, interval = 4200 }) {
  const [index, setIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [transIndex, setTransIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsFlipping(true); // start exit animation
      setTimeout(() => {
        setIndex((i) => (i + 1) % headlines.length);
        // Randomly pick a new transition animation for each phrase reveal
        setTransIndex((prev) => {
          let next = Math.floor(Math.random() * TEXT_REVEAL_TRANSITIONS.length);
          if (next === prev) next = (next + 1) % TEXT_REVEAL_TRANSITIONS.length;
          return next;
        });
        setIsFlipping(false); // start enter animation
      }, 400);
    }, interval);
    return () => clearInterval(timer);
  }, [headlines.length, interval]);

  const current = headlines[index];
  const activeAnim = TEXT_REVEAL_TRANSITIONS[transIndex];

  return (
    <span
      className="inline-block transition-all duration-300"
      style={{
        animation: isFlipping ? activeAnim.out : activeAnim.in,
        willChange: "transform, opacity, filter",
      }}
    >
      {current.prefix}{" "}
      <span
        className="relative inline-block"
        style={{
          color: TOKENS.accent,
          textShadow: "0 0 30px rgba(249, 115, 22, 0.35)",
        }}
      >
        {current.highlight}
      </span>
    </span>
  );
}

export default function JobBoardLanding() {
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [totalJobsCount, setTotalJobsCount] = useState(0);
  const [jobsLoading, setJobsLoading] = useState(true);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setHeroLoaded(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || "/api";
    axios
      .get(`${API_URL}/public/job-postings`)
      .then((res) => {
        const all = Array.isArray(res.data)
          ? res.data
          : res.data.data ?? res.data.postings ?? [];
        setTotalJobsCount(all.length);
        // Sort by created_at descending, take latest 3
        const sorted = [...all].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setFeaturedJobs(sorted.slice(0, 3));
      })
      .catch(() => {
        setTotalJobsCount(0);
        setFeaturedJobs([]);
      })
      .finally(() => setJobsLoading(false));
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

        {/* Animated grid background */}
        <div
          className="absolute inset-0 -z-10 animate-grid-pan"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
            `,
            backgroundSize: "24px 24px",
            maskImage: "radial-gradient(circle at 50% 40%, black 20%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(circle at 50% 40%, black 20%, transparent 75%)",
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
            <CountingBadge targetCount={totalJobsCount} />
          </div>

          <h1
            className="max-w-4xl text-4xl font-extrabold leading-[1.08] tracking-tight text-white transition-all duration-700 sm:text-6xl"
            style={{
              opacity: heroLoaded ? 1 : 0,
              transform: heroLoaded ? "translateY(0)" : "translateY(24px)",
              transitionDelay: "100ms",
            }}
          >
            <FlipHeadline headlines={HERO_HEADLINES} />
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

        {/* Scroll cue */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce-slow"
          style={{ opacity: heroLoaded ? 0.7 : 0, transition: "opacity 700ms ease 600ms" }}
        >
          <span className="text-[11px] font-semibold uppercase tracking-widest text-white/70">
            Scroll to explore
          </span>
          <ChevronDown size={18} className="text-white/70" />
        </div>

      </section>

      {/* ---------------- Infinite Stats Marquee ---------------- */}
      <InfiniteStatsMarquee />

      {/* ---------------- What is ARTMS ---------------- */}
      <section className="relative isolate overflow-hidden py-24">
        <GeometricBackground variant="mesh" />

        {/* Animated gradient background */}
        <div
          className="absolute inset-0 -z-20"
          style={{
            background: `linear-gradient(135deg, 
              rgba(6,15,90,0.03) 0%, 
              rgba(249,115,22,0.02) 25%,
              rgba(6,15,90,0.02) 50%,
              rgba(249,115,22,0.03) 75%,
              rgba(6,15,90,0.03) 100%)`,
            backgroundSize: "400% 400%",
            animation: "gradient-shift 15s ease infinite",
          }}
        />

        {/* Animated floating shapes */}
        <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div
            className="absolute -left-20 top-20 h-64 w-64 rounded-full opacity-[0.06] blur-3xl animate-float-slow"
            style={{ backgroundColor: TOKENS.navy }}
          />
          <div
            className="absolute -right-20 top-40 h-80 w-80 rounded-full opacity-[0.08] blur-3xl animate-float-slower"
            style={{ backgroundColor: TOKENS.accent }}
          />
          <div
            className="absolute bottom-20 left-1/3 h-72 w-72 rounded-full opacity-[0.05] blur-3xl animate-float-slowest"
            style={{ backgroundColor: TOKENS.navyInk }}
          />
        </div>

        {/* Animated particle dots & dot grid texture */}
        <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(6,15,90,0.035) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="absolute inset-0 animate-particle-float" style={{
            backgroundImage: `radial-gradient(circle, ${TOKENS.accent} 1.5px, transparent 1.5px)`,
            backgroundSize: "50px 50px",
            opacity: 0.04,
          }} />
        </div>


        <div className="mx-auto max-w-7xl px-6 lg:px-10">
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
                    className="group relative h-full overflow-hidden rounded-2xl border bg-white/80 backdrop-blur-sm p-6 transition-all duration-300 hover:-translate-y-2"
                    style={{
                      borderColor: TOKENS.line,
                      boxShadow: "0 4px 16px -10px rgba(6,15,90,0.12)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = "0 24px 48px -20px rgba(6,15,90,0.25)";
                      e.currentTarget.style.borderColor = "rgba(249,115,22,0.4)";
                      e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.95)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "0 4px 16px -10px rgba(6,15,90,0.12)";
                      e.currentTarget.style.borderColor = TOKENS.line;
                      e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.8)";
                    }}
                  >
                    {/* Animated accent line */}
                    <div
                      className="absolute left-0 top-0 h-1 w-full origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                      style={{
                        background: `linear-gradient(90deg, ${TOKENS.accent}, ${TOKENS.accentDark})`
                      }}
                      aria-hidden="true"
                    />

                    {/* Icon with glow effect on hover */}
                    <div className="relative">
                      <div
                        className="absolute inset-0 rounded-xl opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-30"
                        style={{ backgroundColor: TOKENS.accent }}
                        aria-hidden="true"
                      />
                      <div
                        className="relative flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110"
                        style={{
                          backgroundColor: "#EEF1FB",
                          color: TOKENS.navy
                        }}
                      >
                        <FeatureIcon size={22} />
                      </div>
                    </div>

                    <h3 className="mt-5 text-base font-extrabold transition-colors duration-300"
                      style={{ color: TOKENS.navy }}
                    >
                      {f.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: TOKENS.slateSoft }}>
                      {f.desc}
                    </p>

                    {/* Decorative corner element */}
                    <div
                      className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-[0.05]"
                      style={{ backgroundColor: TOKENS.accent }}
                      aria-hidden="true"
                    />
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        <style>{`
          @keyframes gradient-shift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          
          @keyframes float-slow {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -30px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
          }
          
          @keyframes float-slower {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            33% { transform: translate(-40px, 30px) rotate(3deg); }
            66% { transform: translate(30px, -20px) rotate(-3deg); }
          }
          
          @keyframes float-slowest {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(20px, 30px) scale(1.05); }
          }

          @keyframes particle-float {
            0% { transform: translateY(0); }
            100% { transform: translateY(-20px); }
          }
          
          .animate-float-slow {
            animation: float-slow 20s ease-in-out infinite;
          }
          
          .animate-float-slower {
            animation: float-slower 25s ease-in-out infinite;
          }
          
          .animate-float-slowest {
            animation: float-slowest 30s ease-in-out infinite;
          }

          .animate-particle-float {
            animation: particle-float 8s linear infinite;
          }
        `}</style>
      </section>

      {/* ---------------- How ARTMS Works (interactive process) ---------------- */}
      <ProcessSection />

      {/* ---------------- Featured Jobs Preview ---------------- */}
      <section id="jobs" className="relative isolate overflow-hidden py-24">
        <GeometricBackground variant="isometric" />

        {/* Wave pattern background & dot grid texture */}
        <div
          className="absolute inset-0 -z-20"
          style={{
            backgroundColor: "#F1F5F9",
            backgroundImage: "radial-gradient(circle, rgba(6,15,90,0.035) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
          aria-hidden="true"
        />


        {/* Animated SVG waves */}
        <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <svg
            className="absolute bottom-0 left-0 w-full opacity-[0.07]"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            style={{ height: "300px" }}
          >
            <path
              fill={TOKENS.navy}
              fillOpacity="1"
              d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,138.7C960,139,1056,117,1152,106.7C1248,96,1344,96,1392,96L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              style={{
                animation: "wave-move 10s ease-in-out infinite",
                transformOrigin: "center",
              }}
            />
          </svg>
          <svg
            className="absolute bottom-0 left-0 w-full opacity-[0.05]"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            style={{ height: "280px" }}
          >
            <path
              fill={TOKENS.accent}
              fillOpacity="1"
              d="M0,192L48,176C96,160,192,128,288,128C384,128,480,160,576,165.3C672,171,768,149,864,149.3C960,149,1056,171,1152,181.3C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              style={{
                animation: "wave-move-reverse 12s ease-in-out infinite",
                transformOrigin: "center",
              }}
            />
          </svg>
        </div>

        {/* Floating job icons */}
        <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div
            className="absolute left-[12%] top-[20%] opacity-[0.04] animate-float-icon"
            style={{ fontSize: "48px", color: TOKENS.navy }}
          >
            💼
          </div>
          <div
            className="absolute right-[18%] top-[35%] opacity-[0.04] animate-float-icon-delayed"
            style={{ fontSize: "40px", color: TOKENS.accent }}
          >
            🎯
          </div>
          <div
            className="absolute left-[25%] bottom-[25%] opacity-[0.04] animate-float-icon-slow"
            style={{ fontSize: "44px", color: TOKENS.navy }}
          >
            ⚡
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-10">
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
              <Link
                to="/jobs"
                className="inline-flex items-center gap-1.5 text-sm font-bold transition-all duration-200 hover:gap-2"
                style={{ color: TOKENS.navy }}
              >
                Browse all jobs <ArrowRight size={15} />
              </Link>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {jobsLoading ? (
              // Skeleton cards while loading
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-[12px] border bg-white p-6" style={{ borderColor: TOKENS.line }}>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-slate-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-24 rounded bg-slate-100" />
                      <div className="h-2.5 w-16 rounded bg-slate-100" />
                    </div>
                  </div>
                  <div className="mt-5 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-slate-100" />
                    <div className="h-3 w-1/2 rounded bg-slate-100" />
                  </div>
                  <div className="mt-6 h-11 rounded-xl bg-slate-100" />
                </div>
              ))
            ) : featuredJobs.length === 0 ? (
              <div className="col-span-3 py-12 text-center">
                <p className="text-sm" style={{ color: TOKENS.slateSoft }}>No open positions at the moment. Check back soon!</p>
                <Link to="/jobs" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: TOKENS.accent }}>
                  Browse all positions <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              featuredJobs.map((job, i) => (
                <Reveal key={job.id} delay={i * 100}>
                  <JobCard job={job} />
                </Reveal>
              ))
            )}
          </div>
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
                  <StatCounter value={stat.value} suffix={stat.value.replace(/[0-9]/g, "")} />
                  <p className="mt-2 text-sm text-indigo-100/70">{stat.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Contact CTA ---------------- */}
      <section id="contact" className="relative isolate overflow-hidden py-24">
        <GeometricBackground variant="waves" />

        {/* Radial gradient background */}
        <div
          className="absolute inset-0 -z-20"
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(249,115,22,0.03) 0%, rgba(6,15,90,0.02) 50%, transparent 100%)`,
          }}
          aria-hidden="true"
        />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(${TOKENS.line} 1px, transparent 1px),
              linear-gradient(90deg, ${TOKENS.line} 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
          aria-hidden="true"
        />

        {/* Floating accent circle */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl -z-10 animate-pulse-gentle"
          style={{ backgroundColor: TOKENS.accent, opacity: 0.06 }}
          aria-hidden="true"
        />

        <div className="mx-auto max-w-7xl px-6 text-center lg:px-10">
          <Reveal>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: TOKENS.navy }}>
              Ready to find your next great hire — or your next great role?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed" style={{ color: TOKENS.slateSoft }}>
              Reach the team behind ARTMS and we'll get back to you within one business day.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <PrimaryButton style={{ backgroundColor: TOKENS.accent }}>
                Contact Us <ArrowUpRight size={16} />
              </PrimaryButton>
              <Link to="/application-guide">
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 px-6 py-3.5 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5"
                  style={{ borderColor: TOKENS.navy, color: TOKENS.navy }}
                >
                  View Application Guide
                </button>
              </Link>
            </div>
          </Reveal>
        </div>

        <style>{`
          @keyframes pulse-gentle {
            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.06; }
            50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.09; }
          }
          .animate-pulse-gentle {
            animation: pulse-gentle 6s ease-in-out infinite;
          }
        `}</style>
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
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActive((a) => (a + 1) % total);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPaused, total]);

  return (
    <section className="relative isolate overflow-hidden py-24">

      {/* Diagonal striped background pattern */}
      <div
        className="absolute inset-0 -z-20"
        style={{
          backgroundColor: "#FAFBFC",
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 60px,
            rgba(6,15,90,0.02) 60px,
            rgba(6,15,90,0.02) 120px
          )`,
        }}
        aria-hidden="true"
      />

      {/* Animated circles with blur */}
      <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div
          className="absolute left-[10%] top-[15%] h-96 w-96 rounded-full opacity-[0.08] blur-3xl animate-pulse-slow"
          style={{ backgroundColor: TOKENS.accent }}
        />
        <div
          className="absolute right-[15%] bottom-[20%] h-80 w-80 rounded-full opacity-[0.06] blur-3xl animate-pulse-slower"
          style={{ backgroundColor: TOKENS.navy }}
        />
      </div>

      {/* Geometric shapes */}
      <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div
          className="absolute left-[5%] top-[30%] h-32 w-32 rotate-45 opacity-[0.03] animate-spin-very-slow"
          style={{ backgroundColor: TOKENS.accent }}
        />
        <div
          className="absolute right-[8%] top-[60%] h-24 w-24 rotate-12 rounded-lg opacity-[0.04] animate-spin-reverse-slow"
          style={{ backgroundColor: TOKENS.navy }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-10">
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
            {/* Stepper rail - FIXED width calculation */}
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

              <div className="relative flex justify-between">

                {PROCESS_STEPS.map((step, i) => {
                  const StepIcon = step.icon;
                  const isActive = i === active;
                  const isDone = i < active;
                  return (
                    <button
                      key={step.id}
                      onClick={() => {
                        setActive(i);
                        setIsPaused(true);
                      }}
                      className="group flex w-20 flex-col items-center gap-3 rounded-xl py-1 text-center focus:outline-none sm:w-24"
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

            {/* Active step detail - NO BOX, plain white background */}
            <div
              key={activeStep.id}
              className="mt-16 grid gap-8 lg:grid-cols-[auto_1fr] lg:items-start"
              style={{
                animation: "artms-fade-in 420ms ease",
              }}
            >
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl shadow-md"
                style={{ backgroundColor: TOKENS.accent }}
              >
                <Icon size={28} className="text-white" />
              </div>
              <div>
                <span
                  className="inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide"
                  style={{ backgroundColor: "rgba(249,115,22,0.12)", color: TOKENS.accentDark }}
                >
                  {activeStep.module}
                </span>
                <h3
                  className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl"
                  style={{ color: TOKENS.navy }}
                >
                  {activeStep.title}
                </h3>
                <p className="mt-3 max-w-2xl text-base leading-relaxed" style={{ color: TOKENS.slate }}>
                  {activeStep.description}
                </p>

                <div className="mt-8 flex items-center gap-3">
                  <button
                    onClick={() => {
                      setActive((a) => Math.max(0, a - 1));
                      setIsPaused(true);
                    }}
                    disabled={active === 0}
                    className="rounded-xl border-2 px-5 py-2.5 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                    style={{ borderColor: TOKENS.line, color: TOKENS.navy }}
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      setActive((a) => Math.min(total - 1, a + 1));
                      setIsPaused(true);
                    }}
                    disabled={active === total - 1}
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                    style={{ backgroundColor: TOKENS.accent }}
                  >
                    Next stage <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      <style>{`
        @keyframes artms-fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.08; }
          50% { transform: scale(1.1); opacity: 0.12; }
        }
        
        @keyframes pulse-slower {
          0%, 100% { transform: scale(1); opacity: 0.06; }
          50% { transform: scale(1.15); opacity: 0.1; }
        }
        
        @keyframes spin-very-slow {
          from { transform: rotate(45deg); }
          to { transform: rotate(405deg); }
        }
        
        @keyframes spin-reverse-slow {
          from { transform: rotate(12deg); }
          to { transform: rotate(-348deg); }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        
        .animate-pulse-slower {
          animation: pulse-slower 10s ease-in-out infinite;
        }
        
        .animate-spin-very-slow {
          animation: spin-very-slow 40s linear infinite;
        }
        
        .animate-spin-reverse-slow {
          animation: spin-reverse-slow 35s linear infinite;
        }
      `}</style>
    </section>
  );
}

function JobCard({ job }) {
  const [hovered, setHovered] = useState(false);

  // Map the API shape → display values
  const title = job.job_library?.job_title || job.title || "Untitled Position";
  const dept = job.department?.department_name ?? job.department?.name ?? "";
  const location = job.location || "Remote";
  const closing = job.closing_date
    ? new Date(job.closing_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : null;
  const vacancies = job.vacancies_count ?? 1;
  // Two-letter initials from department or job title
  const initials = dept
    ? dept.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : title.slice(0, 2).toUpperCase();

  return (
    <Link to={`/jobs`} className="block h-full">
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
        {/* Accent bar on hover */}
        <div
          className="absolute left-0 top-0 h-0.5 w-full origin-left scale-x-0 rounded-t-[12px] transition-transform duration-500 group-hover:scale-x-100"
          style={{ background: `linear-gradient(90deg, ${TOKENS.accent}, ${TOKENS.accentDark})` }}
          aria-hidden="true"
        />

        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-black"
            style={{ backgroundColor: "#EEF1FB", color: TOKENS.navy }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold" style={{ color: TOKENS.slateSoft }}>
              {dept || "Open Position"}
            </p>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ backgroundColor: "rgba(249,115,22,0.08)", color: TOKENS.accent }}
            >
              {vacancies} {vacancies > 1 ? "Vacancies" : "Vacancy"}
            </span>
          </div>
        </div>

        <h3 className="mt-5 text-lg font-extrabold leading-snug" style={{ color: TOKENS.navy }}>
          {title}
        </h3>

        <div className="mt-3 flex flex-wrap gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold"
            style={{ backgroundColor: "#EEF1FB", color: TOKENS.navy }}
          >
            <MapPin size={11} /> {location}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold"
            style={{ backgroundColor: "#EEF1FB", color: TOKENS.navy }}
          >
            <Briefcase size={11} /> Full-time
          </span>
          {closing && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{ backgroundColor: "rgba(249,115,22,0.07)", color: TOKENS.accent }}
            >
              Closes {closing}
            </span>
          )}
        </div>

        <div className="mt-6 flex-1" />

        <button
          className="relative mt-2 flex h-11 w-full items-center justify-center overflow-hidden rounded-xl text-sm font-bold text-white transition-colors duration-300"
          style={{ backgroundColor: hovered ? TOKENS.accentDark : TOKENS.navy }}
        >
          <span
            className="flex items-center gap-1.5 transition-transform duration-300"
            style={{ transform: hovered ? "translateX(-2px)" : "translateX(0)" }}
          >
            View &amp; Apply
            <ArrowRight
              size={15}
              className="transition-transform duration-300"
              style={{ transform: hovered ? "translateX(3px)" : "translateX(0)" }}
            />
          </span>
        </button>
      </div>
    </Link>
  );
}
