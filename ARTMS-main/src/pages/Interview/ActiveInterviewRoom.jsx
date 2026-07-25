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

function EndInterviewButton({ interviewId, isApplicant = false, onEnd }) {
  const [ending, setEnding] = useState(false);

  async function handleEnd() {
    if (!window.confirm("Are you sure you want to end this interview? The AI analysis report will be generated automatically.")) return;
    setEnding(true);
    try {
      if (isApplicant) {
        await interviewService.endPublicSession(interviewId);
      } else {
        await interviewService.endSession(interviewId);
      }
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

// ── Applicant Email Verification Form ───────────────────────────────────────

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
          Please enter your <strong>registered email address</strong> (used when submitting your application) to verify your identity for this interview session.
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

// ── Main Page ────────────────────────────────────────────────────────────────

export default function ActiveInterviewRoom({ isApplicant = false }) {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [tokenData,       setTokenData]       = useState(null);  // { token, room_name, livekit_host }
  const [loadingToken,    setLoadingToken]    = useState(false);
  const [tokenError,      setTokenError]      = useState(null);
  const [consentGiven,    setConsentGiven]    = useState(false);
  const [roomConnected,   setRoomConnected]   = useState(false);
  const [sessionFinished, setSessionFinished] = useState(false);

  // ── Fetch LiveKit token (auto-load) ──────────────────────────────────────
  useEffect(() => {
    setLoadingToken(true);
    const fetchToken = isApplicant
      ? interviewService.getPublicLivekitToken(id)
      : interviewService.getLivekitToken(id);

    fetchToken
      .then(({ data }) => setTokenData(data))
      .catch((err) => {
        // Soft catch for applicant verification form
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

  // ── Session ended ────────────────────────────────────────────────────────
  const handleSessionEnded = useCallback(() => {
    if (isApplicant) {
      setSessionFinished(true);
    } else {
      navigate(`/admin/interviews/${id}/report`);
    }
  }, [id, navigate, isApplicant]);

  // ── Decline consent / Exit ───────────────────────────────────────────────
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
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
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

  // ── Loading state for HR ──────────────────────────────────────────────────
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
          <h2 className="text-lg font-extrabold text-white mb-2">
            Could not start session
          </h2>
          <p className="text-sm text-red-300 mb-5">{tokenError}</p>
          <Button variant="outline" onClick={handleExit}>
            ← Exit Session
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
          onDecline={handleExit}
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
          ARTMS — {isApplicant ? "Applicant Video Interview" : "Interview Session"}
        </p>
        <button
          onClick={handleExit}
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
        isApplicant={isApplicant}
        onEnd={handleSessionEnded}
      />
    </div>
  );
}
