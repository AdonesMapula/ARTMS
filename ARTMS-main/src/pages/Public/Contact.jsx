import { useState } from "react";
import {
  Send,
  Loader2,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Clock,
  User,
  AtSign,
  MessageSquare,
  FileText,
} from "lucide-react";
import { FiFacebook } from "react-icons/fi";
import Input from "../../components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import AlertModal from "../../components/ui/AlertModal";
import Reveal from "../../components/ui/Reavel";
import CompanyMap from "../../components/map/CompanyMap";
import GeometricBackground from "../../components/ui/GeometricBackground";

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

const QUICK_CONTACTS = [
  {
    icon: FiFacebook,
    label: "Facebook",
    value: "facebook.com/artms.hr",
    href: "https://www.facebook.com/profile.php?id=61569137152505",
    external: true,
  },
  {
    icon: Mail,
    label: "Email",
    value: "talent@artms.example",
    href: "mailto:talent@artms.example",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+63 000 000 0000",
    href: "tel:+630000000000",
  },
  {
    icon: MapPin,
    label: "Location",
    value: "PDI Condominium Building, Gov M. Cuenco Ave, Banilad, Cebu City, Philippines, 6000",
    href: null,
  },
];

const initialForm = { name: "", email: "", subject: "", message: "" };

export default function Contact() {
  const [alert, setAlert] = useState({ open: false, variant: "info", title: "", message: "" });
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const showAlert = (variant, title, message) =>
    setAlert({ open: true, variant, title, message });
  const closeAlert = () => setAlert((a) => ({ ...a, open: false }));

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSent(true);
      showAlert(
        "info",
        "Not Connected Yet",
        "The contact form is not yet connected to a backend. Your message was not sent."
      );
      setTimeout(() => setSent(false), 2200);
    }, 700);
  };

  return (
    <div style={{ backgroundColor: TOKENS.paper, fontFamily: "Inter, sans-serif" }}>
      {/* ── HERO — photo + navy wash + grid, identical to Home/Jobs/ApplicationGuide/About ── */}
      <section className="relative isolate overflow-hidden">
        {/* Background photo with navy wash */}
        <div
          className="absolute inset-0 -z-20 scale-105 bg-cover bg-center"
          style={{ backgroundImage: "url(https://images.unsplash.com/photo-1534536281715-e28d76689b4d?q=80&w=2000&auto=format&fit=crop)" }}
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
          <Reveal>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-500/40 bg-orange-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--artms-accent)]">
              <Mail size={14} />
              Contact Us
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="max-w-4xl text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Let's Talk About Your Next <span className="text-[var(--artms-accent)]">Great Hire</span>
            </h1>
          </Reveal>

          <Reveal delay={220}>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-indigo-100/80 sm:text-lg">
              Whether you're building a team or exploring what ARTMS can do for your
              HR workflow, send us a note and we'll get back to you within one business day.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── QUICK STATS BAR — solid navy, identical to ApplicationGuide ── */}
      <div style={{ backgroundColor: "#060F5A" }} className="border-y border-white/10">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid grid-cols-3 divide-x divide-white/10">
            {[
              { val: "1 Day", label: "Response time" },
              { val: "24/7", label: "Support available" },
              { val: "100%", label: "Secure messaging" },
            ].map((s, i) => (
              <div key={i} className="px-6 py-5 text-center">
                <p className="text-lg font-extrabold text-white">{s.val}</p>
                <p className="mt-0.5 text-xs text-indigo-100/60">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------------- Quick Contact Cards ---------------- */}
      <section className="relative isolate overflow-hidden mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <GeometricBackground variant="polygons" />
        <div className="pointer-events-none absolute -left-20 top-1/2 -z-10 h-80 w-80 -translate-y-1/2 rounded-full blur-3xl opacity-30" style={{ background: "radial-gradient(circle, rgba(6,15,90,0.08) 0%, transparent 70%)" }} aria-hidden="true" />

        {/* Quick contact cards */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_CONTACTS.map((c, i) => {
            const Icon = c.icon;
            const content = (
              <div
                className="group relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border bg-white/90 backdrop-blur-sm p-5 transition-all duration-300 hover:-translate-y-1"
                style={{
                  borderColor: TOKENS.line,
                  boxShadow: "0 4px 16px -10px rgba(6,15,90,0.12)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 16px 40px -16px rgba(6,15,90,0.18)";
                  e.currentTarget.style.borderColor = "rgba(249,115,22,0.35)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 16px -10px rgba(6,15,90,0.12)";
                  e.currentTarget.style.borderColor = TOKENS.line;
                }}
              >
                {/* Accent top bar on hover */}
                <div
                  className="absolute left-0 top-0 h-0.5 w-full origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                  style={{ background: "linear-gradient(90deg, #F97316, #EA580C)" }}
                  aria-hidden="true"
                />

                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110"
                  style={{ backgroundColor: "#EEF1FB", color: TOKENS.navy }}
                >
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: TOKENS.slateSoft }}>
                    {c.label}
                  </p>
                  <p
                    className="mt-0.5 break-words text-sm font-semibold leading-snug"
                    style={{ color: TOKENS.slate }}
                  >
                    {c.value}
                  </p>
                </div>
              </div>
            );

            return (
              <Reveal key={c.label} delay={i * 80}>
                {c.href ? (
                  <a
                    href={c.href}
                    target={c.external ? "_blank" : undefined}
                    rel={c.external ? "noopener noreferrer" : undefined}
                    className="block h-full"
                  >
                    {content}
                  </a>
                ) : (
                  content
                )}
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ---------------- Form + Map ---------------- */}
      <section className="relative isolate overflow-hidden mx-auto max-w-7xl px-6 py-14 lg:px-10">
        <GeometricBackground variant="mesh" />
        <div className="pointer-events-none absolute -right-20 top-1/2 -z-10 h-80 w-80 -translate-y-1/2 rounded-full blur-3xl opacity-25" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.10) 0%, transparent 70%)" }} aria-hidden="true" />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Message form */}
        <Reveal className="lg:col-span-1" delay={60}>
          <Card
            className="h-full border-0"
            style={{ borderColor: TOKENS.line, boxShadow: "0 4px 16px -10px rgba(6,15,90,0.12)" }}
          >
            <CardHeader>
              <CardTitle className="text-base" style={{ color: TOKENS.navy }}>
                Send us a message
              </CardTitle>
              <p className="mt-1 text-sm" style={{ color: TOKENS.slateSoft }}>
                Frontend-only for now — this form is ready to wire up to an API.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Full Name with Icon */}
                  <div className="w-full">
                    <label className="mb-1.5 block text-sm font-semibold text-slate-800" htmlFor="name">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                        <User size={18} style={{ color: TOKENS.slateSoft }} />
                      </div>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Your name"
                        value={form.name}
                        onChange={(e) => set("name", e.target.value)}
                        className="h-11 w-full rounded-xl border bg-white pl-11 pr-3 text-sm outline-none transition"
                        style={{ borderColor: TOKENS.line, color: TOKENS.slate }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = TOKENS.navy;
                          e.currentTarget.style.boxShadow = `0 0 0 4px rgba(6,15,90,0.08)`;
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = TOKENS.line;
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      />
                    </div>
                  </div>

                  {/* Email with Icon */}
                  <div className="w-full">
                    <label className="mb-1.5 block text-sm font-semibold text-slate-800" htmlFor="email">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                        <AtSign size={18} style={{ color: TOKENS.slateSoft }} />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@email.com"
                        value={form.email}
                        onChange={(e) => set("email", e.target.value)}
                        className="h-11 w-full rounded-xl border bg-white pl-11 pr-3 text-sm outline-none transition"
                        style={{ borderColor: TOKENS.line, color: TOKENS.slate }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = TOKENS.navy;
                          e.currentTarget.style.boxShadow = `0 0 0 4px rgba(6,15,90,0.08)`;
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = TOKENS.line;
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      />
                    </div>
                  </div>

                  {/* Subject with Icon */}
                  <div className="w-full sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-semibold text-slate-800" htmlFor="subject">
                      Subject
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                        <FileText size={18} style={{ color: TOKENS.slateSoft }} />
                      </div>
                      <input
                        id="subject"
                        name="subject"
                        type="text"
                        placeholder="How can we help?"
                        value={form.subject}
                        onChange={(e) => set("subject", e.target.value)}
                        className="h-11 w-full rounded-xl border bg-white pl-11 pr-3 text-sm outline-none transition"
                        style={{ borderColor: TOKENS.line, color: TOKENS.slate }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = TOKENS.navy;
                          e.currentTarget.style.boxShadow = `0 0 0 4px rgba(6,15,90,0.08)`;
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = TOKENS.line;
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      />
                    </div>
                  </div>

                  {/* Message with Icon */}
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-semibold text-slate-800" htmlFor="message">
                      Message
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-3 flex items-center pointer-events-none">
                        <MessageSquare size={18} style={{ color: TOKENS.slateSoft }} />
                      </div>
                      <textarea
                        id="message"
                        rows={5}
                        className="w-full rounded-xl border bg-white pl-11 pr-3 py-2.5 text-sm outline-none transition resize-none"
                        style={{ borderColor: TOKENS.line, color: TOKENS.slate }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = TOKENS.navy;
                          e.currentTarget.style.boxShadow = `0 0 0 4px rgba(6,15,90,0.08)`;
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = TOKENS.line;
                          e.currentTarget.style.boxShadow = "none";
                        }}
                        placeholder="Write your message…"
                        value={form.message}
                        onChange={(e) => set("message", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-3">
                  <p className="mr-auto text-xs" style={{ color: TOKENS.slateSoft }}>
                    We typically reply within one business day.
                  </p>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="group inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-[0_10px_30px_-10px_rgba(249,115,22,0.55)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-10px_rgba(249,115,22,0.65)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                    style={{ backgroundColor: sent ? "#16A34A" : TOKENS.accent }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Sending…
                      </>
                    ) : sent ? (
                      <>
                        <CheckCircle2 size={16} />
                        Sent
                      </>
                    ) : (
                      <>
                        <Send size={16} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                        Submit
                      </>
                    )}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </Reveal>

        {/* Map */}
        <Reveal className="lg:col-span-1" delay={120}>
          <div className="flex h-full flex-col gap-4">
            <div
              className="overflow-hidden rounded-[16px] border"
              style={{
                borderColor: TOKENS.line,
                boxShadow: "0 4px 24px -8px rgba(6,15,90,0.16)",
                minHeight: "380px",
              }}
            >
              <CompanyMap height="380px" />
            </div>

            {/* Office hours strip under the map */}
            <div
              className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3"
              style={{ borderColor: TOKENS.line, boxShadow: "0 4px 16px -10px rgba(6,15,90,0.10)" }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: "#EEF1FB", color: TOKENS.navy }}
              >
                <Clock size={15} />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: TOKENS.slateSoft }}>
                  Office Hours
                </p>
                <p className="text-sm font-semibold" style={{ color: TOKENS.slate }}>
                  Mon–Fri, 9:00 AM – 6:00 PM (PHT)
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
      </section>

      <AlertModal
        open={alert.open}
        variant={alert.variant}
        title={alert.title}
        message={alert.message}
        onClose={closeAlert}
      />
    </div>
  );
}