/**
 * EvaluationModal
 * ───────────────
 * Separate evaluation forms for Interview 1 and Interview 2 / Final.
 * Allows HR to:
 *   - Rate each rubric criterion individually (star rating per criterion)
 *   - Add overall evaluation notes
 *   - Set an overall rating_score (0–100, derived from rubric stars)
 *   - Set hr_decision: pass / fail / pending
 *
 * Props:
 *   open       bool
 *   onClose    fn
 *   onSaved    fn(updatedInterview)
 *   interview  object   the interview being evaluated
 */
import { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import StarRating from "./StarRating";
import interviewService from "../../services/interviewService";

// Rubric criteria per stage
const RUBRIC = {
  interview_1: [
    { key: "communication",  label: "Communication Skills" },
    { key: "attitude",       label: "Attitude & Professionalism" },
    { key: "experience",     label: "Relevant Experience" },
    { key: "problem_solving",label: "Problem Solving" },
  ],
  interview_2: [
    { key: "technical",      label: "Technical / Role Knowledge" },
    { key: "teamwork",       label: "Teamwork & Collaboration" },
    { key: "leadership",     label: "Leadership Potential" },
    { key: "cultural_fit",   label: "Cultural Fit" },
    { key: "initiative",     label: "Initiative & Drive" },
  ],
  final: [
    { key: "overall_fit",    label: "Overall Fit" },
    { key: "motivation",     label: "Motivation & Commitment" },
    { key: "communication",  label: "Communication Skills" },
    { key: "values",         label: "Values Alignment" },
  ],
};

const DECISION_OPTIONS = [
  { value: "pass",    label: "✅ Pass",    classes: "border-emerald-400 bg-emerald-50 text-emerald-700" },
  { value: "fail",    label: "❌ Fail",    classes: "border-red-400 bg-red-50 text-red-700"             },
  { value: "pending", label: "⏳ Pending", classes: "border-amber-400 bg-amber-50 text-amber-700"       },
];

const STAGE_LABELS = {
  interview_1: "Interview 1 Evaluation",
  interview_2: "Interview 2 Evaluation",
  final:       "Final Interview Evaluation",
};

function initRubric(stage, existing = {}) {
  const criteria = RUBRIC[stage] ?? RUBRIC.interview_1;
  return criteria.reduce((acc, c) => {
    acc[c.key] = existing[c.key] ?? 0;
    return acc;
  }, {});
}

/** Convert rubric star averages (each 0–5) into a 0–100 score */
function rubricToScore(scores) {
  const vals = Object.values(scores).filter((v) => v > 0);
  if (!vals.length) return 0;
  const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
  return Math.round((avg / 5) * 100);
}

export default function EvaluationModal({ open, onClose, onSaved, interview }) {
  const stage     = interview?.interview_stage ?? "interview_1";
  const criteria  = RUBRIC[stage] ?? RUBRIC.interview_1;

  const [rubric,  setRubric]  = useState({});
  const [notes,   setNotes]   = useState("");
  const [decision,setDecision]= useState("pending");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // Seed existing values when modal opens
  useEffect(() => {
    if (!open || !interview) return;
    setRubric(initRubric(stage, interview.rubric_scores ?? {}));
    setNotes(interview.evaluation_notes ?? "");
    setDecision(interview.hr_decision ?? "pending");
    setError(null);
  }, [open, interview]);

  const derivedScore = rubricToScore(rubric);

  function setStarForCriterion(key, val) {
    setRubric((r) => ({ ...r, [key]: val }));
  }

  async function handleSave() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await interviewService.update(interview.id, {
        rubric_scores:     rubric,
        evaluation_notes:  notes,
        rating_score:      derivedScore,
        hr_decision:       decision,
        status:            "done",
      });
      onSaved?.(data.interview);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message ?? "Failed to save evaluation.");
    } finally {
      setLoading(false);
    }
  }

  if (!interview) return null;

  const applicantName =
    interview.applicant
      ? `${interview.applicant.first_name} ${interview.applicant.last_name}`
      : "Applicant";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={STAGE_LABELS[stage] ?? "Evaluation"}
      description={`${applicantName} — ${interview.jobPosting?.jobLibrary?.title ?? ""}`}
      className="max-w-xl"
      footer={
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-500">
            Saving will mark this interview as <strong>Done</strong>.
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving…" : "Save Evaluation"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5 overflow-y-auto max-h-[65vh] pr-1">
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* ── Rubric Scores ───────────────────────────────────────── */}
        <div>
          <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">
            Rubric Scores
          </p>
          <div className="space-y-3">
            {criteria.map((c) => (
              <div key={c.key} className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-slate-700 flex-1">
                  {c.label}
                </span>
                <StarRating
                  value={rubric[c.key] ?? 0}
                  onChange={(val) => setStarForCriterion(c.key, val)}
                  size="md"
                  showLabel
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Derived Score ───────────────────────────────────────── */}
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <span className="text-sm font-bold text-slate-600">Overall Score</span>
          <div className="flex items-center gap-2">
            <span
              className={`text-2xl font-extrabold ${
                derivedScore >= 75
                  ? "text-emerald-600"
                  : derivedScore >= 50
                  ? "text-amber-600"
                  : "text-red-500"
              }`}
            >
              {derivedScore}
            </span>
            <span className="text-sm text-slate-400">/ 100</span>
          </div>
        </div>

        {/* ── Evaluation Notes ────────────────────────────────────── */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-800">
            Evaluation Notes
          </label>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add observations, strengths, concerns…"
            className="w-full rounded-lg border border-[var(--artms-border)] bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[color-mix(in_oklab,var(--artms-primary),#000_5%)] focus:ring-2 focus:ring-[var(--artms-ring)] resize-none"
          />
        </div>

        {/* ── HR Decision ─────────────────────────────────────────── */}
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-800">HR Decision</p>
          <div className="flex gap-2">
            {DECISION_OPTIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDecision(d.value)}
                className={`flex-1 rounded-xl border-2 py-2.5 text-xs font-bold transition ${
                  decision === d.value
                    ? d.classes
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
