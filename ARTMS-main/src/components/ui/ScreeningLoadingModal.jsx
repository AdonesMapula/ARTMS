import { useEffect, useState } from "react";
import { FiCpu, FiLoader } from "react-icons/fi";

/**
 * ScreeningLoadingModal
 *
 * A full-screen blocking overlay shown while AI resume screening is running.
 * - Covers the entire viewport including sidebar and navigation (z-[9999])
 * - Blocks all pointer interaction beneath it
 * - Smooth fade-in + scale-up entrance animation on mount
 * - Animated CPU icon with concentric pulse rings
 * - Sequential step list that fades in one by one
 * - Smooth animated progress bar
 *
 * Props:
 *   applicant  — the applicant object { first_name, last_name } being screened
 *   visible    — boolean controlling visibility (allows exit animation)
 */

const STEPS = [
  { label: "Parsing resume content…", delay: 0 },
  { label: "Extracting skills & experience…", delay: 500 },
  { label: "Scoring against job requirements…", delay: 1050 },
  { label: "Generating AI evaluation report…", delay: 1650 },
];

export default function ScreeningLoadingModal({ applicant, visible = true }) {
  // Controls the CSS transition — starts false, flips to true on next tick for enter animation
  const [show, setShow] = useState(false);
  // Track which steps have appeared
  const [visibleSteps, setVisibleSteps] = useState([]);

  useEffect(() => {
    if (visible) {
      // Trigger entrance animation on next paint
      const enterTimer = requestAnimationFrame(() => setShow(true));

      // Reveal steps sequentially
      const stepTimers = STEPS.map((step, i) =>
        setTimeout(() => {
          setVisibleSteps(prev => [...prev, i]);
        }, step.delay + 200) // 200ms after modal appears
      );

      return () => {
        cancelAnimationFrame(enterTimer);
        stepTimers.forEach(clearTimeout);
      };
    } else {
      setShow(false);
      setVisibleSteps([]);
    }
  }, [visible]);

  if (!visible && !show) return null;

  const name = applicant
    ? `${applicant.first_name ?? ""} ${applicant.last_name ?? ""}`.trim()
    : "Applicant";

  return (
    <>
      {/* ── Global style injected once ─────────────────────────────── */}
      <style>{`
        @keyframes slm-ping-slow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 0;   transform: scale(1.8); }
        }
        @keyframes slm-ping-fast {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 0;   transform: scale(1.5); }
        }
        @keyframes slm-progress {
          0%   { width: 0%;   }
          30%  { width: 45%;  }
          55%  { width: 65%;  }
          75%  { width: 80%;  }
          88%  { width: 88%;  }
          96%  { width: 93%;  }
          100% { width: 96%;  }
        }
        @keyframes slm-rotate {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(360deg); }
        }
        @keyframes slm-step-in {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
        .slm-step-enter {
          animation: slm-step-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>

      {/* ── Backdrop ──────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{
          pointerEvents: "all",
          // Smooth fade-in for backdrop
          backgroundColor: show ? "rgba(15,23,42,0.65)" : "rgba(15,23,42,0)",
          backdropFilter: show ? "blur(4px)" : "blur(0px)",
          transition: "background-color 0.35s ease, backdrop-filter 0.35s ease",
        }}
      >
        {/* ── Modal Card ──────────────────────────────────────────── */}
        <div
          className="relative mx-4 w-full max-w-sm rounded-2xl bg-white shadow-2xl"
          style={{
            // Scale + fade entrance
            opacity: show ? 1 : 0,
            transform: show ? "scale(1) translateY(0)" : "scale(0.94) translateY(12px)",
            transition: "opacity 0.4s cubic-bezier(0.22,1,0.36,1), transform 0.4s cubic-bezier(0.22,1,0.36,1)",
          }}
        >

          <div className="p-8">

            {/* ── Animated CPU icon with rings ───────────────────── */}
            <div className="mb-7 flex justify-center">
              <div className="relative flex h-24 w-24 items-center justify-center">

                {/* Outer slow ping ring */}
                <span
                  className="absolute inline-flex h-full w-full rounded-full"
                  style={{
                    background: "rgba(17,26,98,0.08)",
                    animation: "slm-ping-slow 2s ease-in-out infinite",
                  }}
                />
                {/* Middle fast ping ring */}
                <span
                  className="absolute inline-flex h-16 w-16 rounded-full"
                  style={{
                    background: "rgba(17,26,98,0.14)",
                    animation: "slm-ping-fast 1.5s ease-in-out infinite 0.3s",
                  }}
                />

                {/* Icon circle */}
                <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-[#111A62] shadow-lg"
                  style={{ boxShadow: "0 8px 24px rgba(17,26,98,0.35)" }}
                >
                  <FiCpu
                    size={26}
                    className="text-white"
                    style={{ animation: "slm-rotate 3s linear infinite" }}
                  />
                </div>
              </div>
            </div>

            {/* ── Title & subtitle ───────────────────────────────── */}
            <h2 className="mb-1 text-center text-[17px] font-extrabold tracking-tight text-slate-900">
              AI Screening in Progress
            </h2>
            <p className="mb-7 text-center text-[13px] text-slate-500 leading-relaxed">
              Analyzing resume for{" "}
              <span className="font-semibold text-[#111A62]">{name}</span>
            </p>

            {/* ── Step list ─────────────────────────────────────── */}
            <div className="mb-6 space-y-2.5">
              {STEPS.map((step, i) => {
                const isVisible = visibleSteps.includes(i);
                const isDone = visibleSteps.includes(i + 1);
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 ${isVisible ? "slm-step-enter" : "opacity-0"}`}
                  >
                    {/* Step icon */}
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${isDone
                        ? "bg-emerald-100"
                        : isVisible
                          ? "bg-[#111A62]/10"
                          : "bg-slate-100"
                      }`}>
                      {isDone ? (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2 2 4-4" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <FiLoader
                          size={10}
                          className="text-[#111A62]"
                          style={{ animation: isVisible ? "slm-rotate 1s linear infinite" : "none" }}
                        />
                      )}
                    </div>

                    {/* Step label */}
                    <p className={`text-[12px] font-medium transition-colors duration-300 ${isDone ? "text-emerald-600 line-through decoration-emerald-300" : "text-slate-600"
                      }`}>
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* ── Progress bar ──────────────────────────────────── */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#111A62] to-[#3b4fd4]"
                style={{
                  animation: show ? "slm-progress 12s cubic-bezier(0.4,0,0.2,1) forwards" : "none",
                }}
              />
            </div>

            {/* ── Hint text ─────────────────────────────────────── */}
            <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Please wait · do not navigate away
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
