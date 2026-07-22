/**
 * ActiveInterviewRoom.jsx
 * ────────────────────────
 * A full-screen LiveKit video interview room.
 *
 * Flow:
 *  1. Fetch LiveKit token from Laravel API (POST /interviews/:id/livekit-token)
 *  2. Show DPA Consent Modal — user must accept before joining
 *  3. Connect to LiveKit room using <LiveKitRoom>
 *  4. Render <VideoConference> with the default LiveKit UI
 *  5. On "End Interview" → POST /interviews/:id/end-session → navigate to report
 *
 * Route: /admin/interviews/:id/room  (HR Admin / Super Admin only)
 */
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  ControlBar,
  useMaybeRoomContext,
} from "@livekit/components-react";
import "@livekit/components-styles";

import { cn } from "../../utils/cn";
import Button from "../../components/ui/Button";
import interviewService from "../../services/interviewService";

// ── DPA Consent Modal ────────────────────────────────────────────────────────

function DpaConsentModal({ onAccept, onDecline }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
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

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm text-blue-900 leading-relaxed">
            <p className="font-bold mb-2">
              📋 Recording & AI Analysis Consent
            </p>
            <p>
              This interview session will be <strong>recorded</strong> and the
              transcript will be <strong>analyzed by AI</strong> to generate a
              post-interview evaluation report. Processing is conducted in
              compliance with the{" "}
              <strong>Data Privacy Act of 2012 (RA 10173)</strong> and ARTMS
              data governance policies.
            </p>
          </div>

          <ul className="space-y-2 text-sm text-slate-700">
            {[
              "Your audio and video will be transmitted via an encrypted LiveKit Cloud connection.",
              "Transcripts are stored securely and accessible only to authorized HR personnel.",
              "AI-generated reports are used exclusively for recruitment evaluation purposes.",
              "You may request access to or deletion of your data through the HR office.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-emerald-500">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 rounded-b-2xl border-t border-slate-100 bg-slate-50 px-6 py-4">
          <Button variant="outline" onClick={onDecline}>
            Decline &amp; Exit
          </Button>
          <Button onClick={onAccept}>
            I Understand &amp; Accept
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── End Interview Button (rendered inside the LiveKit room context) ───────────

function EndInterviewButton({ interviewId, onEnd }) {
  const [ending, setEnding] = useState(false);

  async function handleEnd() {
    if (!window.confirm("Are you sure you want to end this interview? The AI analysis report will be generated automatically.")) return;
    setEnding(true);
    try {
      await interviewService.endSession(interviewId);
      onEnd();
    } catch (e) {
      alert(e.response?.data?.message ?? "Failed to end session.");
      setEnding(false);
    }
  }

  return (
    <button
      onClick={handleEnd}
      disabled={ending}
      className="fixed bottom-6 right-6 z-[150] flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-red-700 disabled:opacity-60"
    >
      {ending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Ending…
        </>
      ) : (
        <>
          ⏹ End Interview
        </>
      )}
    </button>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function ActiveInterviewRoom() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [tokenData,      setTokenData]      = useState(null);  // { token, room_name, livekit_host }
  const [loadingToken,   setLoadingToken]   = useState(true);
  const [tokenError,     setTokenError]     = useState(null);
  const [consentGiven,   setConsentGiven]   = useState(false);
  const [roomConnected,  setRoomConnected]  = useState(false);

  // ── Fetch LiveKit token ──────────────────────────────────────────────────
  useEffect(() => {
    setLoadingToken(true);
    interviewService
      .getLivekitToken(id)
      .then(({ data }) => setTokenData(data))
      .catch((err) =>
        setTokenError(
          err.response?.data?.message ?? "Failed to fetch session token."
        )
      )
      .finally(() => setLoadingToken(false));
  }, [id]);

  // ── Session ended ────────────────────────────────────────────────────────
  const handleSessionEnded = useCallback(() => {
    navigate(`/admin/interviews/${id}/report`);
  }, [id, navigate]);

  // ── Decline consent ──────────────────────────────────────────────────────
  function handleDecline() {
    navigate("/admin/interviews");
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

  // ── Error state ───────────────────────────────────────────────────────────
  if (tokenError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
        <div className="max-w-md rounded-2xl border border-red-500/30 bg-red-950/40 px-6 py-8 text-center">
          <p className="text-4xl mb-3">⚠️</p>
          <h2 className="text-lg font-extrabold text-white mb-2">
            Could not start session
          </h2>
          <p className="text-sm text-red-300 mb-5">{tokenError}</p>
          <Button variant="outline" onClick={() => navigate("/admin/interviews")}>
            ← Back to Interviews
          </Button>
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
          onDecline={handleDecline}
        />
      </div>
    );
  }

  // ── LiveKit Room ─────────────────────────────────────────────────────────
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950">

      {/* Back / status bar */}
      <div className="absolute left-0 right-0 top-0 z-[100] flex items-center justify-between bg-slate-950/80 px-4 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className={cn(
            "h-2 w-2 rounded-full",
            roomConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
          )} />
          <span className="text-xs font-semibold text-white/80">
            {roomConnected ? "Live" : "Connecting…"}
          </span>
        </div>
        <p className="text-xs font-bold tracking-widest text-white/60 uppercase">
          ARTMS — Interview Session
        </p>
        <button
          onClick={() => navigate("/admin/interviews")}
          className="rounded-lg px-3 py-1 text-xs font-semibold text-white/60 hover:text-white transition"
        >
          ← Exit
        </button>
      </div>

      {/* LiveKit room wrapper */}
      <LiveKitRoom
        token={tokenData.token}
        serverUrl={tokenData.livekit_host}
        connect={true}
        video={true}
        audio={true}
        onConnected={() => setRoomConnected(true)}
        onDisconnected={() => setRoomConnected(false)}
        style={{ height: "100vh" }}
        data-lk-theme="default"
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>

      {/* End Interview button — floats above the video UI */}
      <EndInterviewButton
        interviewId={Number(id)}
        onEnd={handleSessionEnded}
      />
    </div>
  );
}
