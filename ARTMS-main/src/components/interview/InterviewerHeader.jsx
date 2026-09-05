import { useState, useEffect } from "react";
import {
  Clock, Shield, Settings, Lock, Unlock, Mic, Video,
  ChevronDown, CheckCircle, AlertCircle, Sparkles, Volume2
} from "lucide-react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

/**
 * InterviewerHeader
 * ─────────────────────────────────────────────────────────────────────────────
 * Top session header matching Section 2.A of the architectural specification:
 * - Brand identifier: ARTMS
 * - Metadata chips: Job Title, Candidate Name, Resume Fit Score
 * - Session Timer with Pacing status alerts (On track / Running long)
 * - Recruiter Controls dropdown (device configuration, room lock, permissions)
 */

export default function InterviewerHeader({
  candidateName = "Applicant",
  jobTitle = "Role Candidate",
  fitScore = null,
  roomLocked = false,
  onToggleRoomLock,
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showControlsModal, setShowControlsModal] = useState(false);
  const [selectedMic, setSelectedMic] = useState("default");
  const [selectedCam, setSelectedCam] = useState("default");
  const [isLocked, setIsLocked] = useState(roomLocked);

  const handleToggleLock = () => {
    const next = !isLocked;
    setIsLocked(next);
    if (onToggleRoomLock) {
      onToggleRoomLock(next);
    }
  };

  // Timer: 1 second ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60).toString().padStart(2, "0");
    const secs = (totalSecs % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  // Pace status alert (e.g., target 30 minutes)
  const isPaceLong = elapsedSeconds > 30 * 60;

  return (
    <>
      <header className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between gap-3 text-slate-800 shrink-0 z-40 shadow-xs">
        {/* Left: Brand + Metadata Chips */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap min-w-0">
          {/* Brand Logo */}
          <div className="flex items-center gap-2 pr-2 sm:pr-3 border-r border-slate-200 shrink-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#111A62] text-white font-black text-xs shadow-xs">
              A
            </div>
            <span className="font-extrabold tracking-tight text-slate-900 text-sm">
              ARTMS
            </span>
          </div>

          {/* Job Chip */}
          <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Job:</span>
            <span className="font-semibold text-slate-800 truncate max-w-[170px]">{jobTitle}</span>
          </div>

          {/* Candidate Chip */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Candidate:</span>
            <span className="font-bold text-slate-900 truncate max-w-[160px]">{candidateName}</span>
          </div>

          {/* Fit Score Chip */}
          {fitScore !== null && fitScore !== undefined ? (
            <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800 shadow-xs">
              <Sparkles size={12} className="text-emerald-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Fit Score:</span>
              <span className="font-mono font-black text-emerald-800">{Math.round(fitScore)}%</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 shadow-xs">
              <Sparkles size={12} className="text-slate-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fit Score:</span>
              <span className="font-mono font-medium text-slate-500">Pending</span>
            </div>
          )}
        </div>

        {/* Right: Session Timer & Recruiter Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Timer & Pace Alerts */}
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs shadow-xs">
            <Clock size={13} className="text-slate-500" />
            <span className="font-mono font-bold tracking-tight text-slate-800">
              {formatTimer(elapsedSeconds)}
            </span>
            <span
              className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${isPaceLong
                  ? "bg-orange-100 text-[#F97316] border border-orange-200"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isPaceLong ? "bg-[#F97316] animate-pulse" : "bg-emerald-600"}`} />
              {isPaceLong ? "Pace: Running Long" : "On Track"}
            </span>
          </div>

          {/* Room Lock Quick Indicator */}
          {isLocked && (
            <span className="hidden lg:inline-flex items-center gap-1 rounded bg-rose-50 border border-rose-200 px-2 py-1 text-[10px] font-bold uppercase text-rose-700">
              <Lock size={11} /> Room Locked
            </span>
          )}

          {/* Recruiter Controls Dropdown Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowControlsModal(true)}
            className="h-8 text-xs gap-1.5 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer shadow-xs"
          >
            <Settings size={13} className="text-slate-500" />
            <span className="hidden sm:inline font-semibold">Recruiter Controls</span>
            <ChevronDown size={12} className="text-slate-400" />
          </Button>
        </div>
      </header>

      {/* Recruiter Controls Modal */}
      <Modal
        open={showControlsModal}
        onClose={() => setShowControlsModal(false)}
        title={
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Shield className="h-5 w-5 text-blue-600" />
            <span>Recruiter Session Controls</span>
          </div>
        }
        description="Configure interview room access, hardware devices, and session preferences."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="primary" onClick={() => setShowControlsModal(false)}>
              Done
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-1 text-xs">
          {/* Room Security & Lock */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-600">
                  {isLocked ? <Lock size={15} /> : <Unlock size={15} />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Interview Room Access Lock</h4>
                  <p className="text-[11px] text-slate-500">Prevent uninvited participants or late joiners from entering</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleLock}
                className={`px-3 py-1.5 rounded-md font-bold text-xs transition-colors cursor-pointer ${isLocked
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                  }`}
              >
                {isLocked ? "Unlock Room" : "Lock Room"}
              </button>
            </div>
          </div>

          {/* Audio Input Device */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Microphone Input
            </label>
            <div className="flex items-center gap-2">
              <Mic size={14} className="text-slate-400 shrink-0" />
              <select
                value={selectedMic}
                onChange={(e) => setSelectedMic(e.target.value)}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
              >
                <option value="default">Default System Microphone</option>
                <option value="headset">Studio USB Headset Microphone</option>
                <option value="builtin">Built-in Internal Array</option>
              </select>
            </div>
          </div>

          {/* Video Input Device */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Camera Input
            </label>
            <div className="flex items-center gap-2">
              <Video size={14} className="text-slate-400 shrink-0" />
              <select
                value={selectedCam}
                onChange={(e) => setSelectedCam(e.target.value)}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
              >
                <option value="default">Integrated HD Webcam (1080p)</option>
                <option value="external">External 4K Wide-Angle Camera</option>
              </select>
            </div>
          </div>

          {/* Pacing Alert Threshold */}
          <div className="rounded-md border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 p-3 flex items-start gap-2.5 text-blue-900 dark:text-blue-300">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-blue-600" />
            <p className="text-[11px] leading-relaxed">
              Target session duration is set to <strong>30 minutes</strong>. Yellow pace alerts will activate if discussions exceed this target.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}
