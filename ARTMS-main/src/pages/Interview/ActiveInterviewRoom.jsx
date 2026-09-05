/**
 * ActiveInterviewRoom.jsx
 * ────────────────────────
 * Zoom-style LiveKit video conferencing UI for ARTMS.
 *
 * - Applicant View: Full-screen Zoom call layout (matching Image 1)
 * - Interviewer View: Zoom stage + Live Sentiment/Keywords/AI Match Score analytics + Sidebar (matching Image 2)
 */
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import InterviewerRoomView from "../../components/interview/InterviewerRoomView";
import CandidateInterviewView from "../../components/interview/CandidateInterviewView";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  useLocalParticipant,
  useRoomContext,
  VideoTrack,
} from "@livekit/components-react";
import { RoomEvent, Track, ConnectionState } from "livekit-client";
import "@livekit/components-styles";

import { cn } from "../../utils/cn";
import { Globe } from "lucide-react";
import Button from "../../components/ui/Button";
import interviewService from "../../services/interviewService";
import InterviewReportModal from "../../modals/InterviewReportModal";

import { useFaceLandmarker } from "../../hooks/useFaceLandmarker";
import { evaluateBehavior, estimateHeadPose } from "../../utils/behavioralMetrics";
import { drawFaceDebugOverlay } from "../../utils/faceDrawing";

// ── SVG Icons ─────────────────────────────────────────────────────────────────

function MicIcon({ muted }) {
  return muted ? (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth={2} />
    </svg>
  ) : (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  );
}

