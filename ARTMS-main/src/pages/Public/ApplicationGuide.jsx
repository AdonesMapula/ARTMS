import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText, Upload, CheckCircle2, Clock, Mail, Phone,
  AlertCircle, ChevronRight, Search, Edit3, Eye,
  Shield, HelpCircle, ArrowRight, Briefcase, ChevronDown,
  Sparkles,
} from "lucide-react";
import Reveal from "../../components/ui/Reavel";
import GeometricBackground from "../../components/ui/GeometricBackground";

/* ─── Design tokens — identical to Home.jsx ────────────────────────────── */
const T = {
  navy:      "#060F5A",
  navyInk:   "#0B1B78",
  paper:     "#F8FAFC",
  accent:    "#F97316",
  accentDk:  "#EA580C",
  slate:     "#1E293B",
  soft:      "#64748B",
  line:      "#E2E8F0",
};

/* ─── Data ──────────────────────────────────────────────────────────────── */
const STEPS = [
  {
    id: 1, icon: Search,
    title: "Find Your Role",
    body: "Browse open positions and filter by department, location, or keyword. Read the full description and check the application deadline before proceeding.",
    tips: ["Use the search bar to find specific positions", "Read required qualifications carefully", "Note the application deadline"],
  },
  {
    id: 2, icon: FileText,
    title: "Prepare Your Documents",
    body: "Have your updated resume ready in PDF, DOCX, DOC, or TXT — under 10 MB. A tailored cover note (optional) strengthens your application.",
    tips: ["Save resume as PDF for best compatibility", "Use a professional filename — e.g. JohnDoe_Resume.pdf", "Keep file size under 10 MB"],
  },
  {
    id: 3, icon: Upload,
    title: "Upload Resume & Auto-Fill",
    body: "Our AI reads your resume and pre-fills personal info, skills, and experience automatically. Review and correct any fields before proceeding.",
    tips: ["Use clear section headers: Experience, Education, Skills", "List specific skills and tools you've used", "Verify auto-filled data is accurate"],
  },
  {
    id: 4, icon: Edit3,
    title: "Complete the Form",
    body: "Fill in all required fields marked with (*). Double-check your email and phone — this is how HR will contact you.",
    tips: ["Verify your email address for typos", "Be honest about experience and qualifications", "Review all entries before submitting"],
  },
  {
    id: 5, icon: Eye,
    title: "Review & Submit",
    body: "Check that the job title matches the position you want, your resume uploaded correctly, and your details are accurate. Then submit.",
    tips: ["Confirm the job title is correct", "Ensure resume file uploaded successfully", "Accept the data privacy consent"],
  },
  {
    id: 6, icon: Mail,
    title: "Confirmation & Next Steps",
    body: "You'll receive an email with your Application ID immediately. Save it — you'll need it to track your status. Our HR team reviews within 1–2 weeks.",
    tips: ["Check spam folder if email doesn't arrive", "Keep your Application ID saved", "Respond promptly if HR reaches out"],
  },
];

const DOCS = [
  {
    icon: FileText, title: "Resume / CV", required: true,
    desc: "Your most up-to-date resume highlighting experience, education, and skills.",
    sub: "PDF, DOC, DOCX · Max 10 MB",
  },
  {
    icon: Edit3, title: "Cover Note", required: false,
    desc: "A brief note explaining your interest and what you bring — not required, but recommended.",
    sub: "Optional — add in the cover note field during application",
  },
  {
    icon: Shield, title: "Government ID", required: false,
    desc: "May be required for certain positions, but only at the shortlisting or onboarding stage.",
    sub: "Required only if shortlisted",
  },
];

