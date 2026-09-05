import { useState, useRef, useEffect } from "react";
import { 
  Search, Mic, MicOff, Video, VideoOff, PhoneOff, 
  FileDown, CheckSquare, Square, Volume2, Sparkles, AlertCircle, Trash2 
} from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * LiveTranscriptionBar
 * ─────────────────────────────────────────────────────────────────────────────
 * Section 2.D: Bottom Full-Width Bar: Live Transcription & HR Actions
 * 
 * Features:
 * - Left/Center: Live Transcription Stream (Gemini 3.5 Transcribe schema)
 *   - Auto-scrolling transcript entries with timestamps and speaker tags
 *   - Real-time keyword filter input
 * - Right Area: Post-Interview Workflow Checklist
 *   - Synchronized HR action item checkboxes
 * - Call Controls Bar:
 *   - Mute Audio, Video Off, End Call
 *   - Export Transcript / AI Summary
 */

export default function LiveTranscriptionBar({
  transcriptEntries = [],
  onClearTranscripts = null,
  isRecordingSpeech = true,
  checklist = {
    scheduleNextRound: false,
    sendCodeTest: false,
    recommendOffer: false,
  },
  onUpdateChecklist,
  // A/V controls
  isMuted = false,
  onToggleMute,
  isVideoOff = false,
  onToggleVideo,
  onEndCall,
  onExportSummary,
  isExporting = false,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef(null);

  // Auto-scroll when new transcript entries arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptEntries]);

  // Filter transcript by keyword
  const filteredEntries = transcriptEntries.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.speaker?.toLowerCase().includes(q) ||
      item.text?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col">
      {/* Top Split: Live Transcription (Left/Center) + Post-Interview Checklist (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-b border-slate-200 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        
        {/* Left/Center: Live Transcription Stream (col-span-8 or 9) */}
        <div className="lg:col-span-8 flex flex-col h-44">
          {/* Header & Filter */}
          <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
                Live Transcription Stream
              </span>
              <span className="rounded-md bg-blue-50 px-2 py-0.5 font-mono text-[9px] text-blue-700 border border-blue-200 flex items-center gap-1 shadow-xs">
                <Sparkles size={10} className="text-[#F97316]" /> Gemini 3.5 Transcribe
              </span>
            </div>

            {/* Keyword Search & Reset */}
            <div className="flex items-center gap-2">
              <div className="relative w-44">
                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter transcript..."
                  className="w-full rounded-lg bg-white pl-6 pr-2 py-1 text-[11px] text-slate-800 placeholder-slate-400 border border-slate-200 focus:outline-none focus:border-[#111A62] shadow-xs"
                />
              </div>

              {onClearTranscripts && transcriptEntries.length > 0 && (
                <button
                  type="button"
                  onClick={onClearTranscripts}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-slate-500 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors cursor-pointer shadow-xs"
                  title="Clear all transcripts for this session"
                >
                  <Trash2 size={11} />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Scrolling Transcript Log */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-3 space-y-1.5 font-sans text-xs bg-slate-50/70"
          >
            {filteredEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-slate-400 mb-1">
                  <Volume2 size={13} />
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  {searchQuery ? "No matches found for search query" : "New Session Started — Transcripts Cleared"}
                </span>
                <p className="text-[11px] text-slate-400 max-w-sm mt-0.5">
                  {searchQuery ? "Try searching with another keyword" : "Listening for live speech from applicant and interviewer..."}
                </p>
              </div>
            ) : (
              filteredEntries.map((item, idx) => {
                const isCandidate =
                  item.speaker?.toLowerCase().includes("alex") ||
                  item.speaker?.toLowerCase().includes("applicant") ||
                  item.speaker?.toLowerCase().includes("candidate") ||
                  item.speaker?.toLowerCase().includes("john paul") ||
                  item.speaker?.toLowerCase().includes("casas");

                return (
                  <div key={item.id || idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="font-mono text-[10px] text-slate-400 shrink-0 select-none pt-0.5">
                      [{item.time || "10:14 AM"}]
                    </span>
                    <span
                      className={cn(
                        "font-bold text-[11px] shrink-0",
                        isCandidate ? "text-blue-700" : "text-[#F97316]"
                      )}
                    >
                      {item.speaker}:
                    </span>
                    <span className="text-slate-800 text-xs">
                      &ldquo;{item.text}&rdquo;
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Area: Post-Interview Workflow Checklist (col-span-4) */}
        <div className="lg:col-span-4 flex flex-col h-44 bg-slate-50/50">
          <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
              Post-Interview Workflow Checklist
            </span>
            <span className="text-[10px] font-mono text-slate-500 font-semibold">
              {Object.values(checklist).filter(Boolean).length}/3 Done
            </span>
          </div>

          <div className="p-3 space-y-2 flex-1 flex flex-col justify-center">
            {/* Checklist items */}
            {[
              { key: "scheduleNextRound", label: "Schedule Next Round" },
              { key: "sendCodeTest", label: "Send Code Test" },
              { key: "recommendOffer", label: "Recommend Offer" },
            ].map(({ key, label }) => {
              const isChecked = Boolean(checklist[key]);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onUpdateChecklist && onUpdateChecklist(key, !isChecked)}
                  className={cn(
                    "flex items-center gap-2.5 w-full text-left px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer shadow-xs",
                    isChecked
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  {isChecked ? (
                    <CheckSquare size={16} className="text-emerald-600 shrink-0" />
                  ) : (
                    <Square size={16} className="text-slate-400 shrink-0" />
                  )}
                  <span className={cn("text-xs font-medium", isChecked && "font-semibold text-emerald-900")}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Call Controls */}
      <div className="px-4 py-2.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
        {/* Left: A/V & End Call Controls */}
        <div className="flex items-center gap-2">
          {/* Mute Audio */}
          <button
            type="button"
            onClick={onToggleMute}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border shadow-xs",
              isMuted
                ? "bg-orange-50 text-[#F97316] border-orange-200 hover:bg-orange-100"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            {isMuted ? <MicOff size={14} className="text-[#F97316]" /> : <Mic size={14} className="text-slate-600" />}
            <span>{isMuted ? "Unmute Audio" : "Mute Audio"}</span>
          </button>

          {/* Video Off */}
          <button
            type="button"
            onClick={onToggleVideo}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border shadow-xs",
              isVideoOff
                ? "bg-orange-50 text-[#F97316] border-orange-200 hover:bg-orange-100"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            {isVideoOff ? <VideoOff size={14} className="text-[#F97316]" /> : <Video size={14} className="text-slate-600" />}
            <span>{isVideoOff ? "Start Video" : "Video Off"}</span>
          </button>

          {/* End Call */}
          <button
            type="button"
            onClick={onEndCall}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white border border-rose-600 transition-colors shadow-xs cursor-pointer ml-2"
          >
            <PhoneOff size={14} />
            <span>End Call</span>
          </button>
        </div>

        {/* Right: Export Transcript / AI Summary */}
        <div>
          <button
            type="button"
            onClick={onExportSummary}
            disabled={isExporting}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#111A62] hover:bg-[#0d1550] text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <FileDown size={14} />
            <span>{isExporting ? "Generating Report..." : "Export Transcript / AI Summary"}</span>
          </button>
        </div>
      </div>
    </div>
  );

}