function CameraIcon({ muted }) {
  return muted ? (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth={2} />
    </svg>
  ) : (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function ScreenShareIcon({ active }) {
  return (
    <svg className={cn("w-5 h-5", active ? "text-emerald-400" : "text-white")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function HangupIcon() {
  return (
    <svg className="w-6 h-6 text-white rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.27c1.21.49 2.53.76 3.88.76a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.35.27 2.67.76 3.88a1 1 0 01-.27 1.11l-2.37 2.4z" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
    </svg>
  );
}

function UserIcon({ className = "w-16 h-16" }) {
  return (
    <svg className={cn("text-slate-400", className)} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}

// ── DPA Consent Modal ────────────────────────────────────────────────────────

function DpaConsentModal({ onAccept, onDecline }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="rounded-t-2xl border-b border-slate-100 bg-slate-50 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg">
              🔒
            </span>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                Data Privacy Notice
              </h2>
              <p className="text-xs font-medium text-slate-500">
                Republic Act No. 10173 — Data Privacy Act of 2012
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4 text-xs text-slate-600 leading-relaxed max-h-[60vh] overflow-y-auto">
          <p>
            Before joining this online interview session, please review and accept our Data Privacy policy:
          </p>
          <ul className="list-disc pl-4 space-y-2">
            <li>
              <strong>Video & Audio Recording:</strong> This session will be recorded and transcribed in real-time for evaluation, quality assurance, and automated AI analysis.
            </li>
            <li>
              <strong>Automated AI Evaluation:</strong> An artificial intelligence model (xAI Grok) will process transcript dialogue and MediaPipe facial analysis to generate candidate evaluation metrics.
            </li>
            <li>
              <strong>Data Access & Retention:</strong> Recorded data will be strictly accessed by authorised HR personnel and kept in secure storage in accordance with company policy.
            </li>
          </ul>
        </div>

        <div className="flex items-center justify-end gap-3 rounded-b-2xl border-t border-slate-100 bg-slate-50 px-6 py-4">
          <Button variant="outline" onClick={onDecline}>
            Decline & Exit
          </Button>
          <Button onClick={onAccept}>
            I Consent & Join Interview
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Applicant Verification Form ───────────────────────────────────────────────

function ApplicantVerificationForm({ onSubmit, loading, error, onCancel }) {
  const [email, setEmail] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    onSubmit(email);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 text-2xl">
            👤
          </span>
          <div>
            <h2 className="text-lg font-bold text-white">Applicant Verification</h2>
            <p className="text-xs text-slate-400">ARTMS Interview Access Gate</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
          Please enter your <strong>registered email address</strong> to verify your identity for this interview session.
        </p>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/40 p-3.5 text-xs text-red-300 font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              Registered Email Address
            </label>
            <input
              type="email"
              required
              placeholder="e.g. adonesmapula1@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Exit
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold">
              {loading ? "Verifying…" : "Enter Interview 🎥"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── FaceTrackingVideo Component (Runs MediaPipe FaceLandmarker at throttled ~15 FPS) ──

function FaceTrackingVideo({ trackRef, className, isApplicant, onMetricsComputed }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { landmarker, loading } = useFaceLandmarker();
  const lastProcessedTimeRef = useRef(0);
  const headHistoryRef = useRef([]);

  // Attach/detach LiveKit track to HTML5 <video> tag
  useEffect(() => {
    const track = trackRef?.track || trackRef?.publication?.track;
    const videoEl = videoRef.current;
    if (track && videoEl) {
      track.attach(videoEl);
      return () => {
        track.detach(videoEl);
      };
    }
  }, [trackRef]);

  // Throttled FaceLandmarker loop (caps inference to 15fps to protect system performance)
  useEffect(() => {
    if (!landmarker || loading) return;

    let active = true;
    let animationFrameId;

    const runDetection = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || video.paused || video.ended || video.readyState < 2) {
        if (active) {
          animationFrameId = requestAnimationFrame(runDetection);
        }
        return;
      }

      const now = performance.now();
      // Throttle interval: 66ms = 15 FPS
      if (now - lastProcessedTimeRef.current >= 66) {
        lastProcessedTimeRef.current = now;

        try {
          const timestamp = video.currentTime * 1000;
          const result = landmarker.detectForVideo(video, timestamp);

          if (result && result.faceLandmarks && result.faceLandmarks.length > 0) {
            const landmarks = result.faceLandmarks[0];
            const blendshapes = result.faceBlendshapes && result.faceBlendshapes.length > 0
              ? result.faceBlendshapes[0].categories
              : [];

            // Add head pose to sliding window history for jitter/fidgeting calculation
            const { yaw, pitch, roll } = estimateHeadPose(landmarks);
            headHistoryRef.current.push({ yaw, pitch, roll });
            if (headHistoryRef.current.length > 30) {
              headHistoryRef.current.shift();
            }

            const scores = evaluateBehavior(landmarks, blendshapes, headHistoryRef.current);

            if (onMetricsComputed) {
              onMetricsComputed(scores);
            }

            // Draw debug overlay if ?debug=true is present in query parameters (HR / Interviewer view only)
            const isDebug = new URLSearchParams(window.location.search).get("debug") === "true";
            if (canvas && isDebug && !isApplicant) {
              if (canvas.width !== video.clientWidth || canvas.height !== video.clientHeight) {
                canvas.width = video.clientWidth;
                canvas.height = video.clientHeight;
              }
              drawFaceDebugOverlay(canvas, landmarks);
            } else if (canvas) {
              const ctx = canvas.getContext("2d");
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
          } else {
            // Face lost / not detected
            if (onMetricsComputed) {
              onMetricsComputed({
                faceDetected: false,
                attentiveScore: 0,
                composedScore: 0,
                engagedScore: 0,
                emotion: "Looking Away",
              });
            }
            if (canvas) {
              const ctx = canvas.getContext("2d");
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
          }
        } catch (err) {
          console.warn("FaceLandmarker detection error:", err);
        }
      }

      if (active) {
        animationFrameId = requestAnimationFrame(runDetection);
      }
    };

    runDetection();

    return () => {
      active = false;
      cancelAnimationFrame(animationFrameId);
    };
  }, [landmarker, loading, isApplicant, onMetricsComputed]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <video
        ref={videoRef}
        className={className}
        playsInline
        muted
        autoPlay
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-20 h-full w-full"
      />
    </div>
  );
}

// ── Zoom Video Stage Component (Shared between Applicant & Interviewer) ─────

function ZoomVideoStage({ applicantName, onHangup, isApplicant, latestCaption, speechLang, setSpeechLang, endingSession, onMetricsComputed }) {
  const [liveScores, setLiveScores] = useState(null);

  const handleLocalMetrics = useCallback((metrics) => {
    setLiveScores(metrics);
    if (onMetricsComputed) {
      onMetricsComputed(metrics);
    }
  }, [onMetricsComputed]);

  // Query both camera and screen share tracks across local and remote participants
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant();

  // Find remote and local camera tracks
  const remoteCameraTrack = tracks.find(
    (t) => t.source === Track.Source.Camera && t.participant && !t.participant.isLocal
  );
  const localCameraTrack = tracks.find(
    (t) => t.source === Track.Source.Camera && t.participant && t.participant.isLocal
  );
  const screenShareTrack = tracks.find(
    (t) => t.source === Track.Source.ScreenShare && t.publication && !t.publication.isMuted
  );

  // A remote camera track is active if publication exists and is unmuted
  const isRemoteVideoActive = Boolean(
    remoteCameraTrack &&
    remoteCameraTrack.publication &&
    !remoteCameraTrack.publication.isMuted
  );

  // A local camera track is active if publication exists and is unmuted
  const isLocalVideoActive = Boolean(
    localCameraTrack &&
    localCameraTrack.publication &&
    !localCameraTrack.publication.isMuted
  );

  // Toggle Controls synced directly with LiveKit hardware state
  const toggleMic = useCallback(async () => {
    if (!localParticipant) return;
    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch (err) {
      console.warn("Microphone access denied or canceled:", err);
    }
  }, [localParticipant, isMicrophoneEnabled]);

  const toggleCam = useCallback(async () => {
    if (!localParticipant) return;
    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
    } catch (err) {
      console.warn("Camera access denied or canceled:", err);
    }
  }, [localParticipant, isCameraEnabled]);

  const toggleScreen = useCallback(async () => {
    if (!localParticipant) return;
    try {
      await localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
    } catch (err) {
      console.warn("Screen share denied or canceled:", err);
    }
  }, [localParticipant, isScreenShareEnabled]);

  // Handle participant labels
  const remoteParticipantName = isApplicant ? "HR Interviewer" : applicantName;
  const localParticipantName = isApplicant ? applicantName : "HR Interviewer";

  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-2xl bg-[#0b0f17] border border-slate-800 shadow-2xl">
      
      {/* ── Main Video Display Stage (Zoom Layout) ────────────────────── */}
      <div className="relative flex-1 w-full bg-[#111723] overflow-hidden">

        {/* Priority 1: Screen Share view if active */}
        {screenShareTrack ? (
          <div className="h-full w-full flex items-center justify-center bg-black">
            <VideoTrack trackRef={screenShareTrack} className="max-h-full max-w-full object-contain" />
          </div>
        ) : isRemoteVideoActive ? (
          /* Priority 2: Remote Participant Camera Track (Full Stage) */
          !isApplicant ? (
            <FaceTrackingVideo
              trackRef={remoteCameraTrack}
              className="h-full w-full object-cover"
              isApplicant={false}
              onMetricsComputed={handleLocalMetrics}
            />
          ) : (
            <VideoTrack trackRef={remoteCameraTrack} className="h-full w-full object-cover" />
          )
        ) : (
          /* Priority 3: Connecting / Audio Only Placeholder for Remote Participant */
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-slate-900/90 text-slate-400">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-800 text-3xl font-bold text-white shadow-xl border border-slate-700">
              {remoteParticipantName ? remoteParticipantName.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="text-center">
              <p className="font-semibold text-white text-lg">{remoteParticipantName}</p>
              <p className="text-xs text-slate-400 mt-1 animate-pulse">
                {remoteCameraTrack ? "Camera muted" : "Connecting video..."}
              </p>
            </div>
          </div>
        )}

        {/* Floating Live AI Evaluation Badge (Interviewer/HR view only) */}
        {!isApplicant && remoteCameraTrack && liveScores && (
          <div className="absolute top-4 left-4 z-30 flex items-center gap-2 rounded-xl bg-[#0b0f17]/90 px-3.5 py-2 backdrop-blur-md border border-slate-800/80 shadow-lg">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Live AI Evaluation:</span>
            <span className={cn(
              "text-[9px] font-black px-2 py-0.5 rounded border tracking-wide uppercase",
              liveScores.emotion === "Distracted / Looking Away" && "bg-amber-500/10 border-amber-500/30 text-amber-400",
              liveScores.emotion === "Hesitant / Stressed" && "bg-orange-500/10 border-orange-500/30 text-orange-400",
              liveScores.emotion === "Engaged & Positive" && "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
              liveScores.emotion === "Composed & Focused" && "bg-indigo-500/10 border-indigo-500/30 text-indigo-400",
              liveScores.emotion === "Neutral & Attentive" && "bg-slate-700/10 border-slate-500/30 text-slate-300",
              liveScores.emotion === "No Face Detected" && "bg-red-500/10 border-red-500/30 text-red-400"
            )}>
              {liveScores.emotion}
            </span>
            <span className="text-[9px] font-bold text-slate-400 ml-1">
              (Composed: {liveScores.composedScore}% • Attentive: {liveScores.attentiveScore}% • Valence: {liveScores.valence ?? 75}%)
            </span>
          </div>
        )}

        {/* Local Participant Picture-in-Picture (Top Right) */}
        <div className="absolute top-4 right-4 z-30 h-36 w-48 overflow-hidden rounded-xl border-2 border-slate-700 bg-slate-900 shadow-2xl transition-all hover:scale-105">
          {isLocalVideoActive ? (
            isApplicant ? (
              <FaceTrackingVideo
                trackRef={localCameraTrack}
                className="h-full w-full object-cover"
                isApplicant={true}
                onMetricsComputed={handleLocalMetrics}
              />
            ) : (
              <VideoTrack trackRef={localCameraTrack} className="h-full w-full object-cover" />
            )
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-slate-800 text-slate-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-white">
                {localParticipantName ? localParticipantName.charAt(0).toUpperCase() : "Y"}
              </div>
              <span className="text-[10px] font-medium text-slate-300">You (Muted)</span>
            </div>
          )}
          <span className="absolute bottom-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            You
          </span>
        </div>

        {/* Participant Name Badge (Bottom Left) */}
        <div className="absolute bottom-4 left-4 z-30 flex items-center gap-2 rounded-lg bg-slate-900/90 px-3.5 py-2 backdrop-blur-md border border-slate-800/80 shadow-md">
          <span className={cn("h-2.5 w-2.5 rounded-full", remoteCameraTrack ? "bg-emerald-400 animate-pulse" : "bg-amber-400 animate-ping")} />
          <span className="text-xs font-semibold text-white tracking-wide">
            {remoteCameraTrack ? remoteParticipantName : `Connecting: ${remoteParticipantName}`}
          </span>
        </div>
      </div>

      {/* ── Zoom Control Bar (Bottom) ────────────────────────────────────── */}
      <div className="h-16 bg-[#0b0f17] px-6 flex items-center justify-center gap-4 border-t border-slate-800/80 z-40">
        
        {/* Speech Dialect / Language Selector (Interviewer Only) */}
        {!isApplicant && setSpeechLang && (
          <div className="flex items-center gap-1.5 rounded-full bg-slate-800/90 border border-slate-700/80 px-3 py-1.5 text-xs text-slate-300 shadow-md">
            <Globe size={14} className="text-blue-400 shrink-0" />
            <select
              value={speechLang || "fil-PH"}
              onChange={(e) => setSpeechLang(e.target.value)}
              className="bg-transparent font-medium text-white outline-none cursor-pointer text-xs pr-1"
              title="Select Dialect / Language for Speech Recognition"
            >
              <option value="fil-PH" className="bg-[#111723] text-white"> Tagalog / Taglish</option>
              <option value="ceb-PH" className="bg-[#111723] text-white"> Cebuano / Bisaya</option>
              <option value="hil-PH" className="bg-[#111723] text-white"> Hiligaynon / Ilonggo</option>
              <option value="en-PH" className="bg-[#111723] text-white"> PH English</option>
              <option value="en-US" className="bg-[#111723] text-white"> US English</option>
            </select>
          </div>
        )}

        {/* Mic Toggle */}
        <button
          onClick={toggleMic}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full transition-all shadow-md",
            !isMicrophoneEnabled ? "bg-red-600 hover:bg-red-500" : "bg-slate-800 hover:bg-slate-700"
          )}
          title={!isMicrophoneEnabled ? "Unmute Microphone" : "Mute Microphone"}
        >
          <MicIcon muted={!isMicrophoneEnabled} />
        </button>

        {/* Camera Toggle */}
        <button
          onClick={toggleCam}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full transition-all shadow-md",
            !isCameraEnabled ? "bg-red-600 hover:bg-red-500" : "bg-slate-800 hover:bg-slate-700"
          )}
          title={!isCameraEnabled ? "Turn On Camera" : "Turn Off Camera"}
        >
          <CameraIcon muted={!isCameraEnabled} />
        </button>

        {/* Screen Share Toggle */}
        <button
          onClick={toggleScreen}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full transition-all shadow-md",
            isScreenShareEnabled ? "bg-emerald-600/80 hover:bg-emerald-500" : "bg-slate-800 hover:bg-slate-700"
          )}
          title="Share Screen"
        >
          <ScreenShareIcon active={isScreenShareEnabled} />
        </button>

        {/* Hangup / End Call Button */}
        <button
          onClick={onHangup}
          disabled={endingSession}
          className="flex h-11 w-12 items-center justify-center rounded-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white shadow-lg transition-all cursor-pointer"
          title={endingSession ? "Ending Call..." : "End Call"}
        >
          {endingSession ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <HangupIcon />}
        </button>

        {/* More Options Button */}
        <button
          className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 transition-all shadow-md"
          title="More Options"
        >
          <DotsIcon />
        </button>
      </div>

    </div>
  );
}

// ── Unified Two-Way LiveKit Real-Time Streaming & Persistence Manager ────────

function TwoWayTranscriptionManager({
  interviewId,
  isApplicant = false,
  speechLang = "fil-PH",
  onLiveSegmentProduced,
  setInterimSpeech,
}) {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();

  const recognitionRef = useRef(null);
  const isRecognizingRef = useRef(false);
  const processedHashesRef = useRef(new Map());

  // 1. LiveKit WebRTC Data Channel Broadcasting (0ms Latency Transport with ConnectionState Guard)
  const broadcastData = useCallback((dataObj) => {
    if (!room || !room.localParticipant) return;

    try {
      // Verify room connection state to prevent PC manager closed errors
      const isConnected =
        room.state === "connected" ||
        (typeof ConnectionState !== "undefined" && room.state === ConnectionState.Connected);

      if (!isConnected) {
        console.log(`[LIVEKIT PUBLISH SKIPPED] Room state is '${room.state}'`);
        return;
      }

      const bytes = new TextEncoder().encode(JSON.stringify(dataObj));
      room.localParticipant.publishData(bytes, { reliable: true });
      console.log(`[LIVEKIT PUBLISH SUCCESS] (${dataObj.type})`);
    } catch (e) {
      console.warn("[LIVEKIT PUBLISH NOTICE]", e?.message || e);
    }
  }, [room]);

  // 2. Listen for Incoming LiveKit Data Messages from Remote Participant
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload) => {
      try {
        const textStr = new TextDecoder().decode(payload);
        const data = JSON.parse(textStr);

        if (data.type === "FINAL_SEGMENT" && data.segment) {
          console.log(`[WEBRTC RECEIVE] Remote segment (${data.segment.speaker_role}): "${data.segment.text}"`);
          if (onLiveSegmentProduced) onLiveSegmentProduced(data.segment);
        } else if (data.type === "INTERIM_SPEECH") {
          if (setInterimSpeech && data.speaker_role !== (isApplicant ? "applicant" : "hr")) {
            setInterimSpeech(data.text);
          }
        }
      } catch (e) {}
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, isApplicant, onLiveSegmentProduced, setInterimSpeech]);

  // 3. Process and Persist Finalized Speech Segment (Instant UI + WebRTC Broadcast + Async DB)
  const processFinalSegment = useCallback(
    (text, role, identity) => {
      const trimmed = text ? text.trim() : "";
      if (!trimmed || trimmed.length < 2) return;

      const now = Date.now();
      const textKey = `${role}_${trimmed.toLowerCase()}`;

      // Deduplicate segment within a 4-second window
      if (processedHashesRef.current.has(textKey)) {
        const lastSeen = processedHashesRef.current.get(textKey);
        if (now - lastSeen < 4000) return;
      }
      processedHashesRef.current.set(textKey, now);

      const segment = {
        id: `seg_${role}_${now}_${Math.random().toString(36).substring(2, 6)}`,
        speaker_role: role,
        speaker_identity: identity || role,
        dialect_detected: speechLang || "fil-PH",
        text: trimmed,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        created_at: new Date().toISOString(),
      };

      const startT = performance.now();
      console.log(`[STT FINAL +${startT.toFixed(0)}ms] (${role}) [${speechLang}]: "${trimmed}"`);

      // Step A: Instant Local UI Update (0ms) - GUARANTEED
      try {
        if (onLiveSegmentProduced) onLiveSegmentProduced(segment);
      } catch (uiErr) {
        console.error("UI state update error:", uiErr);
      }

      // Step B: Instant WebRTC Broadcast over Data Channel (~20ms) - ISOLATED
      try {
        broadcastData({ type: "FINAL_SEGMENT", segment });
      } catch (netErr) {
        console.warn("Data Channel broadcast warning:", netErr);
      }

      // Step C: Asynchronous Non-Blocking MySQL Persistence (Background)
      const persistCall = isApplicant
        ? interviewService.storePublicTranscript(interviewId, trimmed, role, 0, speechLang)
        : interviewService.storeTranscript(interviewId, trimmed, role, 0, speechLang);

      persistCall.catch((e) => console.warn("Background persistence notice:", e));
    },
    [interviewId, isApplicant, speechLang, onLiveSegmentProduced, broadcastData]
  );

  // Stable reference for processFinalSegment to prevent dependency re-triggers
  const processFinalSegmentRef = useRef(processFinalSegment);
  useEffect(() => {
    processFinalSegmentRef.current = processFinalSegment;
  }, [processFinalSegment]);

  // 4. Local Participant Speech Recognition (Web Speech API)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition || !interviewId) return;

    let isMounted = true;
    let restartTimer = null;

    const myRole = isApplicant ? "applicant" : "hr";
    const myIdentity = localParticipant?.identity || (isApplicant ? "applicant" : "hr");

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLang || "fil-PH";

      recognition.onstart = () => {
        isRecognizingRef.current = true;
      };

      recognition.onerror = (event) => {
        if (event.error !== "network" && event.error !== "no-speech") {
          console.warn("Local speech recognition notice:", event.error);
        }
        isRecognizingRef.current = false;
      };

      recognition.onend = () => {
        isRecognizingRef.current = false;
        if (!isMounted) return;

        if (restartTimer) clearTimeout(restartTimer);
        restartTimer = setTimeout(() => {
          if (isMounted && !isRecognizingRef.current) {
            try {
              recognition.start();
            } catch (e) {}
          }
        }, 500);
      };

      recognition.onresult = (event) => {
        let interimText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            console.log(`[STT EVENT FINAL] (${myRole}): "${text}"`);
            processFinalSegmentRef.current(text, myRole, myIdentity);
            if (setInterimSpeech) setInterimSpeech("");
          } else {
            interimText += text;
          }
        }
        if (interimText) {
          console.log(`[STT EVENT INTERIM] (${myRole}): "${interimText}"`);
          if (setInterimSpeech) setInterimSpeech(interimText);
          broadcastData({ type: "INTERIM_SPEECH", speaker_role: myRole, text: interimText });
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.warn("Speech recognition initialization error:", e);
    }

    return () => {
      isMounted = false;
      isRecognizingRef.current = false;
      if (restartTimer) clearTimeout(restartTimer);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [interviewId, isApplicant, speechLang, localParticipant, setInterimSpeech, broadcastData]);

  return null;
}

