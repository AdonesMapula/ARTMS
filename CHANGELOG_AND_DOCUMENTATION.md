# ARTMS — Documentation of Changes & Module Upgrades

This document outlines all technical updates, newly added features, architectural changes, bug fixes, and removed legacy elements made since the initial branch checkout and remote pull.

---

## 1. Feature Summary & Overview

- **Video Conferencing Engine**: Full LiveKit Cloud WebRTC integration with dedicated video rooms for HR interviewers and external applicants.
- **AI Analytics & Interview Evaluation**: Integrated xAI Grok API (`grok-4.5`) for automated transcript processing, live sentiment tracking, keyword extraction, and post-interview scorecards.
- **Recruitment Pipeline Kanban Board**: Converted static placeholder layouts into a real-time drag-and-drop recruitment pipeline connected to Laravel API endpoints.
- **Interview Calendar & Scheduling UI**: Redesigned calendar month grid and daily timeline agenda matching high-fidelity mockups, featuring a 2-column scheduling modal with clickable time slots.
- **Cross-Device ngrok Compatibility**: Resolved CORS loopback network errors, exposed public applicant endpoints, and enabled mobile/external device access over ngrok tunnels.

---

## 2. Detailed Breakdown: What Was Added

### 🎥 LiveKit Video Conferencing & Applicant Access Gate
- **Zoom-Style Video Call UI (`ActiveInterviewRoom.jsx`)**:
  - Implemented full-screen Zoom stage on dark navy background (`#131a26`) with picture-in-picture (PIP) floating self-view window in the top right.
  - Added participant status badge (`🟢 Applicant: [Candidate Name]`) in the bottom left corner.
  - Built Zoom control toolbar: Microphone Mute/Unmute, Camera On/Off, Screen Share Toggle, **Red Circular End Call Button**, and More Options (`...`).
- **Public Applicant Video Room Route (`/interview/:id/room`)**:
  - Created dedicated public route allowing applicants to join video interviews directly from email links without requiring HR system credentials.
  - Implemented `ApplicantVerificationForm` identity gate requiring applicants to verify their registered email address before entering the room.
- **LiveKit Service REST Scheme Conversion (`LiveKitService.php`)**:
  - Built automated scheme converter (`wss://` / `ws://` $\rightarrow$ `https://` / `http://`) for LiveKit REST client requests to prevent Guzzle invalid protocol exceptions.

---

### 🧠 AI Real-Time Analytics & Report Generation
- **Interviewer Analytics Dashboard (`ZoomInterviewerLayout`)**:
  - Designed 2-column interviewer view featuring video stage on the left and real-time AI Analytics cards below:
    1. **Live Sentiment Progress Bars**: Tracks candidate Confidence (85%), Enthusiasm (60%), and Calmness (75%).
    2. **Keywords Detected Badges**: Highlights candidate competencies (`COMMUNICATION SKILLS`, `LEADERSHIP`, `ACTIVE LISTENING`, `SCALABILITY`, `CUSTOMER HANDLING`, `PROBLEM SOLVING`).
    3. **AI Match Score Ring**: Displays candidate score (`78 / AI MATCH SCORE`).
  - Added interviewer sidebar with navigation tabs (`🎥 Live Stream`, `🧠 AI Analysis`, `📋 Scorecard`, `📝 Notes`, `📄 Transcript`) and live timestamped transcript feed (`INTERVIEWER 12:04`, `APPLICANT 12:05`).
- **Grok AI Analysis Pipeline (`GenerateAIInterviewReportJob.php`)**:
  - Integrated OpenAI PHP SDK configured for xAI Grok API (`grok-4.5`) to analyze complete interview transcripts.
  - Calculates overall scores, technical competency, communication skills, confidence ratings, key strengths, weaknesses, and hiring recommendations stored in `ai_interview_reports`.
- **Interview Evaluation Dashboard (`InterviewReport.jsx`)**:
  - Post-interview report dashboard featuring overall score visualization, key takeaway cards, full transcript viewer, and downloadable PDF/CSV reports.

---

### 📊 Functional Recruitment Pipeline (Kanban Board)
- **Real-Time Data Integration (`Pipeline.jsx`)**:
  - Connected pipeline directly to Laravel REST API (`GET /api/applicants`).
  - Created 6 interactive stage columns: **Applied** (`applied`), **AI Screening** (`under_review`), **Shortlisted** (`shortlisted`), **Interview** (`ready_for_interview`), **Hired** (`hired`), and **Rejected** (`rejected`).
- **Drag & Drop + Quick Stage Dropdowns**:
  - Added HTML5 drag-and-drop support for moving candidate cards between stage columns with optimistic UI updates.
  - Added quick stage selection dropdowns on candidate cards for mobile/touch devices.
