/**
 * InterviewReport.jsx
 * ────────────────────
 * Post-interview AI analysis dashboard.
 *
 * Layout:
 *  ┌──────────────────────────────────┬────────────────────────┐
 *  │  Left 2/3                         │  Right 1/3             │
 *  │  • Score ring + dimension bars    │  • Full transcript     │
 *  │  • Strengths / Weaknesses cards   │    scroll panel        │
 *  │  • Hiring recommendation          │                        │
 *  └──────────────────────────────────┴────────────────────────┘
 *
 * Route: /admin/interviews/:id/report  (HR Admin / Super Admin / COO)
 */
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FiArrowLeft, FiRefreshCw, FiAlertCircle, FiUser, FiClock } from "react-icons/fi";

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { cn } from "../../utils/cn";
import interviewService from "../../services/interviewService";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(seconds = 0) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function scoreColor(score) {
  if (score >= 75) return { ring: "stroke-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50 text-emerald-700" };
  if (score >= 50) return { ring: "stroke-amber-400",   text: "text-amber-600",   bg: "bg-amber-50 text-amber-700"   };
  return            { ring: "stroke-red-500",   text: "text-red-600",     bg: "bg-red-50 text-red-700"     };
}

// ── Circular Score Ring ───────────────────────────────────────────────────────

function ScoreRing({ score, size = 140, label = "Overall" }) {
  const r       = (size - 20) / 2;
  const circ    = 2 * Math.PI * r;
  const offset  = circ - (score / 100) * circ;
  const colors  = scoreColor(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={10} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          className={colors.ring}
          strokeWidth={10}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      {/* Score text — centred inside the ring via absolute positioning */}
      <div className="relative -mt-[calc(theme(spacing.10)+50%+10px)] flex flex-col items-center" style={{ marginTop: -(size / 2 + 10) }}>
        <span className={cn("text-4xl font-extrabold", colors.text)}>{score}</span>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
    </div>
  );
}

// Simpler inline score bar used for dimension scores
function DimensionBar({ label, score }) {
  const colors = scoreColor(score);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-600">
        <span>{label}</span>
        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", colors.bg)}>{score}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("h-2 rounded-full transition-all duration-700", {
            "bg-emerald-500": score >= 75,
            "bg-amber-400":   score >= 50 && score < 75,
            "bg-red-500":     score < 50,
          })}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

// ── Polled loading — report may take a few seconds to generate ───────────────

function useReportPoller(interviewId) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [polls,   setPolls]   = useState(0);

  useEffect(() => {
    let timer;
    let cancelled = false;

    async function attempt() {
      try {
        const { data: res } = await interviewService.getReport(interviewId);
        if (cancelled) return;

        // If AI report isn't ready yet, keep polling (max 20 × 5 s = 100 s)
        if (!res.interview?.ai_report && polls < 20) {
          timer = setTimeout(() => {
            if (!cancelled) setPolls((p) => p + 1);
          }, 5000);
        } else {
          setData(res.interview);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.response?.data?.message ?? "Failed to load report.");
          setLoading(false);
        }
      }
    }

    attempt();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [interviewId, polls]);

  const retry = () => { setLoading(true); setError(null); setPolls((p) => p + 1); };
  return { data, loading, error, retry };
}

// ── Main component ────────────────────────────────────────────────────────────

