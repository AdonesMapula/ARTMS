/**
 * ActiveInterviewRoom.jsx
 * ────────────────────────
 * Zoom-style LiveKit video conferencing UI for ARTMS.
 *
 * - Applicant View: Full-screen Zoom call layout (matching Image 1)
 * - Interviewer View: Zoom stage + Live Sentiment/Keywords/AI Match Score analytics + Sidebar (matching Image 2)
 */
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  useLocalParticipant,
  VideoTrack,
  useParticipants,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";

import { cn } from "../../utils/cn";
import Button from "../../components/ui/Button";
import interviewService from "../../services/interviewService";

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
              <p className="text-xs text-slate-500">
                Required before joining the interview session
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm text-blue-900 leading-relaxed">
            <p className="font-bold mb-2">📋 Recording & AI Analysis Consent</p>
            <p>
              This interview session will be <strong>recorded</strong> and the transcript will be <strong>analyzed by AI</strong> to generate a post-interview evaluation report in compliance with the <strong>Data Privacy Act of 2012 (RA 10173)</strong>.
            </p>
          </div>

          <ul className="space-y-2 text-sm text-slate-700">
            {[
              "Your audio and video will be transmitted via an encrypted LiveKit Cloud connection.",
              "Transcripts are stored securely and accessible only to authorized HR personnel.",
              "AI-generated reports are used exclusively for recruitment evaluation purposes.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-emerald-500">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-end gap-3 rounded-b-2xl border-t border-slate-100 bg-slate-50 px-6 py-4">
          <Button variant="outline" onClick={onDecline}>Decline &amp; Exit</Button>
          <Button onClick={onAccept}>I Understand &amp; Accept</Button>
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

function ZoomVideoStage({ applicantName, onHangup, isApplicant }) {
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);
  const { localParticipant } = useLocalParticipant();

  const [isMicMuted, setIsMicMuted]       = useState(false);
  const [isCamMuted, setIsCamMuted]       = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Find remote and local tracks
  const remoteTrackRef = tracks.find((t) => !t.participant.isLocal);
  const localTrackRef  = tracks.find((t) => t.participant.isLocal);

  // Toggle Controls
  const toggleMic = useCallback(async () => {
    if (!localParticipant) return;
    const newState = !isMicMuted;
    await localParticipant.setMicrophoneEnabled(!newState);
    setIsMicMuted(newState);
  }, [localParticipant, isMicMuted]);

  const toggleCam = useCallback(async () => {
    if (!localParticipant) return;
    const newState = !isCamMuted;
    await localParticipant.setCameraEnabled(!newState);
    setIsCamMuted(newState);
  }, [localParticipant, isCamMuted]);

  const toggleScreen = useCallback(async () => {
    if (!localParticipant) return;
    const newState = !isScreenSharing;
    await localParticipant.setScreenShareEnabled(newState);
    setIsScreenSharing(newState);
  }, [localParticipant, isScreenSharing]);

  const remoteVideoActive = remoteTrackRef?.publication?.track && !remoteTrackRef?.publication?.isMuted;
  const localVideoActive  = localTrackRef?.publication?.track && !localTrackRef?.publication?.isMuted;

  return (
    <div className="relative flex flex-col h-full w-full bg-[#151c28] rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
      
      {/* ── Main Stage Area ──────────────────────────────────────────────── */}
      <div className="relative flex-1 flex items-center justify-center bg-[#131a26] overflow-hidden min-h-[360px]">
        
        {/* Main Remote Video or Avatar */}
        {remoteVideoActive ? (
          <VideoTrack trackRef={remoteTrackRef} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex h-36 w-36 items-center justify-center rounded-full bg-slate-100 shadow-2xl border-4 border-slate-700/50">
              <UserIcon className="w-20 h-20 text-slate-400" />
            </div>
            <div className="w-32 h-2.5 rounded-full bg-slate-800/80" />
          </div>
        )}

        {/* Floating Self-View PIP (Top Right) */}
        <div className="absolute top-4 right-4 z-30 w-44 h-32 md:w-52 md:h-36 rounded-xl bg-[#20293a] border border-slate-700/60 shadow-2xl overflow-hidden flex items-center justify-center">
          {localVideoActive ? (
            <VideoTrack trackRef={localTrackRef} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 shadow-md">
                <UserIcon className="w-8 h-8 text-slate-500" />
              </div>
              <div className="w-16 h-1.5 rounded-full bg-slate-700 mt-2" />
            </div>
          )}
          <div className="absolute bottom-2 right-2 z-10 text-slate-400">
            <svg className="w-3.5 h-3.5 opacity-60" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
            </svg>
          </div>
        </div>

        {/* Participant Name Badge (Bottom Left) */}
        <div className="absolute bottom-4 left-4 z-30 flex items-center gap-2 rounded-lg bg-slate-900/90 px-3.5 py-2 backdrop-blur-md border border-slate-800/80 shadow-md">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-white tracking-wide">
            Applicant: {applicantName || "Candidate_01"}
          </span>
        </div>
      </div>

      {/* ── Zoom Control Bar (Bottom) ────────────────────────────────────── */}
      <div className="h-16 bg-[#0b0f17] px-6 flex items-center justify-center gap-4 border-t border-slate-800/80 z-40">
        
        {/* Mic Toggle */}
        <button
          onClick={toggleMic}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full transition-all shadow-md",
            isMicMuted ? "bg-red-600 hover:bg-red-500" : "bg-slate-800 hover:bg-slate-700"
          )}
          title={isMicMuted ? "Unmute Microphone" : "Mute Microphone"}
        >
          <MicIcon muted={isMicMuted} />
        </button>

        {/* Camera Toggle */}
        <button
          onClick={toggleCam}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full transition-all shadow-md",
            isCamMuted ? "bg-red-600 hover:bg-red-500" : "bg-slate-800 hover:bg-slate-700"
          )}
          title={isCamMuted ? "Turn On Camera" : "Turn Off Camera"}
        >
          <CameraIcon muted={isCamMuted} />
        </button>

        {/* Screen Share Toggle */}
        <button
          onClick={toggleScreen}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full transition-all shadow-md",
            isScreenSharing ? "bg-emerald-600/80 hover:bg-emerald-500" : "bg-slate-800 hover:bg-slate-700"
          )}
          title="Share Screen"
        >
          <ScreenShareIcon active={isScreenSharing} />
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

