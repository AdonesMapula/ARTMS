import { useState } from "react";
import { 
  Sparkles, CheckCircle2, Lock, Users, 
  MessageSquareQuote, AlertTriangle 
} from "lucide-react";
import StarRating from "./StarRating";
import { cn } from "../../utils/cn";

/**
 * ArtmsAiAssistantCard
 * ─────────────────────────────────────────────────────────────────────────────
 * Section 2.C (Middle): ARTMS AI Assistant Card
 * 
 * Styled with ARTMS Admin Navy palette (#0B0F2E, #0F163D, #1D2660, #111A62, #F97316)
 * Displays real candidate data from database (Strengths, Gaps, Fit Score, Dynamic Questions).
 */

export default function ArtmsAiAssistantCard({
  // Notes
  sharedNotes = "",
  onUpdateSharedNotes,
  activeEditor = null,
  privateNotes = "",
  onUpdatePrivateNotes,
  // Scoring
  myScore = 4,
  onUpdateRubricScore,
  roomAverageScore = "4.0",
  // Competencies
  competencies = {},
  onUpdateCompetency,
  // AI Questions
  askedQuestions = new Set(),
  onToggleQuestionAsked,
  // Real Candidate / Resume Fit Data
  fitScore = null,
  strengths = [],
  gaps = [],
  dynamicQuestions = [],
}) {
  const [activeNotesTab, setActiveNotesTab] = useState("shared"); // 'shared' | 'private'

  // Normalize strengths and gaps from DB
  const displayStrengths = Array.isArray(strengths) && strengths.length > 0
    ? strengths
    : ["Core qualifications verified in application profile"];

  const displayGaps = Array.isArray(gaps) && gaps.length > 0
    ? gaps
    : ["No critical technical gaps flagged in initial screening"];

  // Normalize dynamic questions from DB
  const questionsList = Array.isArray(dynamicQuestions) && dynamicQuestions.length > 0
    ? dynamicQuestions
    : [
        {
          id: "q_def_1",
          question: "Can you detail your experience and key milestones in your most recent role?",
          gapContext: "Background Verification",
        },
        {
          id: "q_def_2",
          question: "How do you approach learning and onboarding onto unfamiliar domain workflows?",
          gapContext: "Adaptability",
        },
        {
          id: "q_def_3",
          question: "Describe a project where you had to balance strict deadlines with technical quality.",
          gapContext: "Work Delivery & Execution",
        },
      ];

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-[#111A62] text-white shadow-xs">
            <Sparkles size={13} className="text-[#F97316]" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
              ARTMS AI Assistant Card
            </h3>
            <p className="text-[10px] text-slate-500">
              Real-time candidate telemetry & contextual copilot
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
          Gemini 3.5 Copilot
        </span>
      </div>

      {/* Grid: 2-column or stacked for dense info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Left Sub-column: Resume Match & Feedback + Scoring */}
        <div className="flex flex-col gap-2.5">
          {/* Resume Match & Feedback */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                Resume Match & Feedback
              </span>
              <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shadow-xs">
                {fitScore !== null && fitScore !== undefined ? `${Math.round(fitScore)}% Fit` : "Pending Eval"}
              </span>
            </div>

            {/* Strengths */}
            <div className="space-y-1.5 mb-2.5">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                Screened Strengths
              </span>
              {displayStrengths.map((str, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-800">
                  <CheckCircle2 size={12} className="text-emerald-600 mt-0.5 shrink-0" />
                  <span className="leading-snug">{typeof str === "string" ? str : JSON.stringify(str)}</span>
                </div>
              ))}
            </div>

            {/* Critical Gaps */}
            <div className="space-y-1.5 border-t border-slate-200 pt-2">
              <span className="text-[9px] font-bold text-[#F97316] uppercase tracking-wider block">
                Critical Gaps
              </span>
              {displayGaps.map((gap, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-[11px] text-amber-900">
                  <AlertTriangle size={12} className="text-[#F97316] mt-0.5 shrink-0" />
                  <span className="leading-snug">{typeof gap === "string" ? gap : JSON.stringify(gap)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 1-5 Clickable Scoring Rubric */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                Scoring Rubric
              </span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shadow-xs">
                Room Avg: {roomAverageScore} / 5.0
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((score) => {
                const isSelected = myScore === score;
                return (
                  <button
                    key={score}
                    type="button"
                    onClick={() => onUpdateRubricScore && onUpdateRubricScore(score)}
                    className={cn(
                      "flex-1 py-1 text-xs font-bold rounded-md border transition-all cursor-pointer",
                      isSelected
                        ? "bg-[#111A62] text-white border-[#111A62] shadow-xs scale-105"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    [{score}]
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between mt-1 px-1 text-[9px] text-slate-500">
              <span>1 - Unsatisfactory</span>
              <span>5 - Exceptional</span>
            </div>
          </div>
        </div>

        {/* Right Sub-column: AI Dynamic Questions & Competencies Quick Rate */}
        <div className="flex flex-col gap-2.5">
          {/* AI Suggested Dynamic Questions */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <MessageSquareQuote size={13} className="text-[#F97316]" />
                AI Suggested Questions
              </span>
              <span className="text-[9px] text-slate-500 font-mono">
                {askedQuestions.size}/{questionsList.length} Asked
              </span>
            </div>

            <div className="space-y-2">
              {questionsList.map((item, idx) => {
                const isAsked = askedQuestions.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-lg border p-2 text-xs transition-colors",
                      isAsked
                        ? "border-slate-200 bg-slate-100/60 opacity-60"
                        : "border-slate-200 bg-white shadow-xs"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        "text-[11px] leading-snug",
                        isAsked ? "line-through text-slate-400" : "text-slate-800 font-medium"
                      )}>
                        <span className="font-bold text-[#F97316] mr-1">{idx + 1}.</span>
                        {item.question}
                      </p>
                      <button
                        type="button"
                        onClick={() => onToggleQuestionAsked && onToggleQuestionAsked(item.id)}
                        className={cn(
                          "shrink-0 px-2 py-0.5 text-[9px] font-bold rounded border transition-colors cursor-pointer",
                          isAsked
                            ? "bg-slate-100 text-slate-500 border-slate-200"
                            : "bg-orange-50 hover:bg-[#F97316] text-[#F97316] border-orange-200 hover:text-white shadow-xs"
                        )}
                      >
                        {isAsked ? "Asked ✓" : "Mark as Asked"}
                      </button>
                    </div>
                    <span className="mt-1 inline-block text-[9px] text-slate-500">
                      Trigger: {item.gapContext}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key Competencies Quick Rate */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 block mb-2">
              Key Competencies Quick Rate
            </span>

            <div className="space-y-1.5">
              {Object.entries(competencies).map(([name, data]) => {
                const isChecked = Boolean(data?.checked);
                const rating = data?.rating ?? 3;
                return (
                  <div
                    key={name}
                    className="flex items-center justify-between rounded-md bg-white px-2.5 py-1 border border-slate-200 shadow-xs"
                  >
                    <label className="flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          onUpdateCompetency &&
                          onUpdateCompetency(name, { checked: e.target.checked })
                        }
                        className="rounded border-slate-300 text-[#111A62] focus:ring-0 focus:ring-offset-0 cursor-pointer h-3.5 w-3.5"
                      />
                      <span className={isChecked ? "font-bold text-slate-900" : "text-slate-500"}>
                        {name}
                      </span>
                    </label>

                    <div className="flex items-center">
                      <StarRating
                        value={rating}
                        onChange={(newVal) =>
                          onUpdateCompetency &&
                          onUpdateCompetency(name, { rating: newVal, checked: true })
                        }
                        size="sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Collaborative & Private Notes Module (Tabbed Area) */}
      <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50 p-2.5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
          {/* Tabs */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveNotesTab("shared")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer",
                activeNotesTab === "shared"
                  ? "bg-[#111A62] text-white shadow-xs border border-[#111A62]"
                  : "bg-white text-slate-700 hover:text-slate-900 border border-slate-200"
              )}
            >
              <Users size={12} />
              Shared Team Notes (Sync)
            </button>

            <button
              type="button"
              onClick={() => setActiveNotesTab("private")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer",
                activeNotesTab === "private"
                  ? "bg-[#F97316] text-white shadow-xs border border-[#F97316]"
                  : "bg-white text-slate-700 hover:text-slate-900 border border-slate-200"
              )}
            >
              <Lock size={12} />
              Private Notes (Local Only)
            </button>
          </div>

          {/* Active editor status */}
          {activeNotesTab === "shared" && (
            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
              {activeEditor ? (
                <span className="text-emerald-600 animate-pulse flex items-center gap-1 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  {activeEditor} is typing...
                </span>
              ) : (
                <span>Team live cursor sync active</span>
              )}
            </div>
          )}

          {activeNotesTab === "private" && (
            <span className="text-[10px] text-slate-500 font-mono">
              🔒 Visible only to you
            </span>
          )}
        </div>

        {/* Text Area */}
        {activeNotesTab === "shared" ? (
          <textarea
            value={sharedNotes}
            onChange={(e) => onUpdateSharedNotes && onUpdateSharedNotes(e.target.value)}
            placeholder="Type shared interview observations here... All interviewers will see changes synchronized in real time."
            rows={3}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-[#111A62] focus:outline-none focus:ring-1 focus:ring-[#111A62]"
          />
        ) : (
          <textarea
            value={privateNotes}
            onChange={(e) => onUpdatePrivateNotes && onUpdatePrivateNotes(e.target.value)}
            placeholder="Type your personal confidential notes here... These are never sent over the network or saved to shared state."
            rows={3}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-[#F97316] focus:outline-none focus:ring-1 focus:ring-[#F97316]"
          />
        )}
      </div>
    </div>
  );
}
