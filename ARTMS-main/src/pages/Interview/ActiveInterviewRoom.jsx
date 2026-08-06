/**
 * ActiveInterviewRoom.jsx
 * ────────────────────────
 * Zoom-style LiveKit video conferencing UI for ARTMS.
 *
 * - Applicant View: Full-screen Zoom call layout (matching Image 1)
 * - Interviewer View: Zoom stage + Live Sentiment/Keywords/AI Match Score analytics + Sidebar (matching Image 2)
 */
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  useLocalParticipant,
  VideoTrack,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";

import { cn } from "../../utils/cn";
import { Globe } from "lucide-react";
import Button from "../../components/ui/Button";
import interviewService from "../../services/interviewService";
import InterviewReportModal from "../../modals/InterviewReportModal";

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

// ── Zoom Video Stage Component (Shared between Applicant & Interviewer) ─────

function ZoomVideoStage({ applicantName, onHangup, isApplicant, latestCaption, speechLang, setSpeechLang }) {
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
          <VideoTrack trackRef={remoteCameraTrack} className="h-full w-full object-cover" />
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

        {/* Local Participant Picture-in-Picture (Top Right) */}
        <div className="absolute top-4 right-4 z-30 h-36 w-48 overflow-hidden rounded-xl border-2 border-slate-700 bg-slate-900 shadow-2xl transition-all hover:scale-105">
          {isLocalVideoActive ? (
            <VideoTrack trackRef={localCameraTrack} className="h-full w-full object-cover" />
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
        
        {/* Speech Dialect / Language Selector */}
        {setSpeechLang && (
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
          className="flex h-11 w-12 items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transition-all"
          title="End Call"
        >
          <HangupIcon />
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

// ── Applicant Layout (Matching Image 1) ──────────────────────────────────────

function ZoomApplicantLayout({ interviewId, applicantName, onHangup }) {
  const [speechLang, setSpeechLang] = useState("fil-PH");
  const recognitionRef = useRef(null);

  // Web Speech API for Applicant Speech Transcription
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition || !interviewId) return;

    let isMounted = true;
    let restartTimer = null;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLang;

      recognition.onstart = () => {
        console.log("Applicant speech recognition started", { speechLang });
      };

      recognition.onerror = (event) => {
        console.warn("Applicant speech recognition error:", event.error);
        if (!isMounted) return;
        if (restartTimer) clearTimeout(restartTimer);
        restartTimer = setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {}
        }, 400);
      };

      recognition.onend = () => {
        if (!isMounted) return;
        if (restartTimer) clearTimeout(restartTimer);
        restartTimer = setTimeout(() => {
          try { recognition.start(); } catch (e) {}
        }, 400);
      };

      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const text = event.results[i][0].transcript;
            if (text && text.trim().length > 0) {
              console.log("Applicant spoke:", text.trim());
              interviewService.storePublicTranscript(interviewId, text.trim())
                .then(() => console.log("Applicant transcript successfully saved to DB"))
                .catch((err) => console.error("Failed to store applicant transcript:", err));
            }
          }
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error("Failed to initialize applicant speech recognition:", e);
    }

    return () => {
      isMounted = false;
      if (restartTimer) clearTimeout(restartTimer);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, [interviewId, speechLang]);

  return (
    <div className="h-screen w-screen bg-[#111723] flex flex-col justify-between p-4 overflow-hidden">
      <div className="flex-1 w-full max-w-[1400px] mx-auto h-full py-2">
        <ZoomVideoStage
          applicantName={applicantName}
          onHangup={onHangup}
          isApplicant={true}
          speechLang={speechLang}
          setSpeechLang={setSpeechLang}
        />
      </div>
    </div>
  );
}

// ── Interviewer Dashboard Layout (Matching Image 2) ──────────────────────────

