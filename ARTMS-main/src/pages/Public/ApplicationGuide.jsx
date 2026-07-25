import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  Calendar,
  UserCheck,
  AlertCircle,
  ChevronRight,
  Search,
  Edit3,
  Send,
  Eye,
  Download,
  Shield,
  HelpCircle,
  ArrowRight,
  Briefcase,
} from "lucide-react";

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

/** Reusable Reveal animation component */
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

const APPLICATION_STEPS = [
  {
    id: 1,
    icon: Search,
    title: "Find Your Perfect Role",
    description: "Browse our job postings and filter by department, location, or job type to discover opportunities that match your skills and career goals.",
    tips: [
      "Use the search bar to find specific positions",
      "Read the full job description carefully",
      "Check the required qualifications and responsibilities",
      "Note the application deadline if specified",
    ],
  },
  {
    id: 2,
    icon: FileText,
    title: "Prepare Your Documents",
    description: "Gather all required documents before starting your application. Having everything ready ensures a smooth submission process.",
    tips: [
      "Update your resume/CV with your latest experience",
      "Save your resume as PDF (recommended) or DOC/DOCX",
      "Keep file size under 5MB for faster upload",
      "Use a professional filename (e.g., JohnDoe_Resume.pdf)",
      "Prepare a cover letter tailored to the position (optional but recommended)",
    ],
  },
  {
    id: 3,
    icon: Edit3,
    title: "Complete the Application Form",
    description: "Fill out all required fields accurately. Our system uses this information to match you with the right opportunities.",
    tips: [
      "Provide accurate contact information (email and phone)",
      "Double-check your email address for typos",
      "Fill in all mandatory fields marked with an asterisk (*)",
      "Be honest about your experience and qualifications",
      "Review your entries before submitting",
    ],
  },
  {
    id: 4,
    icon: Upload,
    title: "Upload Your Resume",
    description: "Our AI-powered system will automatically extract your skills and experience from your resume to match you with suitable positions.",
    tips: [
      "Ensure your resume is in a readable format (PDF, DOC, DOCX)",
      "Use standard resume formatting for better AI parsing",
      "Include clear section headers (Experience, Education, Skills)",
      "List specific skills and technologies you've used",
      "Verify the upload completes successfully before proceeding",
    ],
  },
  {
    id: 5,
    icon: Eye,
    title: "Review and Submit",
    description: "Take a moment to review all the information you've provided. Once you're confident everything is correct, submit your application.",
    tips: [
      "Review all personal information for accuracy",
      "Ensure your resume uploaded correctly",
      "Read any additional instructions or requirements",
      "Check the job title matches the position you want",
      "Click 'Submit Application' when ready",
    ],
  },
  {
    id: 6,
    icon: Mail,
    title: "Confirmation & Next Steps",
    description: "You'll receive an instant confirmation email. Our HR team will review your application and contact you about next steps.",
    tips: [
      "Check your email (including spam folder) for confirmation",
      "Save the confirmation email for your records",
      "Note the application reference number if provided",
      "Keep your phone and email accessible",
      "Be patient - review process may take 1-2 weeks",
    ],
  },
];

const DOCUMENT_REQUIREMENTS = [
  {
    icon: FileText,
    title: "Resume/CV",
    required: true,
    description: "Your most up-to-date resume highlighting your experience, education, and skills.",
    formats: "PDF, DOC, DOCX (Max 5MB)",
  },
  {
    icon: Edit3,
    title: "Cover Letter",
    required: false,
    description: "A personalized letter explaining your interest in the position and company.",
    formats: "Optional - Include in resume or upload separately",
  },
  {
    icon: Shield,
    title: "Valid ID",
    required: false,
    description: "Government-issued ID may be required for certain positions during later stages.",
    formats: "Required only if shortlisted",
  },
];

const FAQ_ITEMS = [
  {
    question: "Do I need to create an account to apply?",
    answer: "No, you don't need an account to submit your application. Simply browse job postings and apply directly through our application form.",
  },
  {
    question: "How long does the application process take?",
    answer: "The initial application takes just 5-10 minutes to complete. After submission, our HR team typically reviews applications within 1-2 weeks and will contact shortlisted candidates.",
  },
  {
    question: "What file formats are accepted for resumes?",
    answer: "We accept PDF, DOC, and DOCX formats. PDF is recommended for best compatibility. Please keep your file size under 5MB.",
  },
  {
    question: "Can I apply for multiple positions?",
    answer: "Yes! You can submit separate applications for different positions that match your qualifications and interests.",
  },
  {
    question: "What happens after I submit my application?",
    answer: "You'll receive an immediate confirmation email. Our AI system will screen your resume, and our HR team will review qualified candidates. Shortlisted applicants will be contacted via email or phone for interviews.",
  },
  {
    question: "How will I know if my application was successful?",
    answer: "All applicants receive a confirmation email upon submission. Shortlisted candidates will be contacted directly for the next steps. If you don't hear from us within 3-4 weeks, the position may have been filled.",
  },
  {
    question: "Can I edit my application after submission?",
    answer: "Once submitted, applications cannot be edited. Please review all information carefully before submitting. If you need to update your application, you can contact our HR team directly.",
  },
  {
    question: "What is AI screening and how does it work?",
    answer: "Our AI system analyzes your resume to extract skills, experience, and qualifications, then matches them against job requirements. This helps ensure your application gets noticed for relevant positions. The final hiring decision is always made by our HR team.",
  },
];