// ── Applicant Layout (Matching Image 1) ──────────────────────────────────────

function ZoomApplicantLayout({ interviewId, applicantName, onHangup, endingSession }) {
  const metricsRef = useRef([]);
  const isFlushingRef = useRef(false);
  const latestComputedMetricsRef = useRef(null);
  const [speechLang, setSpeechLang] = useState("fil-PH");

  // Flush accumulated MediaPipe metrics to backend
  const flushMetrics = useCallback(async () => {
    if (!interviewId || isFlushingRef.current || metricsRef.current.length === 0) {
      return;
    }

    isFlushingRef.current = true;
    const itemsToSend = [...metricsRef.current];
    const sendCount = itemsToSend.length;

    // Calculate affect summary
    const detected = itemsToSend.filter((s) => s.faceDetected);
    const dCount = detected.length;
    let affectSummary = null;
    if (dCount > 0) {
      const avgAtt = Math.round(detected.reduce((a, b) => a + (b.attentiveScore || 0), 0) / dCount);
      const avgComp = Math.round(detected.reduce((a, b) => a + (b.composedScore || 0), 0) / dCount);
      const avgVal = Math.round(detected.reduce((a, b) => a + (b.valence || 50), 0) / dCount);
      const avgBlink = Math.round(detected.reduce((a, b) => a + (b.blinkStress || 0), 0) / dCount);
      const eyeCount = detected.filter((s) => (s.eyeOpenness || 0) >= 0.22).length;
      const eyeRatio = Math.round((eyeCount / dCount) * 100);

      affectSummary = {
        avg_attentiveness: avgAtt,
        avg_composure: avgComp,
        facial_valence: avgVal,
        blink_stress_index: avgBlink,
        eye_contact_ratio: eyeRatio,
      };
    }

    try {
      await interviewService.savePublicBehavioralMetrics(interviewId, itemsToSend, affectSummary);
      // Clear only the metrics that were successfully persisted
      metricsRef.current = metricsRef.current.slice(sendCount);
    } catch (err) {
      console.warn("MediaPipe periodic metrics flush notice:", err?.message || err);
    } finally {
      isFlushingRef.current = false;
    }
  }, [interviewId]);

  // Sample locally every 3s, flush to backend every 15s
  useEffect(() => {
    const sampleInterval = setInterval(() => {
      const latest = latestComputedMetricsRef.current;
      if (latest && latest.faceDetected) {
        metricsRef.current.push({
          timestamp: Math.floor(Date.now() / 1000),
          faceDetected: true,
          eyeOpenness: parseFloat((latest.ear || 0).toFixed(4)),
          mouthMovement: parseFloat((latest.smile || 0).toFixed(4)),
          headYaw: parseFloat((latest.yaw || 0).toFixed(4)),
          headPitch: parseFloat((latest.pitch || 0).toFixed(4)),
          headRoll: parseFloat((latest.roll || 0).toFixed(4)),
          composedScore: latest.composedScore || 0,
          engagedScore: latest.engagedScore || 0,
          attentiveScore: latest.attentiveScore || 0,
          valence: latest.valence || 50,
          arousal: latest.arousal || 50,
          blinkStress: latest.blinkStress || 0,
        });
      } else {
        // Face not detected in this interval
        metricsRef.current.push({
          timestamp: Math.floor(Date.now() / 1000),
          faceDetected: false,
          eyeOpenness: 0,
          mouthMovement: 0,
          headYaw: 0,
          headPitch: 0,
          headRoll: 0,
          composedScore: 0,
          engagedScore: 0,
          attentiveScore: 0,
          valence: 50,
          arousal: 50,
          blinkStress: 0,
        });
      }
    }, 3000);

    const flushInterval = setInterval(() => {
      flushMetrics();
    }, 15000);

    return () => {
      clearInterval(sampleInterval);
      clearInterval(flushInterval);
    };
  }, [flushMetrics]);

  // Final flush during candidate hangup/exit
  const handleApplicantHangup = useCallback(async () => {
    await flushMetrics();
    onHangup();
  }, [flushMetrics, onHangup]);

  return (
    <div className="h-screen w-screen bg-[#111723] flex flex-col justify-between p-4 overflow-hidden">
      <TwoWayTranscriptionManager
        interviewId={interviewId}
        isApplicant={true}
        speechLang={speechLang}
      />
      <div className="flex-1 w-full max-w-[1400px] mx-auto h-full py-2">
        <ZoomVideoStage
          applicantName={applicantName}
          onHangup={handleApplicantHangup}
          isApplicant={true}
          endingSession={endingSession}
          onMetricsComputed={(metrics) => {
            latestComputedMetricsRef.current = metrics;
          }}
        />
      </div>
    </div>
  );
}