function ZoomInterviewerLayout({ interviewId, applicantName, jobTitle, onHangup }) {
  const [activeTab, setActiveTab]   = useState("ai_analysis");
  const [notes, setNotes]           = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [transcripts, setTranscripts] = useState([]);
  const [interimSpeech, setInterimSpeech] = useState("");
  const [manualInput, setManualInput]   = useState("");
  const [manualRole, setManualRole]     = useState("applicant");
  const [isListening, setIsListening]   = useState(false);
  const [speechLang, setSpeechLang]     = useState("fil-PH");

  const [liveMetrics, setLiveMetrics] = useState({
    confidence_score: 85,
    enthusiasm_score: 75,
    calmness_score: 82,
    keywords: ["COMMUNICATION SKILLS", "LEADERSHIP", "ACTIVE LISTENING", "SCALABILITY", "PROBLEM SOLVING"],
    overall_match: 84,
  });

  const recognitionRef = useRef(null);
  const transcriptScrollRef = useRef(null);

  // 1. Initial fetch of stored transcripts
  useEffect(() => {
    if (!interviewId) return;
    interviewService.getTranscripts(interviewId)
      .then(({ data }) => {
        if (data?.transcripts) {
          setTranscripts(data.transcripts);
        }
      })
      .catch(() => {});
  }, [interviewId]);

  // 2. Web Speech API for HR Speech Transcription
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition || !interviewId) return;

    let isMounted = true;
    let restartTimer = null;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLang;

      recognition.onstart = () => {
        if (isMounted) setIsListening(true);
      };

      recognition.onerror = (event) => {
        console.warn("HR speech recognition error:", event.error);
        if (!isMounted) return;
        if (restartTimer) clearTimeout(restartTimer);
        restartTimer = setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {}
        }, 400);
      };

      recognition.onend = () => {
        if (!isMounted) return;
        setIsListening(false);
        if (restartTimer) clearTimeout(restartTimer);
        restartTimer = setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {}
        }, 400);
      };

      recognition.onresult = (event) => {
        let currentInterim = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptText = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            if (transcriptText && transcriptText.trim().length > 0) {
              const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const newSegment = {
                speaker_role: "hr",
                text: transcriptText.trim(),
                time: timeStr,
                created_at: new Date().toISOString(),
              };

              setTranscripts((prev) => [...prev, newSegment]);
              setInterimSpeech("");

              // Save transcript to backend DB automatically tagged as HR
              interviewService.storeTranscript(interviewId, transcriptText.trim(), "hr");

              // Trigger Grok AI live analysis update
              interviewService.analyzeLive(interviewId)
                .then(({ data }) => {
                  if (data && data.confidence_score) setLiveMetrics(data);
                })
                .catch(() => {});
            }
          } else {
            currentInterim += transcriptText;
          }
        }
        if (isMounted) setInterimSpeech(currentInterim);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {}

    return () => {
      isMounted = false;
      if (restartTimer) clearTimeout(restartTimer);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, [interviewId, speechLang]);

  // 3. Fast 3-second live sync polling for new transcripts & Grok AI updates
  useEffect(() => {
    if (!interviewId) return;
    const interval = setInterval(() => {
      interviewService.getTranscripts(interviewId)
        .then(({ data }) => {
          if (data?.transcripts) {
            setTranscripts(data.transcripts);
          }
        })
        .catch(() => {});

      interviewService.analyzeLive(interviewId)
        .then(({ data }) => {
          if (data && data.confidence_score) setLiveMetrics(data);
        })
        .catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, [interviewId]);

  // Auto-scroll transcript container
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [transcripts, interimSpeech]);

  // Handle Notes Auto-save
  const handleNotesChange = (text) => {
    setNotes(text);
    setSavingNotes(true);
    interviewService.saveNotes(interviewId, text)
      .finally(() => setSavingNotes(false));
  };

  // Handle Manual Speech / Transcript Submit
  const handleSendManualTranscript = (e) => {
    e.preventDefault();
    if (!manualInput || manualInput.trim().length === 0) return;

    const text = manualInput.trim();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newSegment = {
      speaker_role: manualRole,
      text,
      time: timeStr,
      created_at: new Date().toISOString(),
    };

    setTranscripts((prev) => [...prev, newSegment]);
    setManualInput("");

    // Store to DB
    if (manualRole === "hr") {
      interviewService.storeTranscript(interviewId, text, "hr");
    } else {
      interviewService.storePublicTranscript(interviewId, text);
    }

    // Trigger Grok AI analysis
    interviewService.analyzeLive(interviewId)
      .then(({ data }) => {
        if (data && data.confidence_score) setLiveMetrics(data);
      })
      .catch(() => {});
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 p-6 font-sans">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ── Left Column: Video Stage + Analytics (8 Cols) ──────────────── */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Zoom Video Stage */}
          <div className="h-[460px] w-full">
            <ZoomVideoStage
              applicantName={applicantName}
              onHangup={onHangup}
              isApplicant={false}
              speechLang={speechLang}
              setSpeechLang={setSpeechLang}
              latestCaption={transcripts[transcripts.length - 1] || (interimSpeech ? { speaker_role: 'hr', text: interimSpeech } : null)}
            />
          </div>

          {/* 3 Analytics Cards (Matching Image 2) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Card 1: Live Sentiment */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                  🧠 LIVE SENTIMENT
                </span>
                <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  xAI Grok + MediaPipe
                </span>
              </div>
              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    <span>CONFIDENCE</span>
                    <span>{liveMetrics.confidence_score}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${liveMetrics.confidence_score}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    <span>ENTHUSIASM</span>
                    <span>{liveMetrics.enthusiasm_score}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width: `${liveMetrics.enthusiasm_score}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    <span>CALMNESS</span>
                    <span>{liveMetrics.calmness_score}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full transition-all duration-500" style={{ width: `${liveMetrics.calmness_score}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Keywords Detected */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                  🏷️ KEYWORDS DETECTED
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
                AI MATCH SCORE
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
            <div className="space-y-1 mb-6">
              {[
                { id: "ai_analysis", label: "AI Analysis", icon: "🧠" },
                { id: "transcript",  label: "Transcript",  icon: "📄" },
                { id: "notes",       label: "Notes",       icon: "📝" },
                { id: "scorecard",   label: "Scorecard",   icon: "📋" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
                    activeTab === tab.id
                      ? "bg-blue-50/90 text-blue-700 shadow-sm"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  )}
                >
                  <span className="text-base">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content: Live Transcript */}
            {(activeTab === "ai_analysis" || activeTab === "transcript") && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    LIVE SPEECH TRANSCRIPT
                  </span>
                  <span className={cn(
                    "flex items-center gap-1.5 text-[10px] font-extrabold px-2 py-0.5 rounded-full border",
                    isListening
                      ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                      : "text-amber-600 bg-amber-50 border-amber-200"
                  )}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", isListening ? "bg-emerald-500 animate-ping" : "bg-amber-500")} />
                    {isListening ? "MIC LISTENING" : "SPEECH ENGINE READY"}
                  </span>
                </div>

                <div ref={transcriptScrollRef} className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1">
                  {transcripts.length === 0 && !interimSpeech ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center">
                      <p className="text-xs text-slate-400 font-medium">
                        No speech recorded yet. Speak into your microphone or use the quick input below to add transcript lines.
                      </p>
                    </div>
                  ) : (
                    transcripts.map((t, idx) => (
                      <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 shadow-2xs">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          <span className={cn(t.speaker_role === "hr" ? "text-blue-600" : "text-emerald-600")}>
                            {t.speaker_role === "hr" ? "INTERVIEWER (HR)" : "APPLICANT"}
                          </span>
                          <span className="text-slate-400 font-normal">
                            {t.time || new Date(t.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-sans">{t.text}</p>
                      </div>
                    ))
                  )}

                  {/* Real-time Interim Speech Preview */}
                  {interimSpeech && (
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3 animate-pulse">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                        SPEAKING NOW…
                      </span>
                      <p className="text-xs text-indigo-900 italic mt-0.5">{interimSpeech}</p>
                    </div>
                  )}
                </div>

                {/* Quick Dialogue Line Input */}
                <form onSubmit={handleSendManualTranscript} className="pt-2 flex items-center gap-2">
                  <select
                    value={manualRole}
                    onChange={(e) => setManualRole(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-[11px] font-bold text-slate-700 focus:bg-white focus:outline-none"
                  >
                    <option value="applicant">Applicant</option>
                    <option value="hr">HR</option>
                  </select>
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Type speech or candidate response…"
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-2 text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
                  >
                    Send
                  </button>
                </form>
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
                    <span className="text-[10px] text-blue-600 animate-pulse font-semibold">Saving…</span>
                  )}
                </div>
                <textarea
                  rows={8}
                  value={notes}
                  onChange={handleNotesChange}
                  placeholder="Type live candidate evaluation notes here… Changes save automatically."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
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
              className="w-full rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 py-3.5 text-sm font-bold text-red-600 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              End Interview & Generate AI Report
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────────────────────

export default function ActiveInterviewRoom({ isApplicant = false }) {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [tokenData,       setTokenData]       = useState(null);  // { token, room_name, livekit_host }
  const [loadingToken,    setLoadingToken]    = useState(false);
  const [tokenError,      setTokenError]      = useState(null);
  const [consentGiven,    setConsentGiven]    = useState(false);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // ── Fetch LiveKit token ──────────────────────────────────────────────────
  useEffect(() => {
    setLoadingToken(true);
    const fetchToken = isApplicant
      ? interviewService.getPublicLivekitToken(id)
      : interviewService.getLivekitToken(id);

    fetchToken
      .then(({ data }) => setTokenData(data))
      .catch((err) => {
        if (!isApplicant) {
          setTokenError(err.response?.data?.message ?? "Failed to fetch session token.");
        }
      })
      .finally(() => setLoadingToken(false));
  }, [id, isApplicant]);

  // ── Handle applicant email check ──────────────────────────────────────────
  function handleApplicantVerify(email) {
    setLoadingToken(true);
    setTokenError(null);
    interviewService
      .getPublicLivekitToken(id, email)
      .then(({ data }) => setTokenData(data))
      .catch((err) => {
        const msg = typeof err.response?.data?.message === "string"
          ? err.response.data.message
          : "The entered email address does not match the applicant record for this interview.";
        setTokenError(msg);
      })
      .finally(() => setLoadingToken(false));
  }

  // ── Session ended handler ────────────────────────────────────────────────
  const handleSessionEnded = useCallback(async () => {
    try {
      if (isApplicant) {
        await interviewService.endPublicSession(id);
        setSessionFinished(true);
      } else {
        await interviewService.endSession(id);
        setShowReportModal(true);
      }
    } catch (e) {
      if (isApplicant) {
        setSessionFinished(true);
      } else {
        setShowReportModal(true);
      }
    }
  }, [id, isApplicant]);

  // ── Exit handler ──────────────────────────────────────────────────────────
  function handleExit() {
    if (isApplicant) {
      navigate("/");
    } else {
      navigate("/admin/interviews");
    }
  }

  // ── Session finished screen (for applicants) ──────────────────────────────
  if (sessionFinished) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white font-sans">
        <div className="max-w-md rounded-2xl border border-emerald-500/30 bg-slate-900 px-8 py-10 text-center shadow-2xl">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-3xl mx-auto mb-4">
            🎉
          </span>
          <h2 className="text-xl font-extrabold mb-2">Interview Completed</h2>
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            Thank you for attending your interview session! Your transcript and video feed have been processed. The HR recruitment team will review your session shortly.
          </p>
          <Button onClick={() => navigate("/")}>Return to Home</Button>
        </div>
      </div>
    );
  }

  // ── Applicant Verification Form (if applicant and not verified yet) ─────
  if (isApplicant && !tokenData) {
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
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-white">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          <p className="text-sm font-semibold">Preparing interview session…</p>
        </div>
      </div>
    );
  }

  // ── Error state for HR ────────────────────────────────────────────────────
  if (tokenError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
        <div className="max-w-md rounded-2xl border border-red-500/30 bg-red-950/40 px-6 py-8 text-center">
          <p className="text-4xl mb-3">⚠️</p>
          <h2 className="text-lg font-extrabold text-white mb-2">Could not start session</h2>
          <p className="text-sm text-red-300 mb-5">{tokenError}</p>
          <Button variant="outline" onClick={handleExit}>← Exit Session</Button>
        </div>
      </div>
    );
  }

  // ── DPA Consent gate ─────────────────────────────────────────────────────
  if (!consentGiven) {
    return (
      <div className="min-h-screen bg-slate-950">
        <DpaConsentModal
          onAccept={() => setConsentGiven(true)}
          onDecline={handleExit}
        />
      </div>
    );
  }

  const applicantName = tokenData?.applicant?.name || "Candidate_01";
  const jobTitle      = tokenData?.job_title || "Senior Dev Role";

  // ── LiveKit Room ─────────────────────────────────────────────────────────
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

      {isApplicant ? (
        <ZoomApplicantLayout
          interviewId={id}
          applicantName={applicantName}
          onHangup={handleSessionEnded}
        />
      ) : (
        <ZoomInterviewerLayout
          interviewId={id}
          applicantName={applicantName}
          jobTitle={jobTitle}
          onHangup={handleSessionEnded}
        />
      )}

      {/* AI Report Modal */}
      <InterviewReportModal
        isOpen={showReportModal}
        onClose={() => navigate("/admin/interviews")}
        interviewId={id}
      />
    </LiveKitRoom>
  );
}
