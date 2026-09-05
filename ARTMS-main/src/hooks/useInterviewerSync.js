import { useState, useEffect, useCallback, useRef } from "react";

/**
 * useInterviewerSync
 * ─────────────────────────────────────────────────────────────────────────────
 * Real-time state synchronization hook for multi-interviewer collaboration.
 * 
 * Features:
 * - BroadcastChannel transport (for low-latency peer sync across browser tabs/windows)
 * - LiveKit Data Channel transport (when room is connected over WebRTC)
 * - Interviewer presence tracking (1 to 8+ panelists with active speaker indicators)
 * - Synchronized shared team notes with cursor / active-editor presence
 * - Isolated private notes (never transmitted)
 * - Synchronized competency rating matrix (Full-Stack Dev, Scalability, Team Leadership, Cloud Infrastructure)
 * - Aggregated 1-5 scoring rubric with instant local and room averages
 * - Synchronized "Post-Interview Workflow Checklist"
 * - AI Suggested questions asked-state synchronization
 */

const DEFAULT_PANELISTS = [
  { id: "panelist-host", name: "You (Host)", role: "Lead Recruiter", avatar: "YR", isHost: true, isSpeaking: false, isMuted: false },
  { id: "panelist-2", name: "Interviewer 2", role: "Lead Tech", avatar: "LT", isHost: false, isSpeaking: false, isMuted: false },
  { id: "panelist-3", name: "Interviewer 3", role: "HR Ops", avatar: "HO", isHost: false, isSpeaking: false, isMuted: true },
];

const DEFAULT_COMPETENCIES = {
  "Full-Stack Dev": { checked: true, rating: 5 },
  "Scalability": { checked: true, rating: 4 },
  "Team Leadership": { checked: false, rating: 3 },
  "Cloud Infrastructure": { checked: true, rating: 4 },
};

const DEFAULT_CHECKLIST = {
  scheduleNextRound: false,
  sendCodeTest: false,
  recommendOffer: false,
};