// ── Interviewer Dashboard Layout (Matching Image 2) ──────────────────────────

function ZoomInterviewerLayout({ interviewId, applicantName, jobTitle, onHangup, endingSession }) {
  const [activeTab, setActiveTab]   = useState("ai_analysis");
  const [notes, setNotes]           = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState("Recording initialization...");
  const [speechLang, setSpeechLang] = useState("fil-PH");
  const [liveTranscripts, setLiveTranscripts] = useState([]);

  const [liveMetrics, setLiveMetrics] = useState({
    confidence_score: 85,
    enthusiasm_score: 75,
    calmness_score: 82,
    valence_score: 80,
    keywords: ["COMMUNICATION SKILLS", "LEADERSHIP", "ACTIVE LISTENING", "SCALABILITY", "PROBLEM SOLVING"],
    overall_match: 84,
  });

  const handleMetricsComputed = useCallback((metrics) => {
    if (!metrics.faceDetected) return;
    setLiveMetrics((prev) => ({
      ...prev,
      confidence_score: metrics.composedScore || prev.confidence_score,
      enthusiasm_score: metrics.engagedScore || prev.enthusiasm_score,
      calmness_score: metrics.attentiveScore || prev.calmness_score,
      valence_score: metrics.valence || prev.valence_score,
    }));
  }, []);

  const handleLiveSegmentProduced = useCallback((seg) => {
    if (!seg || !seg.text) return;
    setLiveTranscripts((prev) => {
      const exists = prev.some((p) => p.id === seg.id || (p.text === seg.text && Math.abs((p.timestamp || 0) - (seg.timestamp || 0)) < 3000));
      if (exists) return prev;
      return [...prev, seg];
    });
  }, []);

  // Poll backend for actual Egress recording status to prevent false UI claims
  useEffect(() => {
    let active = true;

    const fetchStatus = () => {
      interviewService.getProcessingStatus(interviewId)
        .then(({ data }) => {
          if (!active) return;
          if (data && data.recording) {
            if (data.recording === 'recording') {
              setRecordingStatus("Recording Active");
            } else if (data.recording === 'completed') {
              setRecordingStatus("Recording Completed");
            } else if (data.recording === 'failed') {
              setRecordingStatus("Recording Failed");
            } else {
              setRecordingStatus("Waiting for Egress");
            }
          }
        })
        .catch(() => {
          if (active) setRecordingStatus("Recording initialization...");
        });
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 6000); // poll every 6s

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [interviewId]);

  // Handle Notes Auto-save
  const handleNotesChange = (text) => {
    setNotes(text);
    setSavingNotes(true);
    interviewService.saveNotes(interviewId, text)
      .finally(() => setSavingNotes(false));
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 p-6 font-sans">
      <TwoWayTranscriptionManager
        interviewId={interviewId}
        isApplicant={false}
        speechLang={speechLang}
        onLiveSegmentProduced={handleLiveSegmentProduced}
      />
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ── Left Column: Video Stage + Analytics (8 Cols) ──────────────── */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Zoom Video Stage */}
          <div className="h-[460px] w-full">
            <ZoomVideoStage
              applicantName={applicantName}
              onHangup={onHangup}
              isApplicant={false}
              endingSession={endingSession}
              speechLang={speechLang}
              setSpeechLang={setSpeechLang}
              onMetricsComputed={handleMetricsComputed}
            />
          </div>

          {/* 3 Analytics Cards (Matching Image 2) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Card 1: Live Sentiment */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                  🧠 SESSION METRICS
                </span>
                <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  ● LIVE RECORDING
                </span>
              </div>
              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    <span>COMPOSURE INDEX</span>
                    <span>{liveMetrics.confidence_score}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${liveMetrics.confidence_score}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    <span>POSITIVE AFFECT (VALENCE)</span>
                    <span>{liveMetrics.valence_score || liveMetrics.enthusiasm_score}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${liveMetrics.valence_score || liveMetrics.enthusiasm_score}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    <span>ATTENTIVENESS</span>
                    <span>{liveMetrics.calmness_score}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full transition-all duration-500" style={{ width: `${liveMetrics.calmness_score}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Position Requirements */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                  🏷️ CORE SKILLS EVALUATED
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(liveMetrics.keywords || [
                  "COMMUNICATION SKILLS",
                  "LEADERSHIP",
                  "ACTIVE LISTENING",
                  "SCALABILITY",
                  "PROBLEM SOLVING",
                ]).map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600 uppercase tracking-wide shadow-2xs"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* Card 3: AI Match Score */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-[6px] border-indigo-600 bg-indigo-50/30">
                <span className="text-3xl font-extrabold text-slate-800">{liveMetrics.overall_match}%</span>
              </div>
              <span className="mt-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                REQUIREMENT MATCH
              </span>
            </div>

          </div>

        </div>

        {/* ── Right Column: Sidebar (4 Cols) ────────────────────────────── */}
        <div className="lg:col-span-4 flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm min-h-[660px]">
          <div>
            
            {/* Header */}
            <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-slate-500">
                <UserIcon className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                  Interview Session
                </h3>
                <p className="text-xs font-medium text-slate-400">
                  {jobTitle || "Senior Dev Role"}
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-2 gap-1 mb-6">
              {[
                { id: "ai_analysis", label: "Recording Status", icon: "🎙️" },
                { id: "transcripts", label: "Live Transcripts", icon: "💬" },
                { id: "notes",       label: "Notes",            icon: "📝" },
                { id: "scorecard",   label: "Scorecard",        icon: "📋" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer",
                    activeTab === tab.id
                      ? "bg-blue-50/90 text-blue-700 shadow-sm"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  )}
                >
                  <span className="text-sm">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content: Recording Status */}
            {activeTab === "ai_analysis" && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                {recordingStatus === "Recording Active" && (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 text-center shadow-2xs">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xl mx-auto mb-3 animate-pulse">
                      🎙️
                    </span>
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1">
                      Recording Active
                    </h4>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      The session audio is being recorded in the background via LiveKit Egress. Transcript, speech metrics, and AI evaluation report will be generated after the session ends.
                    </p>
                  </div>
                )}

                {recordingStatus === "Recording Completed" && (
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 text-center shadow-2xs">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xl mx-auto mb-3">
                      ✅
                    </span>
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1">
                      Recording Saved
                    </h4>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      The session audio recording has completed successfully and has been saved to remote cloud storage.
                    </p>
                  </div>
                )}

                {recordingStatus === "Recording Failed" && (
                  <div className="rounded-2xl border border-red-100 bg-red-50/70 p-5 text-center shadow-2xs">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 text-xl mx-auto mb-3">
                      ⚠️
                    </span>
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1">
                      Recording Failed
                    </h4>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Failed to initiate LiveKit Egress recording for this session. Please check connection.
                    </p>
                  </div>
                )}

                {(recordingStatus === "Waiting for Egress" || recordingStatus === "Recording initialization...") && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center shadow-2xs animate-pulse">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-slate-500 text-xl mx-auto mb-3">
                      ⏳
                    </span>
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1">
                      Recording Initialization...
                    </h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Connecting to LiveKit Egress to initiate background recording. Waiting for candidate streams...
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab Content: Live Transcripts */}
            {activeTab === "transcripts" && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    REAL-TIME TRANSCRIPT STREAM
                  </span>
                  <span className="text-[9px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">
                    {liveTranscripts.length} segments
                  </span>
                </div>
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {liveTranscripts.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">Speaking will display live speech recognition here…</p>
                  ) : (
                    liveTranscripts.map((t, idx) => (
                      <div key={t.id || idx} className="text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex justify-between items-center mb-1">
                          <span className={cn("font-bold text-[10px] uppercase", t.speaker_role === "hr" ? "text-blue-600" : "text-emerald-600")}>
                            {t.speaker_role === "hr" ? "HR Interviewer" : applicantName}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">{t.time || ""}</span>
                        </div>
                        <p className="text-slate-700">{t.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab Content: Notes */}
            {activeTab === "notes" && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    INTERVIEWER EVALUATION NOTES
                  </span>
                  {savingNotes && (
                    <span className="text-[10px] text-blue-500 font-semibold animate-pulse">Saving…</span>
                  )}
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Type candidate evaluation notes here (auto-saved)…"
                  className="w-full h-44 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-sans"
                />
              </div>
            )}

            {/* Tab Content: Scorecard */}
            {activeTab === "scorecard" && (
              <div className="pt-2 border-t border-slate-100 space-y-3 text-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  CANDIDATE RATING RUBRIC
                </span>
                {[
                  { name: "Technical Competency", score: "★★★★☆" },
                  { name: "Communication Skills", score: "★★★★★" },
                  { name: "Problem Solving",     score: "★★★★☆" },
                  { name: "Cultural Alignment",   score: "★★★★★" },
                ].map((item) => (
                  <div key={item.name} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-2xs">
                    <span className="font-semibold text-slate-700">{item.name}</span>
                    <span className="text-amber-500 font-bold text-sm tracking-widest">{item.score}</span>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Bottom Action: End Interview Button */}
          <div className="pt-4 mt-6 border-t border-slate-100">
            <button
              onClick={onHangup}
              disabled={endingSession}
              className="w-full rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 disabled:opacity-60 py-3.5 text-sm font-bold text-red-600 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              {endingSession ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                  Ending Session & Generating AI Report...
                </>
              ) : (
                "End Interview & Generate AI Report"
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────────────────────

// ── Candidate LiveKit Layout Wrapper ─────────────────────────────────────────

function CandidateLayoutWrapper({
  candidateName = "Applicant",
  jobTitle = "Interview Candidate",
  onHangup,
}) {
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant?.() || {};
  const tracks = useTracks?.([
    { source: Track.Source.Camera, withPlaceholder: false },
  ]) || [];

  const localCameraTrack = tracks.find(
    (t) => t.source === Track.Source.Camera && t.participant?.isLocal
  ) || null;

  const toggleMic = useCallback(async () => {
    if (localParticipant) {
      try {
        await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
      } catch (e) {
        console.warn("Toggle mic notice:", e);
      }
    }
  }, [localParticipant, isMicrophoneEnabled]);

  const toggleCam = useCallback(async () => {
    if (localParticipant) {
      try {
        await localParticipant.setCameraEnabled(!isCameraEnabled);
      } catch (e) {
        console.warn("Toggle cam notice:", e);
      }
    }
  }, [localParticipant, isCameraEnabled]);

  return (
    <CandidateInterviewView
      candidateName={candidateName}
      jobTitle={jobTitle}
      localCameraTrack={localCameraTrack}
      isMuted={!isMicrophoneEnabled}
      onToggleMute={toggleMic}
      isVideoOff={!isCameraEnabled}
      onToggleVideo={toggleCam}
      onLeaveCall={onHangup}
    />
  );
}

// ── Main Page Component ──────────────────────────────────────────────────────

export default function ActiveInterviewRoom({ isApplicant: isApplicantProp = false }) {
  const { id, sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const currentSessionId = sessionId || id || "session-demo";
  const queryRole = searchParams.get("role"); // "interviewer" | "candidate"

  // Role detection:
  // 1. Explicit prop (isApplicantProp)
  // 2. Query param (?role=candidate vs ?role=interviewer)
  // 3. User auth role: if user.role === "applicant" -> candidate; else if staff -> interviewer
  const isCandidate =
    isApplicantProp ||
    queryRole === "candidate" ||
    (queryRole !== "interviewer" && user?.role === "applicant");

  const [tokenData,       setTokenData]       = useState(null);  // { token, room_name, livekit_host }
  const [loadingToken,    setLoadingToken]    = useState(false);
  const [tokenError,      setTokenError]      = useState(null);
  const [demoMode,        setDemoMode]        = useState(false);
  const [consentGiven,    setConsentGiven]    = useState(false);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [endingSession,   setEndingSession]   = useState(false);

  const [interviewDetails, setInterviewDetails] = useState(null);
  const [dbTranscripts, setDbTranscripts]       = useState([]);

  // ── Fetch real interview record & transcripts from database ───────────────
  useEffect(() => {
    if (!currentSessionId || currentSessionId === "demo") return;

    // 1. Fetch real interview details
    interviewService
      .getById(currentSessionId)
      .then(({ data }) => {
        const item = data?.interview || data;
        if (item) setInterviewDetails(item);
      })
      .catch((err) => {
        console.debug("Notice: Could not load interview by ID:", err?.message || err);
      });

    // 2. Ensure live transcripts and metrics start clean for this new call session
    setDbTranscripts([]);
  }, [currentSessionId]);

  // ── Fetch LiveKit token ──────────────────────────────────────────────────
  useEffect(() => {
    // If explicit demo route or already in demo mode, skip remote token fetch
    if (currentSessionId === "demo" || demoMode) return;

    setLoadingToken(true);
    const fetchToken = isCandidate
      ? interviewService.getPublicLivekitToken(currentSessionId)
      : interviewService.getLivekitToken(currentSessionId);

    fetchToken
      .then(({ data }) => {
        setTokenData(data);
        if (data?.interview) setInterviewDetails(data.interview);
      })
      .catch((err) => {
        if (!isCandidate) {
          setTokenError(err.response?.data?.message ?? "LiveKit token gateway error. You may enter Interactive Preview mode.");
        }
      })
      .finally(() => setLoadingToken(false));
  }, [currentSessionId, isCandidate, demoMode]);

  // ── Handle applicant email check ──────────────────────────────────────────
  function handleApplicantVerify(email) {
    setLoadingToken(true);
    setTokenError(null);
    interviewService
      .getPublicLivekitToken(currentSessionId, email)
      .then(({ data }) => {
        setTokenData(data);
        if (data?.interview) setInterviewDetails(data.interview);
      })
      .catch((err) => {
        const msg = typeof err.response?.data?.message === "string"
          ? err.response.data.message
          : "The entered email address does not match the applicant record for this interview.";
        setTokenError(msg);
      })
      .finally(() => setLoadingToken(false));
  }

  // ── Session ended handler ────────────────────────────────────────────────
  const handleSessionEnded = useCallback(() => {
    if (endingSession) return;
    setEndingSession(true);

    if (isCandidate) {
      setSessionFinished(true);
      if (!demoMode) {
        interviewService.endPublicSession(currentSessionId).catch((e) => console.warn("endPublicSession notice:", e));
      }
    } else {
      setShowReportModal(true);
      if (!demoMode) {
        interviewService.endSession(currentSessionId).catch((e) => console.warn("endSession notice:", e));
      }
    }
  }, [currentSessionId, isCandidate, endingSession, demoMode]);

  // ── Exit handler ──────────────────────────────────────────────────────────
  function handleExit() {
    if (isCandidate) {
      navigate("/");
    } else {
      navigate("/admin/interviews");
    }
  }

  // ── Real applicant & interview data resolution ───────────────────────────
  const realApplicant =
    interviewDetails?.applicant ||
    tokenData?.applicant ||
    tokenData?.interview?.applicant;

  const applicantName = realApplicant
    ? (`${realApplicant.first_name || ""} ${realApplicant.last_name || ""}`.trim() ||
       realApplicant.name ||
       realApplicant.email ||
       "Applicant")
    : (tokenData?.applicant?.name || "Applicant");

  const jobTitle =
    interviewDetails?.job_posting?.job_library?.job_title ||
    interviewDetails?.applicant?.job_posting?.job_library?.job_title ||
    tokenData?.job_title ||
    "Interview Session";

  const fitScore = Math.round(
    realApplicant?.ai_evaluation?.ai_score ??
    realApplicant?.overall_score ??
    interviewDetails?.rating_score ??
    85
  );

  const strengths = realApplicant?.ai_evaluation?.skills_matched || [];
  const gaps = realApplicant?.ai_evaluation?.skills_missing || [];
  const initialNotes = interviewDetails?.evaluation_notes || "";

  // Dynamic context-aware questions from real applicant skills
  const dynamicQuestions = useMemo(() => {
    const questions = [];
    if (gaps && gaps.length > 0) {
      gaps.slice(0, 3).forEach((gap, idx) => {
        const gapName = typeof gap === "string" ? gap : JSON.stringify(gap);
        questions.push({
          id: `gap_${idx}`,
          question: `Can you walk us through your practical experience with ${gapName}, and how you adapt to workflows involving ${gapName}?`,
          gapContext: `Screened Gap: ${gapName}`,
        });
      });
    }

    if (strengths && strengths.length > 0 && questions.length < 3) {
      strengths.slice(0, 3 - questions.length).forEach((str, idx) => {
        const strName = typeof str === "string" ? str : JSON.stringify(str);
        questions.push({
          id: `str_${idx}`,
          question: `Your profile demonstrates strength in ${strName}. Can you share an example of a challenging task where you applied ${strName}?`,
          gapContext: `Screened Strength: ${strName}`,
        });
      });
    }

    if (questions.length === 0) {
      questions.push(
        {
          id: "q_core_1",
          question: `Can you walk us through your most relevant past projects for the ${jobTitle} role?`,
          gapContext: `Core Role Fit: ${jobTitle}`,
        },
        {
          id: "q_core_2",
          question: "How do you handle ambiguous requirements and unexpected operational bottlenecks?",
          gapContext: "Problem Solving",
        },
        {
          id: "q_core_3",
          question: "Describe your communication style when collaborating with department heads and team colleagues.",
          gapContext: "Team Collaboration",
        }
      );
    }
    return questions;
  }, [jobTitle, strengths, gaps]);

  // Real competencies matrix
  const competencies = useMemo(() => {
    const res = {};
    const combined = [...strengths, ...gaps];
    if (combined.length > 0) {
      combined.slice(0, 4).forEach((skill) => {
        const skillName = typeof skill === "string" ? skill : JSON.stringify(skill);
        res[skillName] = {
          checked: strengths.includes(skill),
          rating: strengths.includes(skill) ? 4 : 2,
        };
      });
    }
    const fallbacks = [jobTitle, "Problem Solving", "Professional Communication", "Task Execution"];
    fallbacks.forEach((f) => {
      if (Object.keys(res).length < 4 && !res[f]) {
        res[f] = { checked: true, rating: 3 };
      }
    });
    return res;
  }, [jobTitle, strengths, gaps]);

  // Real assigned panelists
  const realPanelists = useMemo(() => {
    const list = [
      {
        id: `panelist-${user?.id || "host"}`,
        name: user?.name ? `${user.name} (Host)` : "You (Host)",
        role: user?.role?.replace(/_/g, " ") || "Host Evaluator",
        avatar: (user?.name?.split(" ").map((w) => w[0]).join("") || "YR").slice(0, 2).toUpperCase(),
        isHost: true,
        isSpeaking: false,
        isMuted: false,
      },
    ];

    if (interviewDetails?.interviewer && interviewDetails.interviewer.id !== user?.id) {
      list.push({
        id: `panelist-${interviewDetails.interviewer.id}`,
        name: interviewDetails.interviewer.name,
        role: interviewDetails.interviewer.role?.replace(/_/g, " ") || "Assigned Interviewer",
        avatar: (interviewDetails.interviewer.name.split(" ").map((w) => w[0]).join("") || "IN").slice(0, 2).toUpperCase(),
        isHost: false,
        isSpeaking: false,
        isMuted: false,
      });
    } else {
      list.push(
        { id: "panelist-tech", name: "Technical Lead", role: "Department Evaluator", avatar: "TL", isHost: false, isSpeaking: false, isMuted: false },
        { id: "panelist-hr", name: "HR Department Rep", role: "Talent Ops", avatar: "HR", isHost: false, isSpeaking: false, isMuted: true }
      );
    }
    return list;
  }, [user, interviewDetails]);

  // ── Session finished screen (for applicants) ──────────────────────────────
  if (sessionFinished) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-800 font-sans">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white px-8 py-10 text-center shadow-xl">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-3xl mx-auto mb-4 border border-emerald-200">
            🎉
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 mb-2">Interview Completed</h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Thank you for attending your interview session! Your interview observations and responses have been logged. The HR recruitment team will review your session shortly.
          </p>
          <Button onClick={() => navigate("/")} className="bg-[#111A62] hover:bg-[#0d1550] text-white">Return to Home</Button>
        </div>
      </div>
    );
  }

  // ── Applicant Verification Form (if applicant and not verified yet and not in demo) ─────
  if (isCandidate && !tokenData && !demoMode) {
    return (
      <ApplicantVerificationForm
        onSubmit={handleApplicantVerify}
        loading={loadingToken}
        error={tokenError}
        onCancel={handleExit}
      />
    );
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loadingToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3 text-slate-800">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#F97316]" />
          <p className="text-sm font-semibold">Preparing interview session…</p>
        </div>
      </div>
    );
  }

  // ── Error state for HR (provides instant fallback to demo mode) ───────────
  if (tokenError && !demoMode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white px-6 py-8 text-center shadow-xl">
          <p className="text-4xl mb-3">⚠️</p>
          <h2 className="text-lg font-extrabold text-slate-900 mb-2">Session Notice</h2>
          <p className="text-xs text-red-700 mb-5 leading-relaxed">{tokenError}</p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setTokenError(null);
                setDemoMode(true);
                setConsentGiven(true);
              }}
              className="w-full rounded-xl bg-[#111A62] hover:bg-[#0d1550] text-white font-bold text-xs py-3 transition-colors cursor-pointer shadow-md"
            >
              Enter Interactive Preview Mode
            </button>
            <Button variant="outline" onClick={handleExit} className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs">
              ← Exit Session
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── DPA Consent gate ─────────────────────────────────────────────────────
  if (!consentGiven) {
    return (
      <div className="min-h-screen bg-slate-100">
        <DpaConsentModal
          onAccept={() => setConsentGiven(true)}
          onDecline={handleExit}
        />
      </div>
    );
  }

  // ── Demo / Preview Mode (Direct Rendering with Simulated WebRTC / Presence) ──
  if (demoMode || !tokenData) {
    return (
      <div className="min-h-screen w-full bg-slate-100">
        {isCandidate ? (
          <CandidateInterviewView
            candidateName={applicantName}
            jobTitle={jobTitle}
            panelists={realPanelists}
            onLeaveCall={handleSessionEnded}
          />
        ) : (
          <InterviewerRoomView
            interviewId={currentSessionId}
            applicantName={applicantName}
            jobTitle={jobTitle}
            fitScore={fitScore}
            currentUser={user}
            onEndCall={handleSessionEnded}
            onExportSummary={() => setShowReportModal(true)}
            FaceTrackingComponent={FaceTrackingVideo}
            strengths={strengths}
            gaps={gaps}
            dynamicQuestions={dynamicQuestions}
            initialCompetencies={competencies}
            initialPanelists={realPanelists}
            initialNotes={initialNotes}
            initialTranscripts={[]}
          />
        )}

        {/* AI Report Modal */}
        <InterviewReportModal
          isOpen={showReportModal}
          onClose={() => navigate("/admin/interviews")}
          interviewId={currentSessionId}
        />
      </div>
    );
  }

  // ── LiveKit Room (Production Connected Mode) ──────────────────────────────
  return (
    <LiveKitRoom
      token={tokenData.token}
      serverUrl={tokenData.livekit_host}
      connect={true}
      video={true}
      audio={true}
      style={{ minHeight: "100vh" }}
      data-lk-theme="default"
    >
      <RoomAudioRenderer />

      {isCandidate ? (
        <CandidateLayoutWrapper
          candidateName={applicantName}
          jobTitle={jobTitle}
          onHangup={handleSessionEnded}
        />
      ) : (
        <InterviewerRoomView
          interviewId={currentSessionId}
          applicantName={applicantName}
          jobTitle={jobTitle}
          fitScore={fitScore}
          currentUser={user}
          onEndCall={handleSessionEnded}
          onExportSummary={() => setShowReportModal(true)}
          FaceTrackingComponent={FaceTrackingVideo}
          strengths={strengths}
          gaps={gaps}
          dynamicQuestions={dynamicQuestions}
          initialCompetencies={competencies}
          initialPanelists={realPanelists}
          initialNotes={initialNotes}
          initialTranscripts={[]}
        />
      )}

      {/* AI Report Modal */}
      <InterviewReportModal
        isOpen={showReportModal}
        onClose={() => navigate("/admin/interviews")}
        interviewId={currentSessionId}
      />
    </LiveKitRoom>
  );
}


