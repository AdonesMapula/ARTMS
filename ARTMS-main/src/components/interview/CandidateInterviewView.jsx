import { useState, useEffect } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, User, Wifi } from "lucide-react";
import { VideoTrack } from "@livekit/components-react";
import { cn } from "../../utils/cn";

/**
 * CandidateInterviewView
 * ─────────────────────────────────────────────────────────────────────────────
 * Section 3: Candidate View (Simplified Clean UI)
 * 
 * Strict Security Guard:
 * - Candidate view NEVER receives telemetry, MediaPipe data, transcription,
 *   rubric scores, or recruiter notes.
 * - Entirely clean DOM tree with only:
 *   1. Minimal header with ARTMS branding & session status
 *   2. Main stage: Focused view of the interviewer grid
 *   3. Picture-in-picture floating tile: Candidate self-view local camera
 *   4. Bottom controls: [ Mute Audio ], [ Video Off ], [ Leave Call ]
 */

export default function CandidateInterviewView({
  candidateName = "Applicant",
  jobTitle = "Role Candidate",
  // Panelists info (names & roles only, no scores)
  panelists = [
    { id: "1", name: "Lead Recruiter", role: "HR Host", avatar: "LR", isSpeaking: false },
    { id: "2", name: "Engineering Manager", role: "Tech Lead", avatar: "EM", isSpeaking: false },
  ],
  // Local media tracks
  localCameraTrack = null,
  localVideoRef = null,
  isMuted = false,
  onToggleMute,
  isVideoOff = false,
  onToggleVideo,
  onLeaveCall,
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSec) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 text-slate-800 select-none overflow-hidden font-sans">
      {/* Minimal Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#111A62] text-white font-black text-xs shadow-xs">
              A
            </div>
            <span className="font-extrabold text-base tracking-wider text-slate-900">
              ARTMS
            </span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-xs font-semibold text-slate-600">
            Interview Session • {jobTitle}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-700 bg-slate-50 px-3 py-1 rounded-full border border-slate-200 shadow-xs">
            <Wifi size={12} className="text-emerald-500" />
            <span>Connected</span>
            <span className="text-slate-400">•</span>
            <span>{formatTime(elapsedSeconds)}</span>
          </div>
        </div>
      </header>

      {/* Main Stage: Focused Interviewer Grid */}
      <main className="relative flex-1 p-4 md:p-6 flex flex-col justify-center items-center overflow-hidden bg-slate-100">
        {/* Interviewers Grid */}
        <div className="w-full max-w-5xl h-full flex flex-col justify-center">
          <div className="text-center mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Interviewer Panel ({panelists.length})
            </span>
          </div>

          <div
            className={cn(
              "grid gap-4 w-full h-[65vh] max-h-[600px]",
              panelists.length <= 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-2 md:grid-cols-3"
            )}
          >
            {panelists.map((panelist) => (
              <div
                key={panelist.id}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-xl border bg-white overflow-hidden shadow-xs transition-all",
                  panelist.isSpeaking
                    ? "border-[#F97316] ring-2 ring-[#F97316]/40"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                {/* Visual Avatar / Tile */}
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 border-2 border-slate-200 text-[#111A62] text-xl font-bold shadow-xs">
                  {panelist.avatar || <User size={32} />}
                </div>

                {/* Name & Role Tag */}
                <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-xs rounded-lg px-3 py-1.5 border border-slate-200 flex items-center justify-between shadow-xs">
                  <div>
                    <p className="text-xs font-bold text-slate-900 leading-none">
                      {panelist.name}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {panelist.role}
                    </p>
                  </div>
                  {panelist.isSpeaking && (
                    <span className="h-2 w-2 rounded-full bg-[#F97316] animate-ping" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Corner Floating Window: Candidate Self-View Tile */}
        <div className="absolute bottom-6 right-6 w-48 sm:w-56 aspect-video rounded-xl border-2 border-slate-300 bg-slate-900 shadow-xl overflow-hidden group">
          {/* Local Camera stream */}
          <div className="relative h-full w-full bg-black flex items-center justify-center">
            {localCameraTrack && !isVideoOff ? (
              <VideoTrack trackRef={localCameraTrack} className="h-full w-full object-cover -scale-x-100" />
            ) : localVideoRef ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                  "h-full w-full object-cover -scale-x-100",
                  isVideoOff && "hidden"
                )}
              />
            ) : null}

            {isVideoOff && (
              <div className="flex flex-col items-center justify-center gap-1 text-slate-400">
                <VideoOff size={22} />
                <span className="text-[10px] font-medium">Camera is off</span>
              </div>
            )}

            {/* Label overlay */}
            <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[10px] font-bold text-white bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded">
              <span className="truncate">{candidateName} (You)</span>
              {isMuted && <MicOff size={11} className="text-amber-400" />}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Controls */}
      <footer className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-center gap-4 shadow-xs">
        {/* Mute Audio */}
        <button
          type="button"
          onClick={onToggleMute}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer border shadow-xs",
            isMuted
              ? "bg-orange-50 text-[#F97316] border-orange-200 hover:bg-orange-100"
              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
          )}
        >
          {isMuted ? <MicOff size={16} className="text-[#F97316]" /> : <Mic size={16} />}
          <span>{isMuted ? "Unmute Mic" : "Mute Mic"}</span>
        </button>

        {/* Video Off */}
        <button
          type="button"
          onClick={onToggleVideo}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer border shadow-xs",
            isVideoOff
              ? "bg-orange-50 text-[#F97316] border-orange-200 hover:bg-orange-100"
              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
          )}
        >
          {isVideoOff ? <VideoOff size={16} className="text-[#F97316]" /> : <Video size={16} />}
          <span>{isVideoOff ? "Turn Video On" : "Turn Video Off"}</span>
        </button>

        {/* Leave Call */}
        <button
          type="button"
          onClick={onLeaveCall}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white border border-rose-600 transition-all shadow-xs cursor-pointer ml-4"
        >
          <PhoneOff size={16} />
          <span>Leave Call</span>
        </button>
      </footer>
    </div>
  );

}
