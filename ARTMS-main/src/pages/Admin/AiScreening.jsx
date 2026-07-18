import { useCallback, useEffect, useRef, useState } from "react";
import {
  FiAlertCircle, FiCheckCircle, FiCpu, FiEye,
  FiLoader, FiRefreshCw, FiSearch, FiXCircle,
} from "react-icons/fi";
import aiService from "../../services/aiService";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import StatusChip from "../../components/ui/StatusChip";
import { Table, TD, TH, THead } from "../../components/ui/Table";

// ── constants ─────────────────────────────────────────────────────────────────
const FIT_TONE  = { high: "success", medium: "warning", low: "danger" };
const FIT_LABEL = { high: "High",    medium: "Medium",  low: "Low"    };

const BREAKDOWN_FIELDS = [
  { key: "education",  label: "Education",   max: 25, remarkKey: "education_remarks"  },
  { key: "experience", label: "Experience",  max: 35, remarkKey: "experience_remarks" },
  { key: "skills",     label: "Skills",      max: 30, remarkKey: "skills_remarks"     },
  { key: "other",      label: "Other / Lic", max: 10, remarkKey: null                 },
];

// ── helpers ───────────────────────────────────────────────────────────────────
function scoreColor(pct) {
  if (pct >= 75) return "bg-emerald-500";
  if (pct >= 50) return "bg-amber-400";
  return "bg-red-400";
}

function fitRingColor(label) {
  if (label === "high")   return "border-emerald-300 text-emerald-600";
  if (label === "medium") return "border-amber-300  text-amber-600";
  return "border-red-300 text-red-600";
}