function ZoomApplicantLayout({ applicantName, onHangup }) {
  return (
    <div className="h-screen w-screen bg-[#111723] flex flex-col justify-between p-4 overflow-hidden">
      <div className="flex-1 w-full max-w-[1400px] mx-auto h-full py-2">
        <ZoomVideoStage applicantName={applicantName} onHangup={onHangup} isApplicant={true} />
      </div>
    </div>
  );
}

// ── Interviewer Dashboard Layout (Matching Image 2) ──────────────────────────

function ZoomInterviewerLayout({ applicantName, jobTitle, onHangup }) {
  const [activeTab, setActiveTab] = useState("ai_analysis");

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 p-6 font-sans">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ── Left Column: Video Stage + Analytics (8 Cols) ──────────────── */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Zoom Video Stage */}
          <div className="h-[460px] w-full">
            <ZoomVideoStage applicantName={applicantName} onHangup={onHangup} isApplicant={false} />
          </div>

          {/* 3 Analytics Cards (Matching Image 2) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Card 1: Live Sentiment */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                  🧠 LIVE SENTIMENT
                </span>
              </div>
              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    <span>CONFIDENCE</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: "85%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    <span>ENTHUSIASM</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: "60%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    <span>CALMNESS</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full" style={{ width: "75%" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Keywords Detected */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                  🏷️ KEYWORDS DETECTED
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  "COMMUNICATION SKILLS",
                  "LEADERSHIP",
                  "ACTIVE LISTENING",
                  "SCALABILITY",
                  "CUSTOMER HANDLING",
                  "PROBLEM SOLVING",
                ].map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600 uppercase tracking-wide"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* Card 3: AI Match Score */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-[6px] border-indigo-600">
                <span className="text-3xl font-extrabold text-slate-800">78</span>
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
                { id: "live_stream", label: "Live Stream", icon: "📹" },
                { id: "ai_analysis", label: "AI Analysis", icon: "🧠" },
                { id: "scorecard",   label: "Scorecard",   icon: "📋" },
                { id: "notes",       label: "Notes",       icon: "📝" },
                { id: "transcript",  label: "Transcript",  icon: "📄" },
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

            {/* Tab Content: Recent Transcript */}
            {(activeTab === "ai_analysis" || activeTab === "transcript") && (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  RECENT TRANSCRIPT
                </span>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      <span>INTERVIEWER</span>
                      <span className="text-slate-400 font-normal">12:04</span>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2 w-full bg-slate-100 rounded-full" />
                      <div className="h-2 w-3/4 bg-slate-100 rounded-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      <span>APPLICANT</span>
                      <span className="text-slate-400 font-normal">12:05</span>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2 w-full bg-slate-100 rounded-full" />
                      <div className="h-2 w-5/6 bg-slate-100 rounded-full" />
                      <div className="h-2 w-2/3 bg-slate-100 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notes" && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  INTERVIEWER NOTES
                </span>
                <textarea
                  rows={6}
                  placeholder="Type live evaluation notes here…"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {activeTab === "scorecard" && (
              <div className="pt-2 border-t border-slate-100 space-y-3 text-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  QUICK RATING
                </span>
                {["Technical Competency", "Communication", "Problem Solving"].map((item) => (
                  <div key={item} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="font-semibold text-slate-700">{item}</span>
                    <span className="text-amber-500 font-bold">★★★★☆</span>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Bottom Action: End Interview Button */}
          <div className="pt-4 mt-6 border-t border-slate-100">
            <button
              onClick={onHangup}
              className="w-full rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 py-3.5 text-sm font-bold text-red-600 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              End Interview
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
        navigate(`/admin/interviews/${id}/report`);
      }
    } catch (e) {
      if (isApplicant) {
        setSessionFinished(true);
      } else {
        navigate(`/admin/interviews/${id}/report`);
      }
    }
  }, [id, navigate, isApplicant]);

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
          applicantName={applicantName}
          onHangup={handleSessionEnded}
        />
      ) : (
        <ZoomInterviewerLayout
          applicantName={applicantName}
          jobTitle={jobTitle}
          onHangup={handleSessionEnded}
        />
      )}
    </LiveKitRoom>
  );
}
