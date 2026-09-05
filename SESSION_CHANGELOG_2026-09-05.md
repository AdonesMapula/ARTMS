# ARTMS — Comprehensive Session Changelog & System Updates
**Date:** September 5, 2026  
**Scope:** Real-Time Video Interview System (LiveKit WebRTC), Multi-Interviewer Collaboration Sync, White/Light Mode Admin Theme, Session Reset Guarantees, and Admin Table Status Dropdown Clipping Fix.

---

## Executive Summary of Changes

This update delivers a major overhaul of the **ARTMS Video Interview System** (`/admin/interviews/:id/room`), introducing role-based access control (RBAC) separating Interviewer and Candidate views, real-time multi-interviewer synchronization (panel presence, shared notes, rubric scoring, and workflow checklists), dynamic database applicant data integration, a clean light mode theme matching the ARTMS Admin design system, strict session clearing guarantees (ensuring zero metric/transcript leak across calls for the same applicant), and a complete fix for table status dropdown clipping in the Admin Interviews table.

---

## 1. Real-Time Video Interview Interface (`/admin/interviews/:id/room`)

### 1.1 Role-Based Access Control (RBAC) Architecture
- **Interviewer Room View (`InterviewerRoomView.jsx`)**:
  - Full candidate telemetry overlay, MediaPipe face mesh affect HUD, live Gemini 3.5 transcribe stream, AI contextual copilot card, synchronized rubric scoring, and post-interview workflow checklist.
- **Candidate Room View (`CandidateInterviewView.jsx`)**:
  - Clean, distraction-free interface presenting only the interviewer video grid, candidate self-view picture-in-picture (PIP) tile, session elapsed timer, and basic A/V controls (Mute Audio, Video Off, Leave Call).
  - **Strict Security Guard**: Zero telemetry, MediaPipe data, transcripts, rubric scores, or interviewer notes are transmitted over the wire or rendered in the candidate DOM.

### 1.2 Multi-Interviewer Real-Time Collaboration Hook (`useInterviewerSync.js`)
- **Hybrid Transport**:
  - Uses `BroadcastChannel` (`artms_interview_sync_${interviewId}`) for ultra-low latency peer sync across browser tabs/windows.
  - Automatically bridges with LiveKit WebRTC Data Channels when connected to a live room.
- **Synchronized Capabilities**:
  - **Panelists Presence**: Dynamic grid tracking 1 to 8+ interviewers with real-time active speaker indicators (`isSpeaking`), microphone mute badges, and a "+ Add Panelist" invite link generator.
  - **Collaborative Notes**: Shared evaluation notes pad with live active-editor presence indicators (`activeEditor`).
  - **Private Notes**: Completely isolated personal scratchpad per interviewer (never transmitted over network).
  - **Competency Matrix**: Synchronized multi-skill rating matrix (Full-Stack Dev, Scalability, Team Leadership, Cloud Infrastructure).
  - **1–5 Star Rubric Scoring**: Synchronized ratings calculating both individual scores and live room averages.
  - **Post-Interview Workflow Checklist**: Real-time synchronized action items (*Schedule Next Round*, *Send Code Test*, *Recommend Offer*).
  - **AI Suggested Questions**: Synced question-asked state preventing multiple interviewers from asking duplicate questions.

### 1.3 Real Database Data Integration
- Dynamically fetches candidate details, screened strengths, screened gaps, resume fit score, and dynamic interview questions from the database via `interviewService.getById(currentSessionId)`.
- Replaced static/hardcoded mock data with real applicant name, position title, and AI resume match evaluations.

### 1.4 HR Interviewer Live Camera View (`InterviewerPanelGrid.jsx`)
- Integrated `HrCameraTile` into the interviewer grid.
- Displays the HR interviewer's real-time video stream via LiveKit `localCameraTrack` with automatic fallback to `navigator.mediaDevices.getUserMedia` when in preview/standalone testing.
- Includes interactive camera toggle, microphone mute indicator, active speaking ring (`#F97316`), and `"LIVE (You)"` badge.

### 1.5 White / Light Mode Theme Transformation
- Converted all interview room components from dark navy to the official ARTMS Admin light mode theme:
  - **Interviewer Header (`InterviewerHeader.jsx`)**: Clean white container (`bg-white`), subtle slate borders (`border-slate-200`), dark navy branding (`#111A62`), fit score pill, and recruiter control menu.
  - **Applicant Video Stage (`ApplicantVideoStage.jsx`)**: White outer frame, dark monitor viewport (`bg-slate-950`) for maximum WebRTC video clarity, and white glassmorphic MediaPipe telemetry HUD (`bg-white/95`).
  - **Interviewer Panel Grid (`InterviewerPanelGrid.jsx`)**: Crisp white card surfaces with slate-50 panelist tiles.
  - **AI Assistant Card (`ArtmsAiAssistantCard.jsx`)**: White card with navy rubric buttons, Gemini 3.5 badge, and orange dynamic question action buttons.
  - **Live Transcription Bar (`LiveTranscriptionBar.jsx`)**: White dock, slate transcript log with distinct speaker coloring (applicant in `text-blue-700`, interviewer in `text-[#F97316]`), and clean workflow checklist.
  - **Candidate View (`CandidateInterviewView.jsx`)**: Light canvas (`bg-slate-100`) and white cards.
  - **Room Wrappers (`ActiveInterviewRoom.jsx`)**: Loading, consent, error, and completion screens updated to light mode.