// ── main component ────────────────────────────────────────────────────────────
export default function AiScreening() {
  const [rows,         setRows]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [selected,     setSelected]     = useState(null);   // applicant id
  const [screening,    setScreening]    = useState(null);   // applicant id being screened
  const [screenError,  setScreenError]  = useState(null);
  const [search,       setSearch]       = useState("");
  const [filterFit,    setFilterFit]    = useState("");
  const [hrForm,       setHrForm]       = useState({ interpretation: "", decision: "" });
  const [savingHr,     setSavingHr]     = useState(false);
  const [hrSaved,      setHrSaved]      = useState(false);
  const searchTimer                     = useRef(null);

  // ── fetch evaluated applicants ──────────────────────────────────────────────
  const load = useCallback(async (q = search, fit = filterFit) => {
    setLoading(true);
    setError(null);
    try {
      const params = { per_page: 50 };
      if (q)   params.search    = q;
      if (fit) params.fit_label = fit;
      const res = await aiService.evaluations(params);
      setRows(res.data?.data ?? []);
    } catch {
      setError("Failed to load screening data.");
    } finally {
      setLoading(false);
    }
  }, [search, filterFit]);

  useEffect(() => { load(); }, []);  // eslint-disable-line

  // ── search debounce ─────────────────────────────────────────────────────────
  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(val, filterFit), 400);
  };

  const handleFilter = (val) => {
    setFilterFit(val);
    load(search, val);
  };

  // ── run AI screening for one applicant ──────────────────────────────────────
  const runScreening = async (applicantId) => {
    setScreening(applicantId);
    setScreenError(null);
    try {
      await aiService.screen(applicantId);
      await load();                      // refresh list
      setSelected(applicantId);          // auto-open the result
    } catch (err) {
      setScreenError(
        err.response?.data?.message ?? "Screening failed. Check OpenAI key."
      );
    } finally {
      setScreening(null);
    }
  };

  // ── HR review save ──────────────────────────────────────────────────────────
  const saveHrReview = async () => {
    if (!active || !hrForm.decision) return;
    setSavingHr(true);
    try {
      await aiService.hrReview(active.id, {
        hr_interpretation: hrForm.interpretation,
        hr_decision:       hrForm.decision,
      });
      setHrSaved(true);
      setTimeout(() => setHrSaved(false), 2500);
      await load();
    } catch {
      // silent — user can retry
    } finally {
      setSavingHr(false);
    }
  };

  // ── derived state ───────────────────────────────────────────────────────────
  const active = selected ? rows.find(r => r.id === selected) : null;
  const eval_  = active?.ai_evaluation ?? null;

  // pre-fill HR form when selection changes
  useEffect(() => {
    if (eval_) {
      setHrForm({
        interpretation: eval_.hr_interpretation ?? "",
        decision:       eval_.hr_decision       ?? "",
      });
    }
  }, [selected]); // eslint-disable-line

  // ── summary counts ──────────────────────────────────────────────────────────
  const total  = rows.length;
  const high   = rows.filter(r => r.ai_evaluation?.fit_label === "high").length;
  const medium = rows.filter(r => r.ai_evaluation?.fit_label === "medium").length;
  const low    = rows.filter(r => r.ai_evaluation?.fit_label === "low").length;

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Page heading */}
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--artms-accent)]">AI Screening</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          AI Resume Screening
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Parse uploaded resumes and score them against job requirements automatically.
        </p>
      </div>

      {/* Error banner */}
      {screenError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          <FiAlertCircle size={16} className="shrink-0" />
          {screenError}
          <button onClick={() => setScreenError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <FiXCircle size={15} />
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        <SummaryCard label="Total Screened" value={total}  bg="bg-blue-50"    text="text-blue-700"    />
        <SummaryCard label="High Fit"        value={high}   bg="bg-emerald-50" text="text-emerald-700" />
        <SummaryCard label="Medium Fit"      value={medium} bg="bg-amber-50"   text="text-amber-700"   />
        <SummaryCard label="Low Fit"         value={low}    bg="bg-red-50"     text="text-red-700"     />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">

        {/* ── Left: screening queue table ─────────────────────────────────── */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Screening Queue</CardTitle>
              <div className="flex gap-2">
                {/* Search */}
                <div className="relative">
                  <FiSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={e => handleSearch(e.target.value)}
                    placeholder="Search applicant…"
                    className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#111A62]/20"
                  />
                </div>
                {/* Fit filter */}
                <select
                  value={filterFit}
                  onChange={e => handleFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#111A62]/20"
                >
                  <option value="">All Fits</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                {/* Refresh */}
                <button
                  onClick={() => load()}
                  title="Refresh"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition"
                >
                  <FiRefreshCw size={13} className={loading ? "animate-spin" : ""} />
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
                <FiLoader size={20} className="animate-spin" />
                <span className="text-sm">Loading…</span>
              </div>
            ) : error ? (
              <div className="py-10 text-center text-sm text-red-500">{error}</div>
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
                <FiCpu size={32} />
                <p className="text-sm">No screened applicants yet.</p>
                <p className="text-xs text-slate-400">
                  Go to the Applicants page, open an applicant with a resume, and click "Run AI Screening".
                </p>
              </div>
            ) : (
              <Table>
                <THead>
                  <tr>
                    <TH>Applicant</TH>
                    <TH>Position</TH>
                    <TH>Score</TH>
                    <TH>Fit</TH>
                    <TH>HR Decision</TH>
                    <TH className="text-right">Action</TH>
                  </tr>
                </THead>
                <tbody>
                  {rows.map(row => {
                    const ev     = row.ai_evaluation;
                    const score  = ev?.ai_score   ?? null;
                    const fit    = ev?.fit_label   ?? null;
                    const hrDec  = ev?.hr_decision ?? "pending";
                    const isRunning = screening === row.id;

                    return (
                      <tr
                        key={row.id}
                        onClick={() => setSelected(row.id === selected ? null : row.id)}
                        className={`cursor-pointer transition hover:bg-slate-50 ${selected === row.id ? "bg-[#111A62]/5" : ""}`}
                      >
                        <TD>
                          <p className="font-semibold text-slate-900">
                            {row.first_name} {row.last_name}
                          </p>
                          <p className="text-xs text-slate-400">{row.application_id}</p>
                        </TD>
                        <TD className="max-w-[140px] truncate text-xs text-slate-500">
                          {row.job_posting?.job_library?.job_title ?? "—"}
                        </TD>
                        <TD>
                          {score !== null ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{Math.round(score)}</span>
                              <span className="text-[11px] text-slate-400">/100</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </TD>
                        <TD>
                          {fit ? (
                            <Badge tone={FIT_TONE[fit]}>{FIT_LABEL[fit]} Fit</Badge>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </TD>
                        <TD>
                          <HrDecisionBadge decision={hrDec} />
                        </TD>
                        <TD className="text-right">
                          <button
                            onClick={e => { e.stopPropagation(); runScreening(row.id); }}
                            disabled={isRunning || !!screening}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Re-run AI Screening"
                          >
                            {isRunning
                              ? <FiLoader size={12} className="animate-spin" />
                              : <FiCpu size={12} />
                            }
                            {isRunning ? "Running…" : "Screen"}
                          </button>
                        </TD>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* ── Right: detail panel ─────────────────────────────────────────── */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>
              {active ? `${active.first_name} ${active.last_name}` : "Select an applicant"}
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto">
            {!active ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-400">
                <FiCpu size={32} />
                <p className="text-center text-sm">
                  Click any row to see the AI score breakdown and submit an HR decision.
                </p>
              </div>
            ) : !eval_ ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-400">
                <FiAlertCircle size={28} />
                <p className="text-center text-sm">No evaluation yet.</p>
                <button
                  onClick={() => runScreening(active.id)}
                  disabled={!!screening}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#111A62] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#1a277a] disabled:opacity-50"
                >
                  {screening === active.id
                    ? <><FiLoader size={13} className="animate-spin" /> Screening…</>
                    : <><FiCpu size={13} /> Run AI Screening</>
                  }
                </button>
              </div>
            ) : (
              <div className="space-y-5">

                {/* Score ring + fit badge */}
                <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                  <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 bg-white text-xl font-extrabold ${fitRingColor(eval_.fit_label)}`}>
                    {Math.round(eval_.ai_score ?? 0)}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">AI Score</p>
                    <Badge tone={FIT_TONE[eval_.fit_label] ?? "default"}>
                      {FIT_LABEL[eval_.fit_label] ?? "—"} Fit
                    </Badge>
                    <p className="text-xs text-slate-500">
                      Confidence: <strong>{Math.round(eval_.confidence_level ?? 0)}%</strong>
                      &nbsp;·&nbsp;
                      Match: <strong>{Math.round(eval_.qualification_match ?? 0)}%</strong>
                    </p>
                  </div>
                </div>

                {/* Score breakdown bars */}
                <div className="space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Score Breakdown</p>
                  {BREAKDOWN_FIELDS.map(({ key, label, max, remarkKey }) => {
                    const raw = eval_.score_breakdown?.[key] ?? 0;
                    const pct = Math.min(100, (raw / max) * 100);
                    const remark = remarkKey ? eval_.score_breakdown?.[remarkKey] : null;
                    return (
                      <div key={key}>
                        <div className="mb-1 flex justify-between text-xs font-semibold text-slate-600">
                          <span>{label}</span>
                          <span>{raw}<span className="font-normal text-slate-400">/{max}</span></span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${scoreColor(pct)}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {remark && (
                          <p className="mt-0.5 text-[11px] text-slate-400 leading-snug">{remark}</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Skills matched / missing */}
                {((eval_.skills_matched?.length ?? 0) > 0 || (eval_.skills_missing?.length ?? 0) > 0) && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Skills</p>
                    {eval_.skills_matched?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {eval_.skills_matched.map(s => (
                          <span key={s} className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            ✓ {s}
                          </span>
                        ))}
                      </div>
                    )}
                    {eval_.skills_missing?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {eval_.skills_missing.map(s => (
                          <span key={s} className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                            ✗ {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* AI summary */}
                {eval_.ai_summary && (
                  <div className="rounded-xl bg-blue-50/60 p-3">
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-blue-400">AI Summary</p>
                    <p className="text-xs leading-relaxed text-slate-600">{eval_.ai_summary}</p>
                  </div>
                )}

                {/* AI feedback for applicant */}
                {eval_.ai_feedback && (
                  <div className="rounded-xl bg-amber-50/60 p-3">
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-amber-500">Feedback for Applicant</p>
                    <p className="text-xs leading-relaxed text-slate-600">{eval_.ai_feedback}</p>
                  </div>
                )}

                {/* HR review form */}
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">HR Decision</p>

                  <textarea
                    rows={3}
                    value={hrForm.interpretation}
                    onChange={e => setHrForm(f => ({ ...f, interpretation: e.target.value }))}
                    placeholder="Add your HR interpretation or notes…"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#111A62]/20 resize-none"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => setHrForm(f => ({ ...f, decision: "qualified" }))}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition ${
                        hrForm.decision === "qualified"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-emerald-50/50"
                      }`}
                    >
                      <FiCheckCircle size={13} /> Qualified
                    </button>
                    <button
                      onClick={() => setHrForm(f => ({ ...f, decision: "not_qualified" }))}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition ${
                        hrForm.decision === "not_qualified"
                          ? "border-red-300 bg-red-50 text-red-600"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-red-50/50"
                      }`}
                    >
                      <FiXCircle size={13} /> Not Qualified
                    </button>
                  </div>

                  <button
                    onClick={saveHrReview}
                    disabled={savingHr || !hrForm.decision}
                    className="w-full rounded-xl bg-[#111A62] py-2.5 text-xs font-semibold text-white transition hover:bg-[#1a277a] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingHr ? "Saving…" : hrSaved ? "✓ Saved!" : "Save HR Review"}
                  </button>
                </div>

                {/* Re-run button */}
                <button
                  onClick={() => runScreening(active.id)}
                  disabled={!!screening}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  {screening === active.id
                    ? <><FiLoader size={12} className="animate-spin" /> Re-running…</>
                    : <><FiRefreshCw size={12} /> Re-run Screening</>
                  }
                </button>

              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

// ── sub-components ────────────────────────────────────────────────────────────

function SummaryCard({ label, value, bg, text }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 pt-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <span className={`rounded-xl px-3 py-1 text-lg font-extrabold ${bg} ${text}`}>{value}</span>
      </CardContent>
    </Card>
  );
}

function HrDecisionBadge({ decision }) {
  if (decision === "qualified")
    return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"><FiCheckCircle size={11} /> Qualified</span>;
  if (decision === "not_qualified")
    return <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600"><FiXCircle size={11} /> Not Qualified</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">Pending</span>;
}