const FAQS = [
  { q: "Do I need an account to apply?",              a: "No account required. Apply directly from any job listing — no login or registration needed." },
  { q: "How long does the application take?",         a: "5–10 minutes to complete. Our HR team reviews within 1–2 weeks and contacts shortlisted candidates." },
  { q: "What file formats are accepted?",             a: "PDF, DOC, and DOCX. PDF is recommended for best AI parsing accuracy. Keep file size under 10 MB." },
  { q: "Can I apply for multiple positions?",         a: "Yes — submit separate applications for each position that matches your qualifications." },
  { q: "What happens after I submit?",                a: "You'll receive an immediate confirmation email with your Application ID. Our AI screens the resume; HR reviews and contacts shortlisted candidates." },
  { q: "How will I know if I'm shortlisted?",         a: "Shortlisted candidates are contacted directly via email or phone. If you don't hear within 3–4 weeks, the position may have been filled." },
  { q: "Can I edit my application after submitting?", a: "Applications cannot be edited after submission. Review everything carefully before clicking Submit. For urgent changes, contact HR directly." },
  { q: "What is AI screening?",                       a: "Our AI extracts skills, experience, and qualifications from your resume and matches them to the job requirements. HR always makes the final hiring decision." },
];

const NOTICES = [
  "ARTMS never charges any fee for job applications or the recruitment process.",
  "Only apply through our official website. Be cautious of fraudulent postings.",
  "Personal data is protected under the Data Privacy Act (RA 10173) and used only for recruitment.",
  "Encounter an issue? Contact our HR support team immediately.",
];

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function ApplicationGuide() {
  const [loaded, setLoaded] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [openStep, setOpenStep] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const stepsSectionRef = useRef(null);

  const handleStepsMouseMove = (e) => {
    const rect = stepsSectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  useEffect(() => {
    const raf = requestAnimationFrame(() => setLoaded(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={{ backgroundColor: T.paper, fontFamily: "Inter, sans-serif" }}>

      {/* ── HERO ── navy + photo wash, same structure as Home hero ─────── */}
      <section className="relative isolate overflow-hidden">
        {/* Background photo with navy wash */}
        <div
          className="absolute inset-0 -z-20 scale-105 bg-cover bg-center"
          style={{ backgroundImage: "url(https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2000&auto=format&fit=crop)" }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 -z-10"
          style={{ background: `linear-gradient(135deg, rgba(6,15,90,0.96) 0%, rgba(11,27,120,0.90) 50%, rgba(6,15,90,0.82) 100%)` }}
          aria-hidden="true"
        />
        {/* Subtle grid overlay — same as Home */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
            maskImage: "radial-gradient(circle at 50% 40%, black 20%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(circle at 50% 40%, black 20%, transparent 75%)",
          }}
          aria-hidden="true"
        />

        <div className="mx-auto flex min-h-[420px] max-w-7xl flex-col items-center justify-center px-6 pt-28 pb-16 text-center lg:px-10">
          {/* Badge */}
          <div
            className="mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] transition-all duration-700"
            style={{
              borderColor: "rgba(249,115,22,0.4)",
              color: T.accent,
              backgroundColor: "rgba(249,115,22,0.08)",
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(10px)",
            }}
          >
            <Briefcase size={13} />
            Application Guide
          </div>

          <h1
            className="max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl"
            style={{ opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(24px)", transition: "all 700ms ease 100ms" }}
          >
            How to Apply at{" "}
            <span style={{ color: T.accent }}>ARTMS</span>
          </h1>

          <p
            className="mt-5 max-w-xl text-base leading-relaxed text-indigo-100/75 sm:text-lg"
            style={{ opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(24px)", transition: "all 700ms ease 220ms" }}
          >
            Six quick steps — completely online, no account required. Our AI handles the heavy lifting so you can focus on the application.
          </p>

          <div
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
            style={{ opacity: loaded ? 1 : 0, transition: "all 700ms ease 340ms" }}
          >
            <Link to="/jobs">
              <button className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5"
                style={{ backgroundColor: T.accent, boxShadow: "0 10px 30px -10px rgba(249,115,22,0.5)" }}>
                Browse Open Positions <ArrowRight size={15} />
              </button>
            </Link>
            <a href="#steps">
              <button className="inline-flex items-center gap-2 rounded-xl border-2 px-6 py-3.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5"
                style={{ borderColor: "rgba(255,255,255,0.3)" }}>
                View the Steps <ChevronDown size={15} />
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* ── QUICK STATS BAR — same marquee-strip feel as Home ──────────── */}
      <div style={{ backgroundColor: T.navy }} className="border-y border-white/10">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid grid-cols-3 divide-x" style={{ divideColor: "rgba(255,255,255,0.1)" }}>
            {[
              { val: "5–10 min", label: "To complete" },
              { val: "6 steps",  label: "Simple process" },
              { val: "100%",     label: "Online — no account" },
            ].map((s, i) => (
              <div key={i} className="px-6 py-5 text-center">
                <p className="text-lg font-extrabold text-white">{s.val}</p>
                <p className="mt-0.5 text-xs text-indigo-100/60">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── APPLICATION STEPS ── */}
      <section
        id="steps"
        ref={stepsSectionRef}
        onMouseMove={handleStepsMouseMove}
        className="relative isolate overflow-hidden py-20 lg:py-24"
      >
        {/* Dynamic mouse-tracking radial glow */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          aria-hidden="true"
          style={{
            background: `radial-gradient(circle 700px at ${mousePos.x}% ${mousePos.y}%, rgba(249,115,22,0.06) 0%, rgba(6,15,90,0.04) 45%, transparent 70%)`,
            transition: "background 80ms linear",
          }}
        />

        {/* Animated gradient sweep — slow diagonal drift */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          aria-hidden="true"
          style={{
            background: "linear-gradient(135deg, rgba(6,15,90,0.03) 0%, rgba(249,115,22,0.04) 50%, rgba(6,15,90,0.03) 100%)",
            backgroundSize: "400% 400%",
            animation: "stepsGradientShift 18s ease-in-out infinite",
          }}
        />

        {/* Mesh grid overlay */}
        <GeometricBackground variant="mesh" />

        {/* Floating orbs — staggered, different sizes and colours */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          {/* Large navy orb — top-left */}
          <div
            className="absolute rounded-full blur-3xl"
            style={{
              width: 340, height: 340,
              top: "-60px", left: "-80px",
              backgroundColor: "rgba(6,15,90,0.07)",
              animation: "orbDriftA 22s ease-in-out infinite",
            }}
          />
          {/* Medium accent orb — right */}
          <div
            className="absolute rounded-full blur-3xl"
            style={{
              width: 280, height: 280,
              top: "30%", right: "-60px",
              backgroundColor: "rgba(249,115,22,0.07)",
              animation: "orbDriftB 28s ease-in-out infinite",
            }}
          />
          {/* Small indigo orb — bottom-centre */}
          <div
            className="absolute rounded-full blur-2xl"
            style={{
              width: 180, height: 180,
              bottom: "40px", left: "40%",
              backgroundColor: "rgba(99,102,241,0.06)",
              animation: "orbDriftC 35s ease-in-out infinite",
            }}
          />
          {/* Tiny accent ring — decorative */}
          <div
            className="absolute rounded-full border"
            style={{
              width: 160, height: 160,
              bottom: "15%", right: "10%",
              borderColor: "rgba(249,115,22,0.10)",
              animation: "orbDriftB 40s ease-in-out infinite reverse",
            }}
          />
          <div
            className="absolute rounded-full border"
            style={{
              width: 80, height: 80,
              top: "20%", left: "20%",
              borderColor: "rgba(6,15,90,0.08)",
              animation: "orbDriftA 30s ease-in-out infinite reverse",
            }}
          />
        </div>

        {/* Keyframes injected once */}
        <style>{`
          @keyframes stepsGradientShift {
            0%,100% { background-position: 0% 50%; }
            50%      { background-position: 100% 50%; }
          }
          @keyframes orbDriftA {
            0%,100% { transform: translate(0,0) scale(1); }
            33%     { transform: translate(32px,-28px) scale(1.06); }
            66%     { transform: translate(-20px,24px) scale(0.95); }
          }
          @keyframes orbDriftB {
            0%,100% { transform: translate(0,0) scale(1); }
            33%     { transform: translate(-36px,20px) scale(1.04); }
            66%     { transform: translate(28px,-18px) scale(0.97); }
          }
          @keyframes orbDriftC {
            0%,100% { transform: translate(0,0) scale(1); }
            50%     { transform: translate(20px,-32px) scale(1.08); }
          }
        `}</style>

        <div className="mx-auto max-w-5xl px-6 lg:px-10">
          <Reveal>
            <div className="text-center">
              <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: T.accent }}>
                Step-by-Step Process
              </p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: T.navy }}>
                Your Application Journey
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed" style={{ color: T.soft }}>
                Click any step to see pro tips. From finding the right role to receiving your confirmation — here's exactly what to expect.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 space-y-3">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isOpen = openStep === step.id;
              return (
                <Reveal key={step.id} delay={i * 60}>
                  <div
                    className="group relative overflow-hidden rounded-2xl border bg-white/80 backdrop-blur-sm"
                    style={{
                      borderColor: isOpen ? T.accent : T.line,
                      boxShadow: isOpen
                        ? "0 8px 32px -12px rgba(249,115,22,0.22)"
                        : "0 2px 8px -4px rgba(6,15,90,0.08)",
                      transition: "border-color 250ms ease, box-shadow 250ms ease, transform 200ms ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={e => {
                      if (!isOpen) {
                        e.currentTarget.style.borderColor = "rgba(249,115,22,0.5)";
                        e.currentTarget.style.boxShadow = "0 8px 28px -10px rgba(6,15,90,0.14)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isOpen) {
                        e.currentTarget.style.borderColor = T.line;
                        e.currentTarget.style.boxShadow = "0 2px 8px -4px rgba(6,15,90,0.08)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }
                    }}
                  >
                    {/* Left accent stripe — slides in on hover / open */}
                    <div
                      className="absolute left-0 top-0 h-full w-1 origin-top rounded-l-2xl"
                      style={{
                        background: `linear-gradient(180deg, ${T.accent}, ${T.accentDk})`,
                        transform: isOpen ? "scaleY(1)" : "scaleY(0)",
                        transition: "transform 300ms ease",
                      }}
                      aria-hidden="true"
                    />
                    <button
                      className="flex w-full items-center gap-4 px-5 py-4 text-left"
                      onClick={() => setOpenStep(isOpen ? null : step.id)}
                      aria-expanded={isOpen}
                    >
                      {/* Step badge */}
                      <div className="relative shrink-0">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110"
                          style={{ backgroundColor: isOpen ? "rgba(249,115,22,0.12)" : "#EEF1FB", color: isOpen ? T.accent : T.navy }}
                        >
                          <Icon size={18} />
                        </div>
                        <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black text-white"
                          style={{ backgroundColor: T.accent }}>
                          {step.id}
                        </div>
                      </div>

                      {/* Title */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-extrabold transition-colors duration-200" style={{ color: isOpen ? T.accent : T.navy }}>
                          {step.title}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed line-clamp-1 transition-colors duration-200" style={{ color: T.soft }}>
                          {step.body}
                        </p>
                      </div>

                      {/* Chevron + click hint */}
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span
                          className="hidden text-[10px] font-semibold uppercase tracking-wide opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:block"
                          style={{ color: T.accent }}
                        >
                          {isOpen ? "close" : "expand"}
                        </span>
                        <ChevronDown
                          size={16}
                          style={{ color: isOpen ? T.accent : T.soft, transition: "transform 300ms, color 200ms", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                        />
                      </div>
                    </button>

                    {/* Expanded tips */}
                    <div style={{ maxHeight: isOpen ? "320px" : "0", overflow: "hidden", transition: "max-height 400ms ease" }}>
                      <div className="border-t px-5 pb-5 pt-4" style={{ borderColor: T.line, backgroundColor: T.paper }}>
                        <p className="text-xs leading-relaxed mb-3" style={{ color: T.slate }}>{step.body}</p>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Sparkles size={12} style={{ color: T.accent }} />
                          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: T.navy }}>Pro tips</p>
                        </div>
                        <ul className="space-y-1.5">
                          {step.tips.map((tip, j) => (
                            <li key={j} className="flex items-start gap-2 text-xs" style={{ color: T.soft }}>
                              <ChevronRight size={12} className="mt-0.5 shrink-0" style={{ color: T.accent }} />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        <style>{`
          @keyframes float-slow   { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-20px)} }
          @keyframes float-slower { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-20px,20px)} }
        `}</style>
      </section>

      {/* ── DOCUMENTS — navy bg, framed section ── */}
      <section className="relative isolate overflow-hidden py-20 lg:py-24" style={{ backgroundColor: T.navy }}>
        {/* 24px grid overlay — same as hero */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          aria-hidden="true"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            maskImage: "radial-gradient(ellipse at 50% 50%, black 40%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse at 50% 50%, black 40%, transparent 80%)",
          }}
        />
        {/* Glow orbs */}
        <div className="pointer-events-none absolute -left-32 top-0 -z-10 h-80 w-80 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)" }} aria-hidden="true" />
        <div className="pointer-events-none absolute -right-32 bottom-0 -z-10 h-96 w-96 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)" }} aria-hidden="true" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)" }} aria-hidden="true" />
        {/* Wave cap at top edge — links visually to the section above */}
        <div className="pointer-events-none absolute top-0 left-0 w-full overflow-hidden" aria-hidden="true" style={{ height: "60px" }}>
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="absolute top-0 w-full" style={{ height: "60px" }}>
            <path fill="rgba(255,255,255,0.03)" d="M0,32L120,26.7C240,21,480,11,720,16C960,21,1200,43,1320,53.3L1440,64L1440,0L0,0Z" />
          </svg>
        </div>
        {/* Wave cap at bottom edge */}
        <div className="pointer-events-none absolute bottom-0 left-0 w-full overflow-hidden" aria-hidden="true" style={{ height: "60px" }}>
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="absolute bottom-0 w-full" style={{ height: "60px" }}>
            <path fill="rgba(255,255,255,0.03)" d="M0,32L120,37.3C240,43,480,53,720,48C960,43,1200,21,1320,10.7L1440,0L1440,60L0,60Z" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
          <Reveal>
            <div className="text-center">
              {/* Pill badge */}
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em]" style={{ color: T.accent }}>
                Document Checklist
              </div>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                What You'll Need
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: "rgba(199,210,254,0.70)" }}>
                Have these ready before you start — the whole process is faster when you're prepared.
              </p>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {DOCS.map((doc, i) => {
              const Icon = doc.icon;
              return (
                <Reveal key={doc.title} delay={i * 80}>
                  <div
                    className="group relative h-full overflow-hidden rounded-2xl border p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1"
                    style={{
                      borderColor: "rgba(255,255,255,0.10)",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      boxShadow: "0 4px 24px -10px rgba(0,0,0,0.30)",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = "rgba(249,115,22,0.45)";
                      e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.09)";
                      e.currentTarget.style.boxShadow = "0 16px 40px -16px rgba(0,0,0,0.40), 0 0 0 1px rgba(249,115,22,0.20)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)";
                      e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
                      e.currentTarget.style.boxShadow = "0 4px 24px -10px rgba(0,0,0,0.30)";
                    }}
                  >
                    {/* Accent top bar on hover */}
                    <div
                      className="absolute left-0 top-0 h-0.5 w-full origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                      style={{ background: `linear-gradient(90deg, ${T.accent}, ${T.accentDk})` }}
                      aria-hidden="true"
                    />

                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110"
                      style={{ backgroundColor: "rgba(249,115,22,0.15)", color: T.accent }}
                    >
                      <Icon size={18} />
                    </div>

                    <div className="mt-4 flex items-start justify-between gap-2">
                      <h3 className="text-sm font-extrabold text-white">{doc.title}</h3>
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{
                          backgroundColor: doc.required ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
                          color: doc.required ? "#FCA5A5" : "#86EFAC",
                        }}
                      >
                        {doc.required ? "Required" : "Optional"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed" style={{ color: "rgba(199,210,254,0.70)" }}>{doc.desc}</p>
                    <p className="mt-3 text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.30)" }}>{doc.sub}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>


      {/* ── FAQ — white bg + isometric texture ── */}
      <section className="relative isolate overflow-hidden py-20 lg:py-24">
        <GeometricBackground variant="isometric" />

        <div className="mx-auto max-w-3xl px-6 lg:px-10">
          <Reveal>
            <div className="text-center">
              <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: T.accent }}>Common Questions</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: T.navy }}>
                Frequently Asked Questions
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: T.soft }}>
                Can't find your answer? Reach out to our HR team directly.
              </p>
            </div>
          </Reveal>

          <div className="mt-10 space-y-2">
            {FAQS.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <Reveal key={i} delay={i * 35}>
                  <div
                    className="group overflow-hidden rounded-xl border bg-white"
                    style={{
                      borderColor: isOpen ? T.accent : T.line,
                      boxShadow: isOpen
                        ? "0 6px 24px -10px rgba(249,115,22,0.18)"
                        : "0 1px 4px -2px rgba(6,15,90,0.06)",
                      transition: "border-color 250ms ease, box-shadow 250ms ease, transform 200ms ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={e => {
                      if (!isOpen) {
                        e.currentTarget.style.borderColor = "rgba(249,115,22,0.4)";
                        e.currentTarget.style.boxShadow = "0 4px 16px -8px rgba(6,15,90,0.12)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isOpen) {
                        e.currentTarget.style.borderColor = T.line;
                        e.currentTarget.style.boxShadow = "0 1px 4px -2px rgba(6,15,90,0.06)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }
                    }}
                  >
                    <button
                      className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left"
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      aria-expanded={isOpen}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-black"
                          style={{
                            backgroundColor: isOpen ? T.accent : "#EEF1FB",
                            color: isOpen ? "#fff" : T.navy,
                            transition: "background-color 250ms ease, color 250ms ease",
                          }}
                        >
                          {i + 1}
                        </div>
                        <span
                          className="text-sm font-bold truncate"
                          style={{
                            color: isOpen ? T.accent : T.navy,
                            transition: "color 200ms ease",
                          }}
                        >
                          {faq.q}
                        </span>
                      </div>
                      {/* Right side: click hint + chevron */}
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span
                          className="hidden text-[10px] font-semibold uppercase tracking-wide opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:block"
                          style={{ color: T.accent }}
                        >
                          {isOpen ? "close" : "view"}
                        </span>
                        <ChevronDown
                          size={15}
                          style={{
                            flexShrink: 0,
                            color: isOpen ? T.accent : T.soft,
                            transition: "transform 300ms, color 200ms",
                            transform: isOpen ? "rotate(180deg)" : "rotate(0)",
                          }}
                        />
                      </div>
                    </button>
                    <div style={{ maxHeight: isOpen ? "200px" : "0", overflow: "hidden", transition: "max-height 350ms ease" }}>
                      <div className="border-t px-5 pb-4 pt-3" style={{ borderColor: T.line, backgroundColor: T.paper }}>
                        <p className="text-sm leading-relaxed" style={{ color: T.soft }}>{faq.a}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── NOTICE — navy bg, same as Home's about strip ─────────────── */}
      <section style={{ backgroundColor: T.navy }} className="relative overflow-hidden">
        {/* faint grid */}
        <div className="pointer-events-none absolute inset-0 opacity-10" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }} aria-hidden="true" />

        <div className="relative mx-auto max-w-7xl px-6 py-14 lg:px-10">
          <Reveal>
            <div className="flex items-start gap-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: T.accent }}>
                <AlertCircle size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Important Notice</h3>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {NOTICES.map((n, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "rgba(199,210,254,0.7)" }}>
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: T.accent }} />
                      {n}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA — paper bg + radial gradient, restrained ────────────── */}
      <section className="relative isolate overflow-hidden py-20 lg:py-24">
        <div className="pointer-events-none absolute inset-0 -z-10" style={{
          background: `radial-gradient(ellipse at 50% 100%, rgba(249,115,22,0.06) 0%, transparent 70%)`,
        }} aria-hidden="true" />

        <Reveal>
          <div className="mx-auto max-w-2xl px-6 text-center lg:px-10">
            <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: T.accent }}>Start Today</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: T.navy }}>
              Ready to Start Your Application?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed" style={{ color: T.soft }}>
              Browse current openings and take the first step toward your next career opportunity.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/jobs">
                <button
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5"
                  style={{ backgroundColor: T.accent, boxShadow: "0 10px 30px -10px rgba(249,115,22,0.45)" }}
                >
                  View Open Positions <ArrowRight size={15} />
                </button>
              </Link>
              <Link to="/track">
                <button
                  className="inline-flex items-center gap-2 rounded-xl border-2 px-6 py-3 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5"
                  style={{ borderColor: T.line, color: T.navy }}
                >
                  Track My Application
                </button>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

    </div>
  );
}