export function useInterviewerSync({ 
  interviewId, 
  currentUser, 
  isInterviewer = true, 
  room = null,
  initialPanelists = null,
  initialCompetencies = null,
  initialNotes = "",
}) {
  const channelName = `artms_interview_sync_${interviewId}`;
  const myUserId = currentUser?.id || currentUser?.name || "interviewer_local";
  const myUserName = currentUser?.name || "You (Host)";

  const defaultPanelistsList = initialPanelists || [
    { 
      id: `panelist-${myUserId}`, 
      name: myUserName, 
      role: currentUser?.role?.replace(/_/g, " ") || "Host / Interviewer", 
      avatar: (myUserName.split(" ").map((w) => w[0]).join("") || "YR").slice(0, 2).toUpperCase(), 
      isHost: true, 
      isSpeaking: false, 
      isMuted: false 
    },
    { id: "panelist-2", name: "Technical Evaluator", role: "Engineering Lead", avatar: "TL", isHost: false, isSpeaking: false, isMuted: false },
    { id: "panelist-3", name: "HR Department Rep", role: "Recruitment Ops", avatar: "HR", isHost: false, isSpeaking: false, isMuted: true },
  ];

  // Panelists Presence List
  const [panelists, setPanelists] = useState(() => {
    try {
      const saved = sessionStorage.getItem(`${channelName}_panelists`);
      return saved ? JSON.parse(saved) : defaultPanelistsList;
    } catch {
      return defaultPanelistsList;
    }
  });

  // Collaborative Notes (fallback to real DB notes)
  const [sharedNotes, setSharedNotes] = useState(() => {
    try {
      const saved = localStorage.getItem(`${channelName}_shared_notes`);
      return saved !== null && saved !== undefined ? saved : (initialNotes || "");
    } catch {
      return initialNotes || "";
    }
  });
  const [activeEditor, setActiveEditor] = useState(null);
  const editorTimeoutRef = useRef(null);

  // Private Notes (Always strictly local to this client)
  const [privateNotes, setPrivateNotes] = useState(() => {
    try {
      return localStorage.getItem(`${channelName}_private_notes_${myUserId}`) || "";
    } catch {
      return "";
    }
  });

  // Scoring Rubric
  const [myScore, setMyScore] = useState(4);
  const [allScores, setAllScores] = useState({ [myUserId]: 4 });

  // Key Competencies
  const [competencies, setCompetencies] = useState(() => {
    return initialCompetencies || DEFAULT_COMPETENCIES;
  });

  // AI Questions Marked as Asked
  const [askedQuestions, setAskedQuestions] = useState(new Set());

  // Post-Interview Workflow Checklist
  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST);

  // Broadcast Channel reference
  const bcRef = useRef(null);

  // Broadcast helper
  const broadcast = useCallback(
    (action) => {
      const message = {
        ...action,
        senderId: myUserId,
        senderName: myUserName,
        timestamp: Date.now(),
      };

      // 1. BroadcastChannel (fast local multi-window/tab sync)
      try {
        if (bcRef.current) {
          bcRef.current.postMessage(message);
        }
      } catch (err) {
        console.debug("BroadcastChannel notice:", err);
      }

      // 2. LiveKit DataChannel (reliable network sync)
      try {
        if (room && room.localParticipant && isInterviewer) {
          const bytes = new TextEncoder().encode(JSON.stringify({ type: "SYNC_EVENT", payload: message }));
          room.localParticipant.publishData(bytes, { reliable: true });
        }
      } catch (err) {
        console.debug("LiveKit publishData notice:", err);
      }
    },
    [myUserId, myUserName, room, isInterviewer]
  );

  // Message Handler for sync events
  const handleSyncMessage = useCallback(
    (msg) => {
      if (!msg || msg.senderId === myUserId) return;

      switch (msg.type) {
        case "SHARED_NOTES_UPDATE":
          setSharedNotes(msg.text);
          setActiveEditor(msg.senderName);
          if (editorTimeoutRef.current) clearTimeout(editorTimeoutRef.current);
          editorTimeoutRef.current = setTimeout(() => setActiveEditor(null), 3000);
          break;

        case "RUBRIC_SCORE_UPDATE":
          setAllScores((prev) => ({ ...prev, [msg.senderId]: msg.score }));
          break;

        case "COMPETENCY_UPDATE":
          setCompetencies((prev) => ({
            ...prev,
            [msg.name]: {
              checked: msg.checked ?? prev[msg.name]?.checked ?? false,
              rating: msg.rating ?? prev[msg.name]?.rating ?? 1,
            },
          }));
          break;

        case "QUESTION_TOGGLE":
          setAskedQuestions((prev) => {
            const next = new Set(prev);
            if (msg.asked) next.add(msg.questionId);
            else next.delete(msg.questionId);
            return next;
          });
          break;

        case "CHECKLIST_UPDATE":
          setChecklist((prev) => ({
            ...prev,
            [msg.key]: msg.value,
          }));
          break;

        case "PANELIST_JOINED":
          setPanelists((prev) => {
            if (prev.some((p) => p.id === msg.panelist.id)) return prev;
            return [...prev, msg.panelist];
          });
          break;

        default:
          break;
      }
    },
    [myUserId]
  );

  // Initialize BroadcastChannel
  useEffect(() => {
    if (typeof window === "undefined" || !isInterviewer) return;

    try {
      const bc = new BroadcastChannel(channelName);
      bcRef.current = bc;

      bc.onmessage = (event) => {
        handleSyncMessage(event.data);
      };

      // Announce presence
      bc.postMessage({
        type: "PANELIST_JOINED",
        senderId: myUserId,
        senderName: myUserName,
        panelist: {
          id: myUserId,
          name: myUserName,
          role: currentUser?.role?.replace(/_/g, " ") || "Interviewer",
          avatar: (myUserName.split(" ").map((w) => w[0]).join("") || "HR").slice(0, 2).toUpperCase(),
          isHost: Boolean(currentUser?.role === "super_admin" || currentUser?.role === "hr_admin"),
          isSpeaking: false,
          isMuted: false,
        },
      });
    } catch (e) {
      console.warn("BroadcastChannel not supported in this environment:", e);
    }

    return () => {
      if (bcRef.current) {
        bcRef.current.close();
      }
      if (editorTimeoutRef.current) {
        clearTimeout(editorTimeoutRef.current);
      }
    };
  }, [channelName, myUserId, myUserName, currentUser, isInterviewer, handleSyncMessage]);

  // Sync when initialCompetencies updates from DB
  useEffect(() => {
    if (initialCompetencies && Object.keys(initialCompetencies).length > 0) {
      setCompetencies((prev) => {
        const isDefault = Object.keys(prev).includes("Full-Stack Dev") && !Object.keys(initialCompetencies).includes("Full-Stack Dev");
        return isDefault ? initialCompetencies : prev;
      });
    }
  }, [initialCompetencies]);

  // Sync when initialPanelists updates from DB
  useEffect(() => {
    if (initialPanelists && Array.isArray(initialPanelists) && initialPanelists.length > 0) {
      setPanelists((prev) => {
        if (!sessionStorage.getItem(`${channelName}_panelists`)) {
          return initialPanelists;
        }
        return prev;
      });
    }
  }, [initialPanelists, channelName]);

  // Sync when initialNotes updates from DB
  useEffect(() => {
    if (initialNotes) {
      setSharedNotes((prev) => (prev ? prev : initialNotes));
    }
  }, [initialNotes]);

  // Listen to LiveKit data channel events
  useEffect(() => {
    if (!room || !isInterviewer) return;

    const onDataReceived = (payload) => {
      try {
        const textStr = new TextDecoder().decode(payload);
        const data = JSON.parse(textStr);
        if (data.type === "SYNC_EVENT" && data.payload) {
          handleSyncMessage(data.payload);
        }
      } catch {
        // Not a sync event
      }
    };

    room.on("dataReceived", onDataReceived);
    return () => {
      room.off("dataReceived", onDataReceived);
    };
  }, [room, isInterviewer, handleSyncMessage]);

  // Action: Update Shared Notes
  const updateSharedNotes = useCallback(
    (text) => {
      setSharedNotes(text);
      try {
        localStorage.setItem(`${channelName}_shared_notes`, text);
      } catch {}
      broadcast({ type: "SHARED_NOTES_UPDATE", text });
    },
    [channelName, broadcast]
  );

  // Action: Update Private Notes
  const updatePrivateNotes = useCallback(
    (text) => {
      setPrivateNotes(text);
      try {
        localStorage.setItem(`${channelName}_private_notes_${myUserId}`, text);
      } catch {}
    },
    [channelName, myUserId]
  );

  // Action: Update Rubric Score
  const updateRubricScore = useCallback(
    (score) => {
      setMyScore(score);
      setAllScores((prev) => ({ ...prev, [myUserId]: score }));
      broadcast({ type: "RUBRIC_SCORE_UPDATE", score });
    },
    [myUserId, broadcast]
  );

  // Action: Update Competency
  const updateCompetency = useCallback(
    (name, { checked, rating }) => {
      setCompetencies((prev) => ({
        ...prev,
        [name]: {
          checked: checked !== undefined ? checked : prev[name]?.checked,
          rating: rating !== undefined ? rating : prev[name]?.rating,
        },
      }));
      broadcast({ type: "COMPETENCY_UPDATE", name, checked, rating });
    },
    [broadcast]
  );

  // Action: Toggle AI Question Asked
  const toggleQuestionAsked = useCallback(
    (questionId) => {
      setAskedQuestions((prev) => {
        const next = new Set(prev);
        const isAsked = !next.has(questionId);
        if (isAsked) next.add(questionId);
        else next.delete(questionId);
        broadcast({ type: "QUESTION_TOGGLE", questionId, asked: isAsked });
        return next;
      });
    },
    [broadcast]
  );

  // Action: Update Checklist Item
  const updateChecklist = useCallback(
    (key, value) => {
      setChecklist((prev) => ({ ...prev, [key]: value }));
      broadcast({ type: "CHECKLIST_UPDATE", key, value });
    },
    [broadcast]
  );

  // Action: Add new panelist invite link
  const generatePanelistInviteUrl = useCallback((role = "Co-Interviewer") => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/interview/${interviewId}?role=interviewer&panelistRole=${encodeURIComponent(role)}`;
  }, [interviewId]);

  // Calculate room average rubric score
  const scoreValues = Object.values(allScores);
  const roomAverageScore = scoreValues.length > 0
    ? (scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length).toFixed(1)
    : myScore.toFixed(1);

  return {
    panelists,
    sharedNotes,
    updateSharedNotes,
    activeEditor,
    privateNotes,
    updatePrivateNotes,
    myScore,
    updateRubricScore,
    roomAverageScore,
    allScores,
    competencies,
    updateCompetency,
    askedQuestions,
    toggleQuestionAsked,
    checklist,
    updateChecklist,
    generatePanelistInviteUrl,
  };
}