export default function InterviewReport() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { data: interview, loading, error, retry } = useReportPoller(id);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-slate-400">
        <FiRefreshCw size={36} className="animate-spin" />
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700">Generating AI analysis report…</p>
          <p className="mt-1 text-xs">Grok is reviewing the interview transcript. This usually takes 15–30 seconds.</p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-red-500">
        <FiAlertCircle size={32} />
        <p className="text-sm font-semibold">{error}</p>
        <Button variant="outline" size="sm" onClick={retry}>Retry</Button>
      </div>
    );
  }

  // ── No report yet (timeout) ────────────────────────────────────────────────
  if (!interview?.ai_report) {
    return (
      <div className="space-y-4">
        <BackBar id={id} navigate={navigate} interview={interview} />
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 py-16 text-amber-700">
          <FiClock size={32} />
          <p className="text-sm font-semibold">AI report is still being generated.</p>
          <Button variant="outline" size="sm" onClick={retry}>
            <FiRefreshCw size={13} className="mr-1" /> Check again
          </Button>
        </div>
        {/* Show transcript if available while waiting */}
        {interview?.transcripts?.length > 0 && (
          <TranscriptPanel transcripts={interview.transcripts} />
        )}
      </div>
    );
  }

  const report      = interview.ai_report;
  const transcripts = interview.transcripts ?? [];
  const applicant   = interview.applicant;
  const jobTitle    = interview.job_posting?.job_library?.job_title ?? "—";

  return (
    <div className="space-y-4">

      {/* ── Back bar ──────────────────────────────────────────────────── */}
      <BackBar id={id} navigate={navigate} interview={interview} />

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">
          AI Interview Analysis
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          {applicant ? `${applicant.first_name} ${applicant.last_name}` : "Interview Report"}
        </h1>
        <p className="text-sm text-slate-500">
          {jobTitle} · {interview.interview_stage?.replace("_", " ")} ·{" "}
          <span className="capitalize">{interview.status}</span>
        </p>
      </div>

      {/* ── Main grid ─────────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* ── Left: analysis panels (2/3) ─────────────────────────────── */}
        <div className="space-y-4 lg:col-span-2">

          {/* Score Summary */}
          <Card>
            <CardHeader><CardTitle>AI Score Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">

                {/* Circular ring */}
                <div className="flex flex-col items-center">
                  <div className="relative flex items-center justify-center">
                    <svg width={140} height={140} className="-rotate-90">
                      <circle cx={70} cy={70} r={57} fill="none" stroke="#e2e8f0" strokeWidth={10} />
                      <circle
                        cx={70} cy={70} r={57}
                        fill="none"
                        className={scoreColor(report.overall_score).ring}
                        strokeWidth={10}
                        strokeDasharray={2 * Math.PI * 57}
                        strokeDashoffset={2 * Math.PI * 57 * (1 - report.overall_score / 100)}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 0.8s ease" }}
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className={cn("text-4xl font-extrabold", scoreColor(report.overall_score).text)}>
                        {report.overall_score}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        / 100
                      </span>
                    </div>
                  </div>
                  <span className={cn(
                    "mt-2 rounded-full px-3 py-1 text-xs font-bold",
                    scoreColor(report.overall_score).bg
                  )}>
                    {report.overall_score >= 75 ? "Strong Candidate"
                      : report.overall_score >= 50 ? "Moderate Candidate"
                      : "Needs Improvement"}
                  </span>
                </div>

                {/* Dimension bars */}
                <div className="flex-1 space-y-3 w-full">
                  <DimensionBar label="Communication" score={report.communication_score} />
                  <DimensionBar label="Confidence"    score={report.confidence_score}    />
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                    Model: <span className="font-semibold text-slate-600">{report.model_used ?? "grok-4.5"}</span>
                    {report.generated_at && (
                      <> · Generated{" "}
                        {new Date(report.generated_at).toLocaleString("en-US", {
                          month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                        })}
                      </>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strengths & Weaknesses */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span> Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(report.strengths ?? []).length === 0 ? (
                  <p className="text-xs text-slate-400">No strengths identified.</p>
                ) : (
                  <ul className="space-y-2">
                    {report.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="mt-0.5 shrink-0 text-emerald-500 font-bold">✓</span>
                        <span className="text-slate-700">{s.point ?? s}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-red-500">!</span> Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(report.weaknesses ?? []).length === 0 ? (
                  <p className="text-xs text-slate-400">No weaknesses identified.</p>
                ) : (
                  <ul className="space-y-2">
                    {report.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="mt-0.5 shrink-0 text-red-500 font-bold">!</span>
                        <span className="text-slate-700">{w.point ?? w}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Hiring Recommendation */}
          <Card>
            <CardHeader><CardTitle>Hiring Recommendation</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm text-blue-900 leading-relaxed">
                {report.hiring_recommendation || "—"}
              </div>
              {report.raw_ai_response?.score_rationale && (
                <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600 leading-relaxed">
                  <span className="font-semibold text-slate-700">Score rationale: </span>
                  {report.raw_ai_response.score_rationale}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right: transcript panel (1/3) ───────────────────────────── */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <TranscriptPanel transcripts={transcripts} />
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function BackBar({ id, navigate, interview }) {
  return (
    <div className="flex items-center justify-between">
      <button
        onClick={() => navigate("/admin/interviews")}
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[var(--artms-primary)] transition"
      >
        <FiArrowLeft size={13} /> Back to Interviews
      </button>
      {interview?.status !== "done" && (
        <Link
          to={`/admin/interviews/${id}/room`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--artms-primary)] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 transition"
        >
          🎥 Join Room
        </Link>
      )}
    </div>
  );
}

function TranscriptPanel({ transcripts }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Full Transcript</CardTitle>
        <p className="text-xs text-slate-400">{transcripts.length} segment{transcripts.length !== 1 ? "s" : ""}</p>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="max-h-[600px] space-y-3 overflow-y-auto pr-1">
          {transcripts.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">
              No transcript available for this session.
            </p>
          ) : (
            transcripts.map((t) => (
              <div
                key={t.id}
                className={cn(
                  "flex flex-col gap-0.5 rounded-xl p-3",
                  t.speaker_role === "hr"
                    ? "bg-blue-50"
                    : t.speaker_role === "applicant"
                    ? "bg-slate-50"
                    : "bg-amber-50"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={cn(
                    "text-[11px] font-bold uppercase tracking-wider",
                    t.speaker_role === "hr"        ? "text-blue-600"
                    : t.speaker_role === "applicant" ? "text-slate-600"
                    : "text-amber-600"
                  )}>
                    {t.speaker_role === "hr" ? "👤 HR Interviewer"
                    : t.speaker_role === "applicant" ? "🧑 Applicant"
                    : "⚙ System"}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {fmtTime(t.segment_offset)}
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{t.text}</p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
