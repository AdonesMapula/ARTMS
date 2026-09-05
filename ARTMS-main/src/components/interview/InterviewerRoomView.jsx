import { useState, useCallback, useEffect } from "react";
import { useTracks, useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { Track, RoomEvent } from "livekit-client";
import InterviewerHeader from "./InterviewerHeader";
import ApplicantVideoStage from "./ApplicantVideoStage";
import InterviewerPanelGrid from "./InterviewerPanelGrid";
import ArtmsAiAssistantCard from "./ArtmsAiAssistantCard";
import LiveTranscriptionBar from "./LiveTranscriptionBar";
import { useInterviewerSync } from "../../hooks/useInterviewerSync";

/**
 * InterviewerRoomView
 * ─────────────────────────────────────────────────────────────────────────────
 * Section 2: Complete Interviewer View
 * 
 * Styled with ARTMS Admin Navy theme (#080B22, #0B0F2E, #0F163D, #1D2660, #111A62, #F97316)
 * Accepts and renders real database applicant data, real strengths/gaps, real questions, real transcripts.
 */

export default function InterviewerRoomView({
  interviewId = "session-1",
  applicantName = "Candidate",
  jobTitle = "Interview Session",
  fitScore = 85,
  currentUser = null,
  onEndCall,
  onExportSummary,
  isExporting = false,
  FaceTrackingComponent = null,
  initialTranscripts = [],
  strengths = [],
  gaps = [],
  dynamicQuestions = [],
  initialCompetencies = null,
  initialPanelists = null,
  initialNotes = "",
}) {
  const room = useRoomContext?.() || null;
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant?.() || {
    localParticipant: null,
    isMicrophoneEnabled: true,
    isCameraEnabled: true,
  };

  // Real-time synchronization hook across all active interviewers
  const {
    panelists,
    sharedNotes,
    updateSharedNotes,
    activeEditor,
    privateNotes,
    updatePrivateNotes,
    myScore,
    updateRubricScore,
    roomAverageScore,
    competencies,
    updateCompetency,
    askedQuestions,
    toggleQuestionAsked,
    checklist,
    updateChecklist,
  } = useInterviewerSync({
    interviewId,
    currentUser,
    isInterviewer: true,
    room,
    initialPanelists,
    initialCompetencies,
    initialNotes,
  });

  // Query LiveKit tracks
  const tracks = useTracks?.([
    { source: Track.Source.Camera, withPlaceholder: false },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]) || [];

  // Find candidate camera track (remote participant)
  const remoteCameraTrack = tracks.find(
    (t) => t.source === Track.Source.Camera && t.participant && !t.participant.isLocal
  ) || null;

  // Find local camera track (HR interviewer)
  const localCameraTrack = tracks.find(
    (t) => t.source === Track.Source.Camera && t.participant?.isLocal
  ) || null;

  // Clean initial baseline metrics for a new call
  const INITIAL_METRICS = {
    calibrated: false,
    emotion: "Standby / Calibrating...",
    composedScore: 0,
    attentiveScore: 0,
    engagedScore: 0,
    eyeContactRatio: 0,
    posture: "Calibrating...",
    valence: 50,
  };

  // MediaPipe real-time telemetry metrics state (wiped clean on every new call)
  const [liveMetrics, setLiveMetrics] = useState(INITIAL_METRICS);

  // Live transcription stream (starts empty on every new call)
  const [transcripts, setTranscripts] = useState([]);

  // Wipe previous sentiment analysis and transcripts whenever a new call / interviewId mounts
  useEffect(() => {
    setLiveMetrics(INITIAL_METRICS);
    setTranscripts([]);
    try {
      sessionStorage.removeItem(`artms_sentiment_${interviewId}`);
      sessionStorage.removeItem(`artms_transcripts_${interviewId}`);
      localStorage.removeItem(`artms_sentiment_${interviewId}`);
      localStorage.removeItem(`artms_transcripts_${interviewId}`);
    } catch {}
  }, [interviewId]);

  // Also guarantee wipe when LiveKit room connects for a new call
  useEffect(() => {
    if (!room) return;
    const handleConnected = () => {
      setLiveMetrics(INITIAL_METRICS);
      setTranscripts([]);
    };
    room.on(RoomEvent.Connected, handleConnected);
    return () => {
      room.off(RoomEvent.Connected, handleConnected);
    };
  }, [room]);

  const handleMetricsComputed = useCallback((metrics) => {
    if (!metrics || !metrics.faceDetected) return;
    setLiveMetrics((prev) => ({
      calibrated: true,
      emotion: metrics.emotion || (metrics.engagedScore > 75 ? "Focused / Neutral" : "Attentive"),
      composedScore: metrics.composedScore ?? prev.composedScore,
      attentiveScore: metrics.attentiveScore ?? prev.attentiveScore,
      engagedScore: metrics.engagedScore ?? prev.engagedScore,
      eyeContactRatio: metrics.eyeOpenness ? Math.round(metrics.eyeOpenness * 250) : prev.eyeContactRatio,
      posture: metrics.engagedScore > 70 ? "Engaged & Upright" : "Relaxed",
      valence: metrics.valence ?? prev.valence,
    }));
  }, []);

  // Web Speech STT for live call speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    let recognition = null;
    let isMounted = true;
    let restartTimer = null;

    try {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const spoken = event.results[i][0].transcript.trim();
            if (spoken) {
              const newEntry = {
                id: `stt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                speaker: currentUser?.name ? `${currentUser.name}` : "HR Interviewer",
                speakerRole: "interviewer",
                text: spoken,
              };
              setTranscripts((prev) => [...prev, newEntry]);
            }
          }
        }
      };

      recognition.onerror = (e) => {
        if (e.error !== "no-speech" && e.error !== "network") {
          console.debug("SpeechRecognition notice:", e.error);
        }
      };

      recognition.onend = () => {
        if (!isMounted) return;
        restartTimer = setTimeout(() => {
          if (isMounted) {
            try { recognition.start(); } catch {}
          }
        }, 1000);
      };

      try {
        recognition.start();
      } catch {}
    } catch (e) {
      console.debug("Speech recognition init notice:", e);
    }

    return () => {
      isMounted = false;
      if (restartTimer) clearTimeout(restartTimer);
      if (recognition) {
        try { recognition.stop(); } catch {}
      }
    };
  }, [interviewId, currentUser]);

  const handleClearTranscripts = useCallback(() => {
    setTranscripts([]);
    setLiveMetrics(INITIAL_METRICS);
  }, []);

  // A/V Toggle Handlers
  const handleToggleMute = useCallback(async () => {
    if (localParticipant) {
      try {
        await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
      } catch (e) {
        console.warn("Failed to toggle microphone:", e);
      }
    }
  }, [localParticipant, isMicrophoneEnabled]);

  const handleToggleVideo = useCallback(async () => {
    if (localParticipant) {
      try {
        await localParticipant.setCameraEnabled(!isCameraEnabled);
      } catch (e) {
        console.warn("Failed to toggle camera:", e);
      }
    }
  }, [localParticipant, isCameraEnabled]);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 text-slate-800 overflow-hidden font-sans select-none">
      {/* ── A. Top Navigation / Session Header ────────────────────────────── */}
      <InterviewerHeader
        candidateName={applicantName}
        jobTitle={jobTitle}
        fitScore={fitScore}
      />

      {/* ── Main Split View (60 / 40 ratio) ───────────────────────────────── */}
      <main className="flex-1 min-h-0 px-3 py-2 grid grid-cols-1 lg:grid-cols-12 gap-2.5 overflow-hidden bg-slate-100">
        {/* B. Left Column: Primary Applicant Video & Visual Telemetry (60% width = 7 of 12 cols on desktop) */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-0 overflow-hidden">
          <ApplicantVideoStage
            candidateName={applicantName}
            remoteCameraTrack={remoteCameraTrack}
            liveMetrics={liveMetrics}
            FaceTrackingComponent={FaceTrackingComponent}
            onLocalMetricsComputed={handleMetricsComputed}
          />
        </div>

        {/* C. Right Column: Interviewer Panel & ARTMS AI Assistant Card (40% width = 5 of 12 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-2 h-full min-h-0 overflow-y-auto pr-0.5 custom-scrollbar">
          {/* Top: Interviewer Video Grid (Scalable 1–8+ interviewers) with HR Camera */}
          <InterviewerPanelGrid
            panelists={panelists}
            interviewId={interviewId}
            localCameraTrack={localCameraTrack}
          />

          {/* Middle: ARTMS AI Assistant Card */}
          <ArtmsAiAssistantCard
            sharedNotes={sharedNotes}
            onUpdateSharedNotes={updateSharedNotes}
            activeEditor={activeEditor}
            privateNotes={privateNotes}
            onUpdatePrivateNotes={updatePrivateNotes}
            myScore={myScore}
            onUpdateRubricScore={updateRubricScore}
            roomAverageScore={roomAverageScore}
            competencies={competencies}
            onUpdateCompetency={updateCompetency}
            askedQuestions={askedQuestions}
            onToggleQuestionAsked={toggleQuestionAsked}
            fitScore={fitScore}
            strengths={strengths}
            gaps={gaps}
            dynamicQuestions={dynamicQuestions}
          />
        </div>
      </main>

      {/* ── D. Bottom Full-Width Bar: Live Transcription & HR Actions ──────── */}
      <div className="px-3 pb-2 shrink-0 bg-slate-100">
        <LiveTranscriptionBar
          transcriptEntries={transcripts}
          onClearTranscripts={handleClearTranscripts}
          checklist={checklist}
          onUpdateChecklist={updateChecklist}
          isMuted={!isMicrophoneEnabled}
          onToggleMute={handleToggleMute}
          isVideoOff={!isCameraEnabled}
          onToggleVideo={handleToggleVideo}
          onEndCall={onEndCall}
          onExportSummary={onExportSummary}
          isExporting={isExporting}
        />
      </div>
    </div>
  );
}
