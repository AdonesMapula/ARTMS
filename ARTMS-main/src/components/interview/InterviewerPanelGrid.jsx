import { useState, useEffect, useRef } from "react";
import { User, Plus, Mic, MicOff, Copy, Check, Shield, Users, Video, VideoOff } from "lucide-react";
import { VideoTrack } from "@livekit/components-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

/**
 * HrCameraTile
 * ─────────────────────────────────────────────────────────────────────────────
 * Displays the real-time camera view for the HR Interviewer (Host/Evaluator).
 * Uses LiveKit's local camera track when active, or falls back to navigator.mediaDevices.getUserMedia.
 */
function HrCameraTile({ panelist, localCameraTrack, isSpeaking }) {
  const [cameraActive, setCameraActive] = useState(true);
  const [localStream, setLocalStream] = useState(null);
  const [permissionError, setPermissionError] = useState(false);
  const videoRef = useRef(null);

  // Initialize local webcam if not provided by LiveKit track
  useEffect(() => {
    if (localCameraTrack) return;
    let stream = null;
    let mounted = true;

    if (cameraActive) {
      navigator.mediaDevices?.getUserMedia?.({
        video: { width: { ideal: 480 }, height: { ideal: 360 }, facingMode: "user" },
        audio: false,
      })
        .then((s) => {
          if (!mounted) {
            s.getTracks().forEach((t) => t.stop());
            return;
          }
          stream = s;
          setLocalStream(s);
          setPermissionError(false);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch((err) => {
          console.warn("HR Interviewer camera access notice:", err);
          if (mounted) setPermissionError(true);
        });
    } else {
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
        setLocalStream(null);
      }
    }

    return () => {
      mounted = false;
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [cameraActive, localCameraTrack]);

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  return (
    <div
      className={`relative flex flex-col justify-between rounded-lg border overflow-hidden h-28 transition-all duration-200 shadow-xs ${
        isSpeaking
          ? "border-[#F97316] ring-2 ring-[#F97316]/40 shadow-xs"
          : "border-slate-200 bg-slate-900"
      }`}
    >
      {/* Video stream viewport */}
      {cameraActive && !permissionError ? (
        <div className="relative h-full w-full bg-slate-950 flex items-center justify-center overflow-hidden">
          {localCameraTrack && localCameraTrack.publication && !localCameraTrack.publication.isMuted ? (
            <VideoTrack
              trackRef={localCameraTrack}
              className="h-full w-full object-cover -scale-x-100"
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover -scale-x-100"
            />
          )}

          {/* Live indicator badge */}
          <div className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-md bg-black/70 backdrop-blur-xs px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE (You)
          </div>
        </div>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 p-2 text-slate-700 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-[#111A62] font-black text-xs border border-blue-200 shadow-xs mb-1">
            {panelist.avatar || "HR"}
          </div>
          <p className="text-[10px] font-bold text-slate-700 leading-tight truncate max-w-full">
            {panelist.name}
          </p>
          <span className="text-[9px] text-slate-500">
            {permissionError ? "Camera Unavailable" : "Camera Off"}
          </span>
        </div>
      )}

      {/* Control Buttons: Toggle Camera & Mic indicator */}
      <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-10">
        <button
          type="button"
          onClick={() => setCameraActive((v) => !v)}
          title={cameraActive ? "Turn camera off" : "Turn camera on"}
          className="rounded-md bg-black/60 hover:bg-black/80 backdrop-blur-xs p-1 text-white text-[10px] transition-colors cursor-pointer border border-white/20"
        >
          {cameraActive && !permissionError ? <Video size={10} /> : <VideoOff size={10} className="text-rose-400" />}
        </button>

        <span className="rounded-md bg-black/60 backdrop-blur-xs p-1 text-white border border-white/20">
          {panelist.isMuted ? (
            <MicOff size={10} className="text-rose-400" />
          ) : (
            <Mic size={10} className={isSpeaking ? "text-[#F97316] animate-pulse" : "text-emerald-400"} />
          )}
        </span>
      </div>

      {/* Bottom Name Banner Overlay */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-1.5 pt-4 z-10 pointer-events-none">
        <p className="text-[10px] font-bold text-white truncate max-w-full leading-tight">
          {panelist.name}
        </p>
        <p className="text-[9px] font-medium text-slate-200 truncate leading-tight">
          {panelist.role}
        </p>
      </div>
    </div>
  );
}

export default function InterviewerPanelGrid({
  panelists = [],
  onInviteGenerated = null,
  interviewId = "",
  localCameraTrack = null,
}) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteRole, setInviteRole] = useState("Technical Evaluator");
  const [copied, setCopied] = useState(false);

  // Generate invite link
  const inviteUrl = typeof window !== "undefined"
    ? `${window.location.origin}/interview/${interviewId}?role=interviewer&panelistRole=${encodeURIComponent(inviteRole)}`
    : "";

  const handleCopy = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
        {/* Title / Status */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Users size={14} className="text-[#111A62]" />
            <span className="uppercase tracking-wider text-[11px] font-extrabold text-slate-800">Interviewer Panel</span>
            <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 font-mono text-[10px] text-slate-700 font-semibold">
              {panelists.length} Active
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="text-[10px] font-bold text-[#F97316] hover:text-orange-600 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Plus size={12} /> Invite Co-Host
          </button>
        </div>

        {/* Scalable Grid: 1 to 4 columns depending on count */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {panelists.map((panelist) => {
            const isSpeaking = panelist.isSpeaking;
            const isHrHost = panelist.isHost || panelist.id.includes("host");

            // For HR Host / You: Render Live Camera Tile
            if (isHrHost) {
              return (
                <HrCameraTile
                  key={panelist.id}
                  panelist={panelist}
                  localCameraTrack={localCameraTrack}
                  isSpeaking={isSpeaking}
                />
              );
            }

            return (
              <div
                key={panelist.id}
                className={`relative flex flex-col items-center justify-between rounded-lg border p-2 h-28 transition-all duration-200 shadow-xs ${
                  isSpeaking
                    ? "border-[#F97316] bg-orange-50/60 ring-2 ring-[#F97316]/30 shadow-xs"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                {/* Avatar Icon / Tile representation */}
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#111A62] font-black text-xs border border-slate-200 shadow-xs mt-1">
                  {panelist.avatar || <User size={18} />}
                </div>

                {/* Status indicator top right */}
                <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                  {panelist.isMuted ? (
                    <MicOff size={11} className="text-slate-400" />
                  ) : (
                    <Mic size={11} className={isSpeaking ? "text-[#F97316] animate-pulse" : "text-emerald-600"} />
                  )}
                </div>

                {/* Label Tags */}
                <div className="w-full text-center">
                  <p className="text-[10px] font-bold text-slate-800 truncate max-w-full">
                    {panelist.name}
                  </p>
                  <p className="text-[9px] font-medium text-slate-500 truncate">
                    {panelist.role}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Action Tile: [+] Add Panelist (Invite Link) */}
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="group flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-2 h-28 hover:border-[#111A62] hover:bg-blue-50/50 transition-all cursor-pointer text-slate-500 hover:text-[#111A62] text-center shadow-xs"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 group-hover:border-[#111A62] group-hover:bg-blue-100/60 transition-colors mb-1">
              <Plus size={15} />
            </div>
            <span className="text-[10px] font-bold tracking-tight text-slate-700 group-hover:text-[#111A62]">Add Panelist</span>
            <span className="text-[9px] text-slate-400">(Invite Link)</span>
          </button>
        </div>
      </div>

      {/* Add Panelist Invite Modal */}
      <Modal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title={
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Users className="h-5 w-5 text-blue-600" />
            <span>Invite Co-Interviewer to Session</span>
          </div>
        }
        description="Generate a secure room URL to invite other hiring team members or department heads."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowInviteModal(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={handleCopy} className="gap-1.5">
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? "Copied Link!" : "Copy Invite URL"}</span>
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-1 text-xs">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Panelist Role Designation
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
            >
              <option value="Technical Evaluator">Technical Evaluator / Lead Engineer</option>
              <option value="Hiring Manager">Hiring Manager / Department Head</option>
              <option value="HR Recruiter">HR Recruiter / Operations</option>
              <option value="Executive Observer">Executive Observer (COO / VP)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Interviewer Access URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 font-mono text-[11px] text-slate-700 dark:text-slate-300 outline-none select-all"
              />
              <Button size="sm" onClick={handleCopy} className="shrink-0 gap-1 font-bold">
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </Button>
            </div>
            <p className="mt-1.5 text-[10px] text-slate-400">
              Only share this with authorized interviewers. Candidate join links are managed separately.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}