---

## 2. Session Data Reset & Isolation Guarantees

### 2.1 Complete Sentiment & Transcription Reset on New Calls
- **Problem Solved**: Re-entering or starting a new call with the same applicant previously leaked or retained prior call transcripts and sentiment scores.
- **Root Cause & Fixes**:
  - **Discontinued DB Transcript Preloading**: Removed `interviewService.getTranscripts(currentSessionId)` on mount in `ActiveInterviewRoom.jsx`, ensuring `initialTranscripts={[]}` starts empty for every active room session.
  - **Baseline Telemetry Calibration**: Set `INITIAL_METRICS` to `calibrated: false`, `composedScore: 0`, `attentiveScore: 0`, `eyeContactRatio: 0`, posture `"Calibrating..."`, and live sentiment `"Standby / Calibrating..."`.
  - **Visual HUD Standby**: `ApplicantVideoStage.jsx` renders `0%` confidence and standby labels until real-time face mesh frames arrive and calibrate.
  - **Multi-Trigger Wipe**:
    - `useEffect([interviewId])` wipes transcripts and sentiment state and clears any session storage keys.
    - `room.on(RoomEvent.Connected, ...)` guarantees a full wipe as soon as the LiveKit room connects.
  - **Empty State & Manual Reset**:
    - In `LiveTranscriptionBar.jsx`, added a friendly empty state: `"New Session Started — Transcripts Cleared"` (*Listening for live speech from applicant and interviewer...*).
    - Added an on-demand `"Clear"` button next to the transcript search filter.

---

## 3. UI Bug Fixes & Improvements

### 3.1 Admin Interviews Table Status Dropdown Clipping Fix
- **Location**: `src/components/interview/StatusDropdown.jsx` (used in `/admin/interviews`).
- **Problem**: When expanding the status dropdown ("Scheduled", "Confirmed", "Done", etc.) in the Interviews table, the dropdown was clipped and cut off by the table container's `overflow-auto` boundary, especially on single-row tables.
- **Solution**:
  - Refactored `StatusDropdown.jsx` to use `@radix-ui/react-popover` (`<PopoverPrimitive.Portal>`).
  - Teleports the dropdown menu to `document.body` with `z-[9999]`, rendering completely outside the table scrolling container.
  - Enabled smart collision detection (`avoidCollisions={true}`, `collisionPadding={10}`) to automatically flip the dropdown upward if opened near the bottom of the viewport.
  - Added smooth scale-fade entry animations, chevron rotation (`rotate-180`), and dark mode support.

---

## 4. Modified & Created Files Summary

| File | Type | Changes Description |
|---|---|---|
| `src/components/interview/StatusDropdown.jsx` | Modified | Rewrote to use Radix Popover Portal, fixing table clipping and adding collision detection. |
| `src/components/interview/InterviewerHeader.jsx` | Modified | Converted to crisp white/light theme with corporate branding and metadata chips. |
| `src/components/interview/ApplicantVideoStage.jsx` | Modified | Added light mode HUD and calibrated standby logic (0% confidence until live frames arrive). |
| `src/components/interview/InterviewerPanelGrid.jsx` | Modified | Light theme transformation + added live `HrCameraTile` with webcam stream and controls. |
| `src/components/interview/ArtmsAiAssistantCard.jsx` | Modified | Converted to white/light theme with real DB strengths/gaps/questions and interactive rubric. |
| `src/components/interview/LiveTranscriptionBar.jsx` | Modified | Light theme, empty state ("Transcripts Cleared"), clear button, and `onClearTranscripts` prop. |
| `src/components/interview/CandidateInterviewView.jsx` | Modified | Converted to clean light mode canvas, PIP local camera view, and strict candidate RBAC guard. |
| `src/components/interview/InterviewerRoomView.jsx` | Modified | Wired sync hook, camera tracks, live Web Speech STT, room connection listeners, and session wipe. |
| `src/pages/Interview/ActiveInterviewRoom.jsx` | Modified | Light mode wrapper screens, removed old transcript preloading, and strictly enforced hook order. |
| `SESSION_CHANGELOG_2026-09-05.md` | New | Comprehensive documentation of all updates, architecture, and bug fixes for this session. |

---

## 5. Verification & Validation

- **Vite Production Build**:
  ```bash
  npm run build
  # Output: ✓ built in 1.60s (0 errors, 0 warnings)
  ```
- **Live Servers**:
  - Frontend: `http://localhost:5173` / `http://localhost:5174`
  - Backend API: `http://localhost:8000/api`
