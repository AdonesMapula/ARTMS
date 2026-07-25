# ARTMS — Documentation of Changes & Technical Architecture

This document provides a comprehensive record of all technical updates, module specifications, architectural designs, API additions, bug fixes, and legacy element removals since the initial branch checkout.

---

## 1. Feature Summary & Overview

- **Video Conferencing Engine**: Full LiveKit Cloud WebRTC integration with dedicated video rooms for HR interviewers and external applicants.
- **AI Analytics & Interview Evaluation**: Integrated xAI Grok API (`grok-4.5`) for automated transcript processing, live sentiment tracking, keyword extraction, and post-interview scorecards.
- **Recruitment Pipeline Kanban Board**: Converted static placeholder layouts into a real-time drag-and-drop recruitment pipeline connected to Laravel API endpoints.
- **Interview Calendar & Scheduling UI**: Redesigned calendar month grid and daily timeline agenda matching high-fidelity mockups, featuring a 2-column scheduling modal with clickable time slots.
- **Cross-Device ngrok Compatibility**: Resolved CORS loopback network errors, exposed public applicant endpoints, and enabled mobile/external device access over ngrok tunnels.

---

## 2. Full Video Conferencing Module Specifications

### 🛠️ Tech Stack & Dependencies Used
| Component | Technology / Library Used | Purpose |
| :--- | :--- | :--- |
| **Frontend WebRTC Engine** | `@livekit/components-react` v2.x | UI components (`LiveKitRoom`, `VideoTrack`, `RoomAudioRenderer`) & custom hooks (`useTracks`, `useLocalParticipant`) |
| **Client Core SDK** | `livekit-client` v2.x | Real-time WebRTC media engine, DataChannel audio/video track publishing, and event listeners |
| **Styling & Icons** | Vanilla Tailwind CSS v4 & `react-icons/fi` | Custom Zoom UI styling, picture-in-picture frames, progress bars, and SVG control icons |
| **Backend Server SDK** | `livekit/server-sdk` (PHP) | Room creation (`RoomServiceClient`) and signed JWT token generation (`AccessToken`) |
| **AI Intelligence Engine** | `openai-php/client` (Grok `grok-4.5`) | Analyzes transcripts, computes scores, extracts keywords, and evaluates sentiment |
| **Tunneling & Networking** | `ngrok` HTTPS Tunnel & LiveKit Cloud | Hosts public entry endpoints and handles encrypted WebSockets (`wss://artms-8tdvtcz7.livekit.cloud`) |

---

### 📐 Architecture & Protocol Workflow

```
┌─────────────────────────┐          1. Request Token          ┌─────────────────────────┐
│ Applicant / HR Browser  ├───────────────────────────────────►│   Laravel Backend API   │
│ (React + LiveKit Client)│                                    │(InterviewController.php)│
└───────────┬─────────────┘                                    └────────────┬────────────┘
            │                                                               │
            │ 2. Signed JWT Token Returned                                  │ 3. REST HTTPS Call
            │                                                               ▼
            │ 4. Connect WebSockets (wss://)                    ┌─────────────────────────┐
            └──────────────────────────────────────────────────►│  LiveKit Cloud Server   │
                                                                │(wss://livekit.cloud)    │
                                                                └───────────┬─────────────┘
                                                                            │
                                                                            │ 5. Webhook room_finished
                                                                            ▼
                                                                ┌─────────────────────────┐
                                                                │  xAI Grok API (grok-4.5)│
                                                                │ (AI Analysis Report)    │
                                                                └─────────────────────────┘
```

1. **Token Provisioning (`GET /api/public/interviews/{id}/livekit-token`)**:
   - When an applicant or interviewer joins, the backend validates their session and generates a signed JWT token containing room name (`interview_{id}`), identity (`applicant_{email}` or `interviewer_{id}`), and permissions (`canPublish: true`, `canSubscribe: true`).
2. **WebSocket Connection (`wss://`)**:
   - The React client connects directly to LiveKit Cloud WebSockets (`wss://artms-8tdvtcz7.livekit.cloud`) using the signed JWT token.
3. **Media Publishing & Subscribing**:
   - Camera and microphone tracks are published to the room. The custom UI uses `useTracks([{ source: Track.Source.Camera }])` to render remote and local video streams dynamically.
4. **Session Termination & AI Dispatch (`POST /api/interviews/{id}/end-session`)**:
   - Clicking **End Interview** closes the LiveKit room and dispatches `GenerateAIInterviewReportJob.php` to analyze the complete dialogue transcript via xAI Grok API (`grok-4.5`).

---

### 🎨 Frontend UI Architecture