const TIPS_FOR_SUCCESS = [
  {
    icon: FileText,
    title: "Tailor Your Resume",
    description: "Customize your resume for each position, highlighting relevant skills and experience that match the job requirements.",
  },
  {
    icon: CheckCircle2,
    title: "Be Specific",
    description: "Include specific achievements, metrics, and technologies you've worked with rather than generic statements.",
  },
  {
    icon: Clock,
    title: "Apply Early",
    description: "Submit your application early in the posting period. Early applicants often receive priority review.",
  },
  {
    icon: Phone,
    title: "Stay Responsive",
    description: "Keep your contact information current and respond promptly to any communications from our HR team.",
  },
];

export default function ApplicationGuide() {
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

  useEffect(() => {
    const t = requestAnimationFrame(() => setHeroLoaded(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div style={{ backgroundColor: TOKENS.paper, fontFamily: "Inter, sans-serif" }}>
      
      {/* ============ Hero Section ============ */}
      <section className="relative overflow-hidden" style={{ backgroundColor: TOKENS.navy }}>
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "24px 24px",
          }}
          aria-hidden="true"
        />

        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
          <div
            className="text-center transition-all duration-700"
            style={{
              opacity: heroLoaded ? 1 : 0,
              transform: heroLoaded ? "translateY(0)" : "translateY(20px)",
            }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider"
              style={{ borderColor: "rgba(249,115,22,0.4)", backgroundColor: "rgba(249,115,22,0.1)", color: TOKENS.accent }}
            >
              <Briefcase size={14} />
              Application Guidelines
            </div>

            <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              How to Apply for a Position at{" "}
              <span style={{ color: TOKENS.accent }}>ARTMS</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-indigo-100/80 sm:text-lg">
              Follow our simple step-by-step guide to submit a successful application. 
              We've made the process quick, straightforward, and transparent.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/jobs">
                <button
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5"
                  style={{ backgroundColor: TOKENS.accent }}
                >
                  Browse Open Positions <ArrowRight size={16} />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ Application Steps ============ */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-24">
        <Reveal>
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: TOKENS.accent }}>
              Step-by-Step Process
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: TOKENS.navy }}>
              Your Application Journey
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base" style={{ color: TOKENS.slateSoft }}>
              From finding the right job to receiving your confirmation email - here's what to expect.
            </p>
          </div>
        </Reveal>

        <div className="mt-16 space-y-8">
          {APPLICATION_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.id} delay={index * 80}>
                <div className="grid gap-6 rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md lg:grid-cols-[auto_1fr] lg:gap-8 lg:p-8"
                  style={{ borderColor: TOKENS.line }}
                >
                  {/* Step number and icon */}
                  <div className="flex items-start gap-4 lg:flex-col lg:items-center">
                    <div
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: "#EEF1FB", color: TOKENS.navy }}
                    >
                      <Icon size={28} />
                    </div>
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-black text-white lg:mt-2"
                      style={{ backgroundColor: TOKENS.accent }}
                    >
                      {step.id}
                    </div>
                  </div>

                  {/* Step content */}
                  <div>
                    <h3 className="text-xl font-extrabold" style={{ color: TOKENS.navy }}>
                      {step.title}
                    </h3>
                    <p className="mt-2 text-base leading-relaxed" style={{ color: TOKENS.slate }}>
                      {step.description}
                    </p>

                    {/* Tips */}
                    {step.tips && step.tips.length > 0 && (
                      <div className="mt-4 rounded-xl p-4" style={{ backgroundColor: TOKENS.paper }}>
                        <p className="text-sm font-bold" style={{ color: TOKENS.navy }}>
                          💡 Pro Tips:
                        </p>
                        <ul className="mt-2 space-y-1.5">
                          {step.tips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: TOKENS.slateSoft }}>
                              <ChevronRight size={16} className="mt-0.5 shrink-0" style={{ color: TOKENS.accent }} />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ============ Document Requirements ============ */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <Reveal>
            <div className="text-center">
              <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: TOKENS.accent }}>
                Document Checklist
              </p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: TOKENS.navy }}>
                What You'll Need to Apply
              </h2>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {DOCUMENT_REQUIREMENTS.map((doc, index) => {
              const Icon = doc.icon;
              return (
                <Reveal key={doc.title} delay={index * 100}>
                  <div className="relative rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md"
                    style={{ borderColor: TOKENS.line }}
                  >
                    {/* Required badge */}
                    {doc.required && (
                      <div
                        className="absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-bold"
                        style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#DC2626" }}
                      >
                        Required
                      </div>
                    )}
                    {!doc.required && (
                      <div
                        className="absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-bold"
                        style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "#16A34A" }}
                      >
                        Optional
                      </div>
                    )}

                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl"
                      style={{ backgroundColor: "#EEF1FB", color: TOKENS.navy }}
                    >
                      <Icon size={24} />
                    </div>

                    <h3 className="mt-4 text-lg font-extrabold" style={{ color: TOKENS.navy }}>
                      {doc.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: TOKENS.slate }}>
                      {doc.description}
                    </p>
                    <p className="mt-3 text-xs font-semibold" style={{ color: TOKENS.slateSoft }}>
                      {doc.formats}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ Tips for Success ============ */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-24">
        <Reveal>
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: TOKENS.accent }}>
              Expert Advice
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: TOKENS.navy }}>
              Tips to Stand Out
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base" style={{ color: TOKENS.slateSoft }}>
              Increase your chances of landing an interview with these proven strategies.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {TIPS_FOR_SUCCESS.map((tip, index) => {
            const Icon = tip.icon;
            return (
              <Reveal key={tip.title} delay={index * 80}>
                <div className="rounded-2xl border bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  style={{ borderColor: TOKENS.line }}
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ backgroundColor: "rgba(249,115,22,0.1)", color: TOKENS.accent }}
                  >
                    <Icon size={24} />
                  </div>
                  <h3 className="mt-4 text-base font-extrabold" style={{ color: TOKENS.navy }}>
                    {tip.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: TOKENS.slateSoft }}>
                    {tip.description}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ============ FAQ Section ============ */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-20 lg:py-24">
        <div className="mx-auto max-w-4xl px-6 lg:px-10">
          <Reveal>
            <div className="text-center">
              <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: TOKENS.accent }}>
                Common Questions
              </p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: TOKENS.navy }}>
                Frequently Asked Questions
              </h2>
            </div>
          </Reveal>

          <div className="mt-12 space-y-4">
            {FAQ_ITEMS.map((faq, index) => (
              <Reveal key={index} delay={index * 50}>
                <div
                  className="overflow-hidden rounded-xl border bg-white transition-all duration-300"
                  style={{ borderColor: expandedFaq === index ? TOKENS.accent : TOKENS.line }}
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="flex w-full items-start justify-between gap-4 p-6 text-left transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-start gap-3">
                      <HelpCircle
                        size={20}
                        className="mt-0.5 shrink-0"
                        style={{ color: expandedFaq === index ? TOKENS.accent : TOKENS.slateSoft }}
                      />
                      <span className="font-bold" style={{ color: TOKENS.navy }}>
                        {faq.question}
                      </span>
                    </div>
                    <ChevronRight
                      size={20}
                      className="shrink-0 transition-transform duration-300"
                      style={{
                        color: TOKENS.slateSoft,
                        transform: expandedFaq === index ? "rotate(90deg)" : "rotate(0deg)",
                      }}
                    />
                  </button>

                  {expandedFaq === index && (
                    <div
                      className="border-t px-6 pb-6 pt-4"
                      style={{ borderColor: TOKENS.line, backgroundColor: TOKENS.paper }}
                    >
                      <p className="text-sm leading-relaxed" style={{ color: TOKENS.slate }}>
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Important Notice ============ */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <Reveal>
          <div
            className="rounded-2xl border-2 p-8 lg:p-10"
            style={{ borderColor: TOKENS.accent, backgroundColor: "rgba(249,115,22,0.05)" }}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: TOKENS.accent }}
              >
                <AlertCircle size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold" style={{ color: TOKENS.navy }}>
                  Important Notice
                </h3>
                <div className="mt-3 space-y-2 text-sm leading-relaxed" style={{ color: TOKENS.slate }}>
                  <p>
                    • <strong>ARTMS never charges any fee</strong> for job applications or the recruitment process.
                  </p>
                  <p>
                    • Be cautious of fraudulent job postings. Only apply through our official website.
                  </p>
                  <p>
                    • Your personal information is protected and will only be used for recruitment purposes.
                  </p>
                  <p>
                    • If you encounter any issues during the application process, contact our support team immediately.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ============ CTA Section ============ */}
      <section className="py-20 lg:py-24" style={{ backgroundColor: TOKENS.navy }}>
        <div className="mx-auto max-w-4xl px-6 text-center lg:px-10">
          <Reveal>
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Ready to Start Your Application?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-indigo-100/80 sm:text-lg">
              Browse our current openings and take the first step toward your next career opportunity.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/jobs">
                <button
                  className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-white transition-all duration-200 hover:-translate-y-0.5"
                  style={{ backgroundColor: TOKENS.accent }}
                >
                  View Open Positions <ArrowRight size={18} />
                </button>
              </Link>
              <Link to="/contact">
                <button
                  className="inline-flex items-center gap-2 rounded-xl border-2 px-8 py-4 text-base font-bold text-white transition-all duration-200 hover:-translate-y-0.5"
                  style={{ borderColor: "rgba(255,255,255,0.3)" }}
                >
                  Contact Support
                </button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

    </div>
  );
}