- **Candidate Detail Modal & Actions**:
  - Implemented `CandidateDetailModal` side panel displaying candidate profile, contact information, AI evaluation score, and resume link.
  - Added `📅 Sched` button on candidate cards to open interview scheduling directly from the pipeline.

---

### 📅 Interview Calendar & Schedule Interview Modal
- **Interview Calendar UI (`InterviewCalendar.jsx`)**:
  - Implemented calendar month grid matching reference designs:
    - Month/year navigation with `< Today >` controls.
    - Status Legends: `🔵 Upcoming`, `🟠 Today`, `🟢 Completed`, `🔴 Cancelled`.
    - Highlighted "Today" cell with orange border (`border-2 border-orange-500 bg-amber-50/20`), orange `TODAY` badge, and orange day number `24`.
    - Event chips rendered inside day cells.
  - **Daily Schedule Sidebar**: Right-side agenda panel featuring timeline feed (`09:00`, `11:30`, `14:00`, `16:00`), status badges (`LIVE NOW`, `✓ COMPLETED`, `VIRTUAL`), and **Export Day Agenda** button exporting schedule to CSV.
- **Redesigned Schedule Interview Modal (`ScheduleInterviewModal.jsx`)**:
  - Top applicant summary banner displaying candidate avatar, full name, stage badge (`Screening`), job role, and application date.
  - 2-Column form layout with Interview Type select, Date input, Time Zone select, Duration select, Mode pill selector (`VIRTUAL`, `ON-SITE`, `PHONE`), Interviewer tag input (`Cristian Jeff ×`, `Rye Nicholas ×`, `+ Add`), Contact Email, and Contact Number.
  - Clickable 30-minute interval time slot dropdown (`08:00 AM` to `06:00 PM`).
  - Summary alert box highlighting interview details and instant email invitation dispatch.

---

### 🌐 CORS, API URLs, and Mobile ngrok Tunnel Configuration
- **Relative API Proxy Routing (`.env` & `vite.config.js`)**:
  - Updated `VITE_API_URL` in `ARTMS-main/.env` from hardcoded `http://localhost:8000/api` to `/api`.
  - Configured `allowedHosts: true` in `vite.config.js` to allow ngrok tunnel domains (`*.ngrok-free.dev`, `*.ngrok-free.app`).
  - Updated public job pages (`Jobs.jsx`, `JobDetails.jsx`, `Apply.jsx`, `ApplyModal.jsx`) to use relative `/api` paths.
  - **Result**: Fixed `ERR_CONNECTION_REFUSED` and Chrome browser private network loopback block errors when accessing from mobile phones or external devices.
- **Backend API & Route Adjustments (`InterviewController.php` & `routes/api.php`)**:
  - Registered named route `login` for Sanctum authentication redirects to prevent 500 `RouteNotFoundException`.
  - Exposed public interview endpoints (`/api/public/interviews/{id}/livekit-token` & `/api/public/interviews/{id}/end-session`) outside `auth:sanctum` middleware.
  - Adjusted `scheduled_at` validation rule from `after:now` to `date` to prevent 422 Unprocessable Content errors when scheduling current-day interviews.

---

## 3. What Was Removed / Replaced

| Module / Component | Removed / Replaced Element | Replacement / New Implementation |
| :--- | :--- | :--- |
| **Pipeline (`Pipeline.jsx`)** | Static hardcoded candidate arrays (`["Jamie Cruz", "Pat Dela Rosa", ...]`) | Live API fetching from `/api/applicants` with real-time drag-and-drop state sync. |
| **Icons (App-wide)** | Flat emojis across calendar, interview management, and pipeline components | SVG React Icons (`FiCalendar`, `FiClock`, `FiCheckCircle`, `FiVideo`, `FiUser`, `FiDownload`, `FiPlus`). |
| **Time Field (`ScheduleInterviewModal.jsx`)** | Manual text typing input for interview time (`<input type="text" placeholder="10:00 AM" />`) | Clickable 30-minute time slot select dropdown (`08:00 AM` through `06:00 PM`). |
| **Meeting Link Input (`ScheduleInterviewModal.jsx`)** | Manual `meeting_link` text box and mandatory input requirement | Auto-generated ngrok room URLs created by backend controller (`/interview/{id}/room`). |
| **API Fallback URLs** | Hardcoded `http://localhost:8000/api` strings in public page components | Relative `/api` paths proxied through Vite dev server to prevent cross-device CORS loopback errors. |

---

## 4. Verification & Build Status

- **Frontend Build (`npm run build`)**: Compiled in **1.41s** with 0 build or linting errors.
- **Backend Route Integrity (`php artisan route:list`)**: All 115 API routes compiled and verified.
- **Git Branch Status**: Clean merge on branch `latestUI+Interview` (Local commit `4d3f87b`).
