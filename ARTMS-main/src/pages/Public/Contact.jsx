import { useState } from "react";
import {
  Mail,
  MapPin,
  Phone,
  Send,
  Loader2,
  CheckCircle2,
  Quote,
  Clock,
  Sparkles,
} from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import AlertModal from "../../components/ui/AlertModal";
import Reveal from "../../components/ui/Reavel";

// Same token system as Home.jsx — keeps this page visually consistent
// with the landing page instead of drifting into its own palette.
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
  { icon: MapPin, label: "Location", value: "PH · Enterprise Hiring Operations" },
  { icon: Mail, label: "Email", value: "talent@artms.example", href: "mailto:talent@artms.example" },
  { icon: Phone, label: "Phone", value: "+63 000 000 0000", href: "tel:+630000000000" },
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
    // Simulated round-trip — swap for a real API call when the backend is ready.
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
      {/* ---------------- Intro ---------------- */}
      <section className="mx-auto max-w-7xl px-6 pt-16 lg:px-10">
        <Reveal>
          <p
            className="text-xs font-black uppercase tracking-[0.22em]"
            style={{ color: TOKENS.accent }}
          >
            Contact
          </p>
          <h1
            className="mt-3 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl"
            style={{ color: TOKENS.navy }}
          >
            Let's talk about your next great hire
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed sm:text-base" style={{ color: TOKENS.slateSoft }}>
            Whether you're building a team or exploring what ARTMS can do for your
            HR workflow, send us a note and we'll get back to you within one
            business day.
          </p>
        </Reveal>

        {/* Quick contact chips */}
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {QUICK_CONTACTS.map((c, i) => {
            const Icon = c.icon;
            const content = (
              <div
                className="group flex h-full items-center gap-3 rounded-[12px] border bg-white p-4 transition-all duration-300 hover:-translate-y-0.5"
                style={{ borderColor: TOKENS.line, boxShadow: "0 4px 16px -10px rgba(6,15,90,0.12)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 16px 32px -16px rgba(6,15,90,0.20)";
                  e.currentTarget.style.borderColor = "rgba(249,115,22,0.35)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 16px -10px rgba(6,15,90,0.12)";
                  e.currentTarget.style.borderColor = TOKENS.line;
                }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: "#EEF1FB", color: TOKENS.navy }}
                >
                  <Icon size={17} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: TOKENS.slateSoft }}>
                    {c.label}
                  </p>
                  <p className="truncate text-sm font-semibold" style={{ color: TOKENS.slate }}>
                    {c.value}
                  </p>
                </div>
              </div>
            );

            return (
              <Reveal key={c.label} delay={i * 80}>
                {c.href ? (
                  <a href={c.href} className="block">
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

      {/* ---------------- Form + Info ---------------- */}
      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Message form */}
          <Reveal className="lg:col-span-3" delay={60}>
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
                    <Input
                      label="Full Name"
                      name="name"
                      placeholder="Your name"
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                    />
                    <Input
                      label="Email"
                      name="email"
                      type="email"
                      placeholder="you@email.com"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                    />
                    <Input
                      label="Subject"
                      name="subject"
                      placeholder="How can we help?"
                      className="sm:col-span-2"
                      value={form.subject}
                      onChange={(e) => set("subject", e.target.value)}
                    />
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-sm font-semibold text-slate-800" htmlFor="message">
                        Message
                      </label>
                      <textarea
                        id="message"
                        rows={5}
                        className="w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none transition"
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

          {/* Reach us + Quote */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            <Reveal delay={120}>
              <Card
                className="border-0"
                style={{ borderColor: TOKENS.line, boxShadow: "0 4px 16px -10px rgba(6,15,90,0.12)" }}
              >
                <CardHeader>
                  <CardTitle className="text-base" style={{ color: TOKENS.navy }}>
                    Reach us directly
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {QUICK_CONTACTS.map((c) => {
                      const Icon = c.icon;
                      return (
                        <li key={c.label}>
                          <a
                            href={c.href || undefined}
                            className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm transition-colors"
                            style={{ color: TOKENS.slate }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                          >
                            <span
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                              style={{ backgroundColor: "#EEF1FB", color: TOKENS.navy }}
                            >
                              <Icon size={14} />
                            </span>
                            {c.value}
                          </a>
                        </li>
                      );
                    })}
                    <li className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm" style={{ color: TOKENS.slate }}>
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: "#EEF1FB", color: TOKENS.navy }}
                      >
                        <Clock size={14} />
                      </span>
                      Mon–Fri, 9:00 AM – 6:00 PM (PHT)
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </Reveal>

            {/* Quote card — navy, matches Home.jsx's About strip treatment */}
            <Reveal delay={180}>
              <div
                className="group relative flex-1 overflow-hidden rounded-[12px] p-6 transition-transform duration-300 hover:-translate-y-0.5"
                style={{ backgroundColor: TOKENS.navy }}
              >
                <div
                  className="absolute -right-8 -top-8 h-32 w-32 rounded-full transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundColor: "rgba(249,115,22,0.12)" }}
                  aria-hidden="true"
                />
                <div className="relative">
                  <div
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ backgroundColor: "rgba(255,255,255,0.1)", color: TOKENS.accent }}
                  >
                    <Quote size={20} />
                  </div>
                  <p className="mt-4 text-lg font-semibold italic leading-snug text-white">
                    "ARTMS cut our time-to-hire in half — the AI screening actually
                    understands what our teams need."
                  </p>
                  <div className="mt-5 flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black"
                      style={{ backgroundColor: TOKENS.accent, color: TOKENS.navy }}
                    >
                      JR
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Jamie Reyes</p>
                      <p className="text-xs text-indigo-100/60">HR Manager, Partner Company</p>
                    </div>
                  </div>
                  <div
                    className="mt-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide"
                    style={{ backgroundColor: "rgba(249,115,22,0.14)", color: TOKENS.accent }}
                  >
                    <Sparkles size={11} /> Trusted by growing teams
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
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