#### 1. Custom Video Stage & Control Bar (`ZoomVideoStage`)
- **Main Stage Display**: Renders the remote participant's video feed in high definition. If video is disabled or connecting, displays a large avatar circle with user icon (`w-36 h-36 bg-slate-100 border-4 border-slate-700/50`).
- **Floating Self-View PIP (Top Right)**: Inset window (`w-52 h-36 rounded-xl bg-[#20293a] border border-slate-700/60 shadow-2xl`) displaying the local user's video feed with a camera indicator icon.
- **Participant Badge (Bottom Left)**: Floating dark pill badge with green online status pulse (`🟢 Applicant: [Candidate Name]`).
- **Zoom Control Bar (Bottom)**: 5 circular control buttons:
  - 🎤 Mute / Unmute Microphone (`setMicrophoneEnabled`)
  - 📹 Turn On / Off Camera (`setCameraEnabled`)
  - 🖥️ Share Screen Toggle (`setScreenShareEnabled`)
  - 📞 **Red Circular End Call Button** (Hang up and trigger AI analysis)
  - 💬 More Options (`...`)

#### 2. Applicant View (`ZoomApplicantLayout` — Matching Image 1)
- **Full-Screen Dark Canvas**: Optimized for candidate focus on dark navy slate (`#111723`).
- **Data Privacy Consent Gate (`DpaConsentModal`)**: Prompts candidate to review and accept Data Privacy Act (RA 10173) terms before camera/microphone activation.
- **Identity Gate (`ApplicantVerificationForm`)**: Requires candidates to enter their registered email address to verify identity before issuing tokens.

#### 3. Interviewer Dashboard (`ZoomInterviewerLayout` — Matching Image 2)
- **Left Column (Video Stage + Real-Time AI Analytics)**:
  - Video stage matching Image 1 embedded in a rounded card (`bg-[#151c28] rounded-2xl shadow-2xl`).
  - **3 Analytics Cards (Below Video Stage)**:
    1. **Live Sentiment**: Progress bars for **Confidence** (85%), **Enthusiasm** (60%), and **Calmness** (75%).
    2. **Keywords Detected**: Pill badges (`COMMUNICATION SKILLS`, `LEADERSHIP`, `ACTIVE LISTENING`, `SCALABILITY`, `CUSTOMER HANDLING`, `PROBLEM SOLVING`).
    3. **AI Match Score**: Circular progress ring displaying candidate score (`78 / AI MATCH SCORE`).
- **Right Column (Session Sidebar)**:
  - Header displaying candidate info and position title (`Senior Dev Role`).
  - Interactive navigation tabs (`🎥 Live Stream`, `🧠 AI Analysis`, `📋 Scorecard`, `📝 Notes`, `📄 Transcript`).
  - Live timestamped transcript feed (`INTERVIEWER 12:04`, `APPLICANT 12:05`).
  - Soft red **End Interview** button at the bottom of the sidebar.

---

## 3. Detailed Breakdown: Additional Module Updates

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

## 4. What Was Removed / Replaced

| Module / Component | Removed / Replaced Element | Replacement / New Implementation |
| :--- | :--- | :--- |
| **Pipeline (`Pipeline.jsx`)** | Static hardcoded candidate arrays (`["Jamie Cruz", "Pat Dela Rosa", ...]`) | Live API fetching from `/api/applicants` with real-time drag-and-drop state sync. |
| **Icons (App-wide)** | Flat emojis across calendar, interview management, and pipeline components | SVG React Icons (`FiCalendar`, `FiClock`, `FiCheckCircle`, `FiVideo`, `FiUser`, `FiDownload`, `FiPlus`). |
| **Time Field (`ScheduleInterviewModal.jsx`)** | Manual text typing input for interview time (`<input type="text" placeholder="10:00 AM" />`) | Clickable 30-minute time slot select dropdown (`08:00 AM` through `06:00 PM`). |
| **Meeting Link Input (`ScheduleInterviewModal.jsx`)** | Manual `meeting_link` text box and mandatory input requirement | Auto-generated ngrok room URLs created by backend controller (`/interview/{id}/room`). |
| **API Fallback URLs** | Hardcoded `http://localhost:8000/api` strings in public page components | Relative `/api` paths proxied through Vite dev server to prevent cross-device CORS loopback errors. |

---

## 5. Verification & Build Status

- **Frontend Build (`npm run build`)**: Compiled in **1.41s** with 0 build or linting errors.
- **Backend Route Integrity (`php artisan route:list`)**: All 115 API routes compiled and verified.
- **Git Branch Status**: Clean merge on branch `latestUI+Interview` (Local commit `4d3f87b`).
