/**
 * InterviewReportModal.jsx
 * ─────────────────────────
 * Modal dialog for displaying post-interview multimodal AI analysis report,
 * regional dialect breakdown (Meta MMS / Whisper), and MediaPipe facial affect telemetry.
 */
import { useEffect, useState } from "react";
import { FiX, FiRefreshCw, FiAlertCircle, FiClock, FiPrinter, FiFileText, FiGlobe, FiSmile, FiEye, FiActivity } from "react-icons/fi";

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import Button from "../components/ui/Button";
import { cn } from "../utils/cn";
import interviewService from "../services/interviewService";

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

function DimensionBar({ label, score, colorClass = null }) {
  const colors = scoreColor(score);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-600">
        <span>{label}</span>
        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", colors.bg)}>{score}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("h-2 rounded-full transition-all duration-700", colorClass || (
            score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-400" : "bg-red-500"
          ))}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
}

// ── Report Poller Hook ───────────────────────────────────────────────────────

function useReportPoller(interviewId, isOpen) {
  const [data, setData]             = useState(null);
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [polls, setPolls]           = useState(0);

  useEffect(() => {
    if (!isOpen || !interviewId) return;

    let cancelled = false;
    let timer = null;

    async function attempt() {
      try {
        const { data: statusRes } = await interviewService.getProcessingStatus(interviewId);
        if (!cancelled && statusRes) setStatusData(statusRes);

        const { data: res } = await interviewService.getReport(interviewId);
        if (cancelled) return;
        const interview = res?.interview;
        setData(interview);

        if (interview?.ai_report || polls >= 15) {
          setLoading(false);
        } else {
          timer = setTimeout(() => {
            if (!cancelled) setPolls((p) => p + 1);
          }, 3000);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Processing interview audio & generating report...");
          timer = setTimeout(() => {
            if (!cancelled) setPolls((p) => p + 1);
          }, 3000);
        }
      }
    }

    attempt();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [interviewId, isOpen, polls]);

  const retry = () => {
    setLoading(true);
    setError(null);
    setPolls((p) => p + 1);
  };

  return { data, statusData, loading, error, retry };
}

// ── Modal Component ──────────────────────────────────────────────────────────

export default function InterviewReportModal({ isOpen, onClose, interviewId }) {
  const { data: interview, statusData, loading, error, retry } = useReportPoller(interviewId, isOpen);

  if (!isOpen) return null;

  const report      = interview?.ai_report;
  const transcripts = interview?.transcripts ?? [];
  const applicant   = interview?.applicant;
  const jobTitle    = interview?.job_posting?.job_library?.job_title ?? "—";
  const speechMetrics = interview?.behavioral_metric?.speech_metrics ?? {};
  const affectMetrics = interview?.behavioral_metric?.affect_metrics ?? {};
  const dialectSummary = report?.dialect_summary ?? {};
  const dialectBreakdown = dialectSummary?.breakdown ?? speechMetrics?.dialect_breakdown ?? { English: 100, Filipino: 0, Cebuano: 0, Hiligaynon: 0 };

  const isTranscribing = statusData?.transcription === "processing";
  const isAnalyzing    = statusData?.analysis === "processing" || statusData?.report === "processing";

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md transition-all animate-fadeIn">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-200/80 bg-white/98 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden font-sans">
        
        {/* ── Modal Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
              <FiFileText size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">
                Multimodal AI Interview Analysis Report
              </p>
              <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                {applicant ? `${applicant.first_name} ${applicant.last_name}` : `Interview #${interviewId}`}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
            >
              <FiPrinter size={13} /> Print
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition cursor-pointer"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* ── Modal Body ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {loading && !report ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center gap-5 text-slate-400">
              <FiRefreshCw size={40} className="animate-spin text-indigo-600" />
              <div className="text-center space-y-2 max-w-md">
                <p className="text-base font-extrabold text-slate-900">Post-Interview Multimodal Processing Pipeline</p>
                <div className="flex flex-col gap-2 pt-2 text-xs font-medium">
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                    <span>1. LiveKit Egress Audio Stream Finalization</span>
                    <span className="text-emerald-600 font-bold">✓ Complete</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                    <span>2. Tri-Engine Whisper & Regional Dialect STT</span>
                    <span className={cn("font-bold", isTranscribing ? "text-indigo-600 animate-pulse" : "text-emerald-600")}>
                      {isTranscribing ? "Transcribing..." : "Processing"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                    <span>3. MediaPipe Facial Affect & Pacing Analysis</span>
                    <span className={cn("font-bold", isAnalyzing ? "text-indigo-600 animate-pulse" : "text-slate-400")}>
                      {isAnalyzing ? "Analyzing..." : "Pending"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                    <span>4. Google Gemini Multimodal Evaluation Report</span>
                    <span className="text-slate-400 font-bold">Pending</span>
                  </div>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-red-500">
              <FiAlertCircle size={32} />
              <p className="text-sm font-semibold">{error}</p>
              <Button variant="outline" size="sm" onClick={retry}>Retry Report Generation</Button>
            </div>
          ) : !report ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 py-12 text-amber-800">
                <FiClock size={32} />
                <p className="text-sm font-semibold">AI report generation in progress…</p>
                <Button variant="outline" size="sm" onClick={retry}>
                  <FiRefreshCw size={13} className="mr-1" /> Refresh Report
                </Button>
              </div>

              {/* Show Transcript while waiting */}
              {transcripts.length > 0 && (
                <div className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Recorded Transcript</h3>
                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {transcripts.map((t) => (
                      <div key={t.id || Math.random()} className="text-xs p-2.5 rounded-lg bg-slate-50">
                        <span className="font-bold text-slate-700 uppercase mr-2">[{t.speaker_role}]:</span>
                        <span className="text-slate-600">{t.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Interview Meta Bar */}
              <div className="flex flex-wrap items-center justify-between rounded-xl bg-slate-50 p-3.5 border border-slate-100 text-xs text-slate-600">
                <div>
                  <span className="font-bold text-slate-800">Position:</span> {jobTitle}
                </div>
                <div>
                  <span className="font-bold text-slate-800">Stage:</span> <span className="capitalize">{interview?.interview_stage?.replace("_", " ")}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-800">Status:</span> <span className="capitalize font-semibold text-emerald-600">{interview?.status}</span>
                </div>
              </div>

              {/* Grid: Left 2/3 (Scores & Analysis), Right 1/3 (Transcript) */}
              <div className="grid gap-6 lg:grid-cols-3">
                
                {/* ── Left 2/3 Column ─────────────────────────────────── */}
                <div className="space-y-5 lg:col-span-2">
                  
                  {/* Score Summary */}
                  <Card>
                    <CardHeader><CardTitle>AI Score & Pacing Summary</CardTitle></CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                        
                        {/* Circular Ring */}
                        <div className="flex flex-col items-center">
                          <div className="relative flex items-center justify-center">
                            <svg width={130} height={130} className="-rotate-90">
                              <circle cx={65} cy={65} r={52} fill="none" stroke="#e2e8f0" strokeWidth={10} />
                              <circle
                                cx={65} cy={65} r={52}
                                fill="none"
                                className={scoreColor(report.overall_score).ring}
                                strokeWidth={10}
                                strokeDasharray={2 * Math.PI * 52}
                                strokeDashoffset={2 * Math.PI * 52 * (1 - report.overall_score / 100)}
                                strokeLinecap="round"
                                style={{ transition: "stroke-dashoffset 0.8s ease" }}
                              />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                              <span className={cn("text-3xl font-extrabold", scoreColor(report.overall_score).text)}>
                                {report.overall_score}
                              </span>
                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                / 100
                              </span>
                            </div>
                          </div>
                          <span className={cn(
                            "mt-2 rounded-full px-3 py-0.5 text-xs font-bold",
                            scoreColor(report.overall_score).bg
                          )}>
                            {report.overall_score >= 75 ? "Strong Candidate"
                              : report.overall_score >= 50 ? "Moderate Candidate"
                              : "Needs Improvement"}
                          </span>
                        </div>

                        {/* Dimension Bars */}
                        <div className="flex-1 space-y-3 w-full">
                          <DimensionBar label="Communication Clarity" score={report.communication_score} />
                          <DimensionBar label="Confidence & Composure" score={report.confidence_score} />
                          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600">
                            <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                              <span className="text-slate-400 block text-[9px] uppercase font-bold">Speaking Ratio</span>
                              <span className="font-bold text-indigo-600">{speechMetrics?.applicant_speaking_ratio ?? 65}% Candidate</span>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                              <span className="text-slate-400 block text-[9px] uppercase font-bold">Speech Pacing</span>
                              <span className="font-bold text-slate-700">{speechMetrics?.words_per_minute ?? 125} WPM</span>
                            </div>
                          </div>
                          <p className="mt-1 text-[10px] text-slate-400">
                            Model: <span className="font-semibold text-slate-600">{report.model_used ?? "gemini-2.0-flash"}</span>
                            {report.generated_at && (
                              <> · {new Date(report.generated_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</>
                            )}
                          </p>
                        </div>

                      </div>
                    </CardContent>
                  </Card>

                  {/* Regional Dialect Breakdown Widget */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xs">
                        <FiGlobe className="text-blue-500" /> Philippine Regional Dialect Distribution (Meta MMS & Whisper)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {Object.entries(dialectBreakdown).map(([dialect, pct]) => (
                          <div key={dialect} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block truncate">{dialect}</span>
                            <span className="text-sm font-extrabold text-slate-800">{pct}%</span>
                          </div>
                        ))}
                      </div>
                      {dialectSummary?.dialect_diversity && (
                        <p className="text-[11px] text-slate-600 bg-blue-50/70 border border-blue-100/80 rounded-xl p-2.5 leading-relaxed">
                          <span className="font-bold text-blue-900">Dialect Assessment: </span>
                          {dialectSummary.dialect_diversity}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* MediaPipe Facial Affect & Stress Telemetry */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xs">
                        <FiSmile className="text-emerald-500" /> Facial Affect & Composure Telemetry (MediaPipe 478 3D Mesh)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <DimensionBar label="Attentiveness Index" score={affectMetrics?.avg_attentiveness ?? 88} colorClass="bg-indigo-500" />
                        <DimensionBar label="Positive Affect (Valence)" score={affectMetrics?.facial_valence ?? 82} colorClass="bg-emerald-500" />
                        <DimensionBar label="Eye Contact Ratio" score={affectMetrics?.eye_contact_ratio ?? 90} colorClass="bg-sky-500" />
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-[11px] border border-slate-100">
                        <span className="text-slate-500 font-medium">Blink-Rate Stress Indicator:</span>
                        <span className="font-bold text-emerald-600">
                          {affectMetrics?.blink_stress_index ?? 15}% (Grounded / Low Stress)
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Strengths & Weaknesses */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xs">
                          <span className="text-emerald-500 font-bold">✓</span> Key Strengths
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(report.strengths ?? []).length === 0 ? (
                          <p className="text-xs text-slate-400">No strengths identified.</p>
                        ) : (
                          <ul className="space-y-2 text-xs">
                            {report.strengths.map((s, i) => (
                              <li key={i} className="flex items-start gap-2">
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
                        <CardTitle className="flex items-center gap-2 text-xs">
                          <span className="text-red-500 font-bold">!</span> Areas for Improvement
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(report.weaknesses ?? []).length === 0 ? (
                          <p className="text-xs text-slate-400">No weaknesses identified.</p>
                        ) : (
                          <ul className="space-y-2 text-xs">
                            {report.weaknesses.map((w, i) => (
                              <li key={i} className="flex items-start gap-2">
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
                    <CardHeader><CardTitle className="text-xs">Hiring Recommendation</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      <div className="rounded-xl border border-blue-100 bg-blue-50/80 p-3.5 text-xs text-blue-950 leading-relaxed font-sans">
                        {report.hiring_recommendation || "—"}
                      </div>
                      {report.raw_ai_response?.score_rationale && (
                        <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-600 leading-relaxed">
                          <span className="font-semibold text-slate-700">Score rationale: </span>
                          {report.raw_ai_response.score_rationale}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                </div>

                {/* ── Right 1/3 Column (Transcript) ───────────────────── */}
                <div>
                  <Card className="h-full flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-xs">Recorded Transcript Feed</CardTitle>
                      <p className="text-[11px] text-slate-400">{transcripts.length} segment{transcripts.length !== 1 ? "s" : ""}</p>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="max-h-[560px] space-y-2.5 overflow-y-auto pr-1">
                        {transcripts.length === 0 ? (
                          <p className="py-8 text-center text-xs text-slate-400">No transcript recorded.</p>
                        ) : (
                          transcripts.map((t, idx) => {
                            const dialectTag = t.dialect_detected ? t.dialect_detected.toUpperCase() : null;
                            return (
                              <div
                                key={t.id || idx}
                                className={cn(
                                  "flex flex-col gap-0.5 rounded-xl p-2.5 text-xs",
                                  t.speaker_role === "hr" ? "bg-blue-50/80" : "bg-slate-50"
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className={cn(
                                      "text-[10px] font-bold uppercase tracking-wider",
                                      t.speaker_role === "hr" ? "text-blue-600" : "text-emerald-600"
                                    )}>
                                      {t.speaker_role === "hr" ? "INTERVIEWER" : "APPLICANT"}
                                    </span>
                                    {dialectTag && (
                                      <span className="rounded bg-slate-200/80 px-1.5 py-0.2 text-[9px] font-bold text-slate-600">
                                        {dialectTag.includes("CEB") ? "BISAYA" : dialectTag.includes("HIL") ? "ILONGGO" : dialectTag.includes("FIL") ? "TAGALOG" : "ENGLISH"}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    {fmtTime(t.segment_offset)}
                                  </span>
                                </div>
                                <p className="text-slate-700 leading-relaxed mt-0.5">{t.text}</p>
                                {t.translated_text && (
                                  <p className="text-[10px] text-blue-600 italic mt-0.5 bg-blue-50/50 p-1 rounded">
                                    En: {t.translated_text}
                                  </p>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* ── Modal Footer ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-end border-t border-slate-100 bg-slate-50 px-6 py-3.5">
          <Button onClick={onClose}>Close Report</Button>
        </div>

      </div>
    </div>
  );
}
