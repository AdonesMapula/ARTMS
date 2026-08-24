# ARTMS — Comprehensive System Architecture & Technical Specification

> **System Name:** AI Recruitment and Talent Management System (ARTMS)  
> **Architecture Style:** Decoupled Client-Server (SPA + Headless RESTful API) with Micro-Integrations  
> **Target Version:** 2.0  
> **Status:** Production-Ready  

---

## Table of Contents
1. [High-Level Architecture Overview](#1-high-level-architecture-overview)
2. [Complete Technology Stack](#2-complete-technology-stack)
3. [Multi-Tier Layered Architecture](#3-multi-tier-layered-architecture)
4. [Deep-Dive: Email Handling & Delivery Subsystem](#4-deep-dive-email-handling--delivery-subsystem)
5. [Authentication, Security & RBAC Architecture](#5-authentication-security--rbac-architecture)
6. [AI Engine & Real-Time Video Subsystems](#6-ai-engine--real-time-video-subsystems)
7. [Data Flow & Lifecycle Sequences](#7-data-flow--lifecycle-sequences)
8. [Caching, Rate Limiting & Guardrails](#8-caching-rate-limiting--guardrails)
9. [Infrastructure, Storage & File Handling](#9-infrastructure-storage--file-handling)

---

## 1. High-Level Architecture Overview

ARTMS is built on a modern **Decoupled Architecture** separating the Single Page Application (SPA) frontend from the backend RESTful API. It integrates specialized third-party cloud services for real-time video communication (LiveKit) and generative/predictive artificial intelligence (Google Gemini, OpenAI GPT, Whisper).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT LAYER (SPA)                                   │
│  React 18 + Vite | React Router v6 | Tailwind CSS + Lucide | Axios + Context API       │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ HTTPS / JSON / Multi-Part
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY & ROUTING LAYER                               │
│  Laravel 11 Routing | Rate Limiting (Throttle Middleware) | CORS & Security Headers   │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                     ┌──────────────────────┴──────────────────────┐
                     ▼                                             ▼
       ┌───────────────────────────┐                 ┌───────────────────────────┐
       │   Public API Endpoints    │                 │   Protected API Routes    │
       │   - Jobs, Application     │                 │   - Laravel Sanctum Auth  │
       │   - Public Video Tokens   │                 │   - RBAC & Permissions    │
       └─────────────┬─────────────┘                 └─────────────┬─────────────┘
                     │                                             │
                     └──────────────────────┬──────────────────────┘
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                APPLICATION & SERVICE LAYER                             │
│  Controllers: Auth, Applicant, Interview, Employee, Manpower, JobLibrary, Dashboard   │
│  Services:    NotificationService, AiScreeningService, LiveKitService, ResumeParser    │
│  Jobs/Async:  AutoScreenApplicantJob, RecommendAlternativeRolesJob, Defer() Execution  │
└──────┬───────────────────────┬───────────────────────┬───────────────────────────┬─────┘
       │                       │                       │                           │
       ▼                       ▼                       ▼                           ▼
┌──────────────┐       ┌───────────────┐       ┌───────────────┐           ┌──────────────┐
│  DATABASE    │       │     CACHE     │       │  STORAGE DISK │           │  MAIL SERVER │
│  MySQL 8.0+  │       │ File / Redis  │       │ Local/Public/ │           │  SMTP / SES  │
│  (Aiven SSL) │       │ Fast K/V Store│       │ S3 Cloud Disk │           │  (Deferred)  │
└──────────────┘       └───────────────┘       └───────────────┘           └──────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌───────────────────────┐             ┌───────────────────────┐
│   LIVEKIT WEBRTC      │             │   AI ENGINE CLOUD     │
│   Video / Audio Rooms │             │   Gemini 1.5 Pro/Flash│
│   Real-time Tokens    │             │   OpenAI GPT-4o /     │
│   Webhook Receiver    │             │   Whisper Audio StT   │
└───────────────────────┘             └───────────────────────┘
```

---

## 2. Complete Technology Stack

| Layer / Component | Technology | Version | Purpose & Description |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | 18.x | Declarative component-based UI |
| **Build Tool & Bundler**| Vite | 5.x | Ultra-fast HMR and optimized production bundling |
| **Routing** | React Router DOM | 6.x | Client-side routing with role and permission guards |
| **State & Networking** | Context API + Axios | - | Global authentication context, interceptors for JWT |
| **UI & Icons** | Tailwind CSS + Lucide | - | Responsive design system, accessible UI icons |
| **Charts & Visuals** | Chart.js / Recharts | - | Analytics, recruitment pipeline, and dashboard metrics |
| **Backend Framework** | Laravel | 11.x | Headless PHP REST API framework |
| **Language Runtime** | PHP | 8.2+ | Strong typing, fibers, JIT, high-performance execution |
| **Authentication Engine**| Laravel Sanctum | - | Lightweight token-based API authentication |
| **Database** | MySQL / MariaDB | 8.0+ | Relational data persistence with SSL encryption |
| **Database ORM** | Eloquent ORM | - | Object-Relational Mapping, query scopes, and observers |
| **Real-Time Video** | LiveKit WebRTC | Cloud / Self | Low-latency audio/video rooms for online interviews |
| **Primary AI Engine** | Google Gemini API | 1.5 Flash/Pro | Resume parsing, JD parsing, applicant screening & ranking |
| **Secondary AI Engine** | OpenAI API | GPT-4o | Fallback evaluation, alternative role recommendations |
| **Speech-to-Text (StT)**| OpenAI Whisper | v2/v3 | Audio transcription of candidate interview recordings |
| **Email Transports** | SMTP / SES / Mailgun | - | Asynchronous transactional email dispatching |
| **Templating (Mail)** | Blade Engine | - | Server-rendered responsive HTML email templates |
| **Job Queue & Deferral**| Laravel Sync / Defer | - | Non-blocking background email and AI evaluation jobs |

---

## 3. Multi-Tier Layered Architecture

### 3.1 Client Presentation Layer (Frontend)
- **Public Domain**: Career portal, dynamic job search, applicant tracking portal, resume auto-fill wizard, applicant interview room.
- **Admin & Executive Domain**:
  - **Super Admin**: System governance, custom role creation, granular permission matrix, audit log inspection.
  - **HR Admin**: ATS pipeline, AI resume screening, interview calendar, employee directory, attendance, reporting.
  - **COO**: Executive dashboard, Manpower (PRF) requisition approvals, Job Library template approvals.
  - **Department Head**: PRF creation, department requisition history, notification tracking.
- **Route Guarding**:
  - `GuestRoute`: Restricts authenticated users from accessing login/register.
  - `ProtectedRoute`: Verifies user role (`super_admin`, `hr_admin`, `coo`, `department_head`, `employee`).
  - `PermissionProtectedRoute`: Checks the user's granular database permissions in real-time before granting access to sub-features.

### 3.2 API & Middleware Layer (Backend)
- **Sanctum Middleware (`auth:sanctum`)**: Validates the incoming Bearer token in the `Authorization` header.
- **Role Middleware (`role:...`)**: Enforces coarse-grained role boundaries.
- **Rate-Limiting Middleware (`throttle:...`)**: Prevents abuse on heavy AI operations:
  - `throttle:ai-screening`
  - `throttle:ai-transcription`
  - `throttle:ai-public-parser`
- **CORS & CSRF**: Configured via `config/cors.php` and `SANCTUM_STATEFUL_DOMAINS` to safely communicate with frontend origins.

### 3.3 Business Logic & Service Layer
- **`NotificationService`**: Centralized service handling synchronized DB alerts and asynchronous emails.
- **`AiScreeningService`**: Handles prompt engineering, model failovers (Gemini primary $\rightarrow$ OpenAI secondary), JSON schema enforcement, and score calculations.
- **`ResumeParserService`**: Extracts structured text from multi-format resume files (PDF, DOCX, TXT).
- **`LiveKitService`**: Creates meeting tokens, manages room life-cycles, and validates webhook signatures.

---

## 4. Deep-Dive: Email Handling & Delivery Subsystem

ARTMS implements an **Asynchronous, Dual-Dispatch Notification Architecture**. Whenever an important event occurs (e.g., candidate applied, interview booked, user created), the system executes a persistent in-app notification insert and queues an email for background transmission.

```
                      ┌─────────────────────────────────────────┐
                      │             System Trigger              │
                      │  (e.g., Schedule Interview / Hire User) │
                      └────────────────────┬────────────────────┘
                                           │
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │    NotificationService (Entrypoint)     │
                      └────────────────────┬────────────────────┘
                                           │
                ┌──────────────────────────┴──────────────────────────┐
                ▼                                                     ▼
    ┌───────────────────────────┐                         ┌───────────────────────────┐
    │  In-App DB Notification   │                         │  dispatchAsyncMail()      │
    │  - INSERT into            │                         │  - Uses Laravel defer()   │
    │    `notifications` table  │                         │  - Non-blocking execution │
    └───────────┬───────────────┘                         └───────────┬───────────────┘
                │                                                     │
                ▼                                                     ▼
    Instant WebSocket / Polling                           ┌───────────────────────────┐
    UI Badge Updated                                      │   Mail Engine Resolution  │
                                                          │   (Mailable / Blade View) │
                                                          └───────────┬───────────────┘
                                                                      │
                                                                      ▼
                                                          ┌───────────────────────────┐
                                                          │  Blade View Compilation   │
                                                          │  (HTML Template + Props)  │
                                                          └───────────┬───────────────┘
                                                                      │
                                                                      ▼
                                                          ┌───────────────────────────┐
                                                          │  Transport Dispatch       │
                                                          │  (SMTP / Gmail / SES)     │
                                                          └───────────┬───────────────┘
                                                                      │
                                                    ┌─────────────────┴─────────────────┐
                                                    ▼                                   ▼
                                            [Success: 250 OK]                   [Fail: Catch & Log]
                                            Email Delivered                     \Log::error()
```

### 4.1 Non-Blocking Execution Model (`defer`)
In high-throughput recruitment platforms, sending emails synchronously over SMTP introduces a 1–3 second latency per HTTP request. ARTMS eliminates this bottleneck via `NotificationService::dispatchAsyncMail`:

```php
protected static function dispatchAsyncMail(callable $mailCallback): void
{
    if (function_exists('defer')) {
        defer($mailCallback); // Executes after the HTTP response has been sent to client
    } else {
        try {
            $mailCallback();
        } catch (\Throwable $e) {
            \Log::error("Async mail execution failed: " . $e->getMessage());
        }
    }
}
```

### 4.2 Email Configuration & Transports (`config/mail.php`)
The system supports multiple transport drivers configurable via `.env`:

```ini
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=notifications@artms.com
MAIL_PASSWORD=your_secure_app_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@artms.com
MAIL_FROM_NAME="ARTMS Platform"
```

- **Production Drivers Supported**: `smtp`, `ses` (AWS Simple Email Service), `postmark`, `mailgun`, `resend`.
- **Local/Staging Fallback**: `log` (writes full email bodies to `storage/logs/laravel.log`) or `array`.

### 4.3 Email Template Inventory & Trigger Matrix

All email templates are located in `artms-backend/resources/views/emails/` and are built using inline CSS for maximum email client compatibility (Gmail, Outlook, Apple Mail):

| # | Blade Template | Mailable / Method | Trigger Scenario | Target Recipient | Dynamic Parameters |
| :- | :--- | :--- | :--- | :--- | :--- |
| 1 | `user-created.blade.php` | `UserCreatedMail` | Super Admin creates a new system user | Internal Staff | `$user`, `$temporaryPassword`, `$setupUrl` |
| 2 | `otp.blade.php` | `Mail::send` | User initiates Forgot Password request | Registered User | `$user`, `$otp` (6-digit code) |
| 3 | `interview_invitation.blade.php`| `Mail::send` | HR schedules an interview with a candidate | Job Applicant | `$applicant`, `$interview`, `$stageLabel`, `$meeting_link` |
| 4 | `interview_reminder.blade.php` | `Mail::send` | Automated / manual reminder 24h prior | Job Applicant | `$applicant`, `$interview`, `$stageLabel` |
| 5 | `screening_rejection.blade.php` | `NotificationService::sendScreeningRejectionEmail` | Candidate fails AI/HR screening criteria | Job Applicant | `$applicant`, `$job_title`, `$remarks` |
| 6 | `alternative_role_recommendation.blade.php` | `NotificationService::sendAlternativeRoleRecommendationEmail` | Candidate fails role A, but AI matches role B/C | Job Applicant | `$applicant`, `$job_title`, `$recommendedJobs` |
| 7 | `system-notification.blade.php`| `SystemNotificationMail` | Status change, PRF approval, or role alert | Internal Staff | `$title`, `$message`, `$actionUrl`, `$category` |
| 8 | `ready_for_interview.blade.php`| `NotificationService::notifyEmail` | Candidate passes screening & shortlisted | Job Applicant | `$applicant`, `$job_title`, `$portal_url` |
| 9 | `hired.blade.php` | `NotificationService::notifyEmail` | Applicant status updated to "Hired" | Candidate & HR | `$applicant`, `$job_title`, `$start_date` |
| 10 | `new_application.blade.php` | `NotificationService::notifyEmail` | Candidate submits online application form | Candidate & HR | `$applicant`, `$application_code`, `$job_title` |

### 4.4 Error Handling & Fault Isolation
All email dispatches are wrapped in isolated `try-catch` blocks inside deferred callbacks. If an external SMTP server experiences network timeouts or rate limits:
1. The user's HTTP request is **never interrupted** (UI remains fast and responsive).
2. The database transaction (e.g., scheduling the interview or creating the account) remains committed.
3. The exact error trace is recorded to `storage/logs/laravel.log` via `\Log::error()`.

---

## 5. Authentication, Security & RBAC Architecture

### 5.1 Token-Based Authentication Flow
1. Client issues `POST /api/auth/login` with email and password.
2. Server validates credentials against the `users` table via `Hash::check()`.
3. Server verifies `is_active == 1`. Inactive accounts are blocked.
4. Existing tokens for the user are deleted, and a new plaintext Sanctum token is issued.
5. Client stores token in `localStorage` and includes it in all subsequent requests: `Authorization: Bearer <token>`.
6. Client Axios interceptor catches any `401 Unauthorized` responses and automatically triggers clean logout and redirect to `/login`.

### 5.2 Dynamic Role & Granular Permission Matrix

ARTMS combines **Predefined Role Types** with a **Dynamic Permission Matrix**:

```
                                  SUPER ADMIN
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
          Default Roles                                 Custom Roles
     (HR Admin, COO, Dept Head,                    (e.g., Recruiter, HR Lead,
              Employee)                               Compliance Officer)
                │                                             │
                └──────────────────────┬──────────────────────┘
                                       │
                                       ▼
                       Granular Permissions Checking
                       (e.g., `view_users`, `manage_applicants`)
```

- **Storage**: Permissions are stored in `permissions` and linked to roles via `role_permissions` pivot table.
- **Frontend Guard**: `<PermissionProtectedRoute permission="view_applicants">` verifies whether the authenticated user's assigned permissions contain the required key.
- **API Endpoint**: `GET /api/permissions/my-permissions` returns the active user's permissions array on login/boot.

---

## 6. AI Engine & Real-Time Video Subsystems

### 6.1 AI Resume Screening Pipeline
1. **Upload & Ingestion**: Candidate uploads resume (PDF/DOCX) $\rightarrow$ `ResumeParserController` extracts text.
2. **Analysis & Prompting**: `AiScreeningService` packages the candidate resume text alongside the target `JobPosting` requirements and competencies.
3. **Model Execution**:
   - Primary: Google Gemini 1.5 (`gemini-1.5-flash` or `gemini-1.5-pro`).
   - Fallback: OpenAI GPT-4o if primary hits quota or network failure.
4. **Structured JSON Output**:
   ```json
   {
     "skills_score": 85,
     "experience_score": 90,
     "education_score": 80,
     "overall_score": 86,
     "strengths": ["Strong Laravel background", "React SPA expertise"],
     "gaps": ["Lacks 5 years AWS deployment experience"],
     "recommendation": "strong_hire",
     "justification": "Candidate meets core competencies."
   }
   ```
5. **Alternative Role Matching**: If `overall_score < 70`, `RecommendAlternativeRolesJob` scans active job postings and calculates cosine similarity / keyword fit to suggest matching alternative vacancies.

### 6.2 LiveKit Real-Time Video Interview Architecture
- **Room Lifecycle**: When an interview is created, a unique LiveKit room name is generated.
- **Token Generation**:
  - Interiewer: `POST /api/interviews/{id}/livekit-token` (Sanctum protected).
  - Applicant: `POST /api/public/interviews/{id}/livekit-token` (Protected by unique applicant token).
- **In-Session Audio Transcription**: Live audio tracks are captured and processed via OpenAI Whisper to generate timestamped candidate transcripts.
- **Sentiment & Behavioral Analysis**: Transcripts are streamed to the AI analysis worker to compute live confidence, tone, and technical keyword coverage scores.
- **Post-Session Evaluation Report**: LiveKit Webhook triggers session wrap-up $\rightarrow$ synthesizes interviewer notes, transcript highlights, and scorecard metrics into an exportable PDF report.

---

## 7. Data Flow & Lifecycle Sequences

### 7.1 Complete Recruitment Lifecycle
```
[Dept Head] Creates PRF Requisition
     │
     ▼
[COO] Approves PRF Requisition
     │
     ▼
[HR Admin] Converts PRF to Public Job Posting
     │
     ▼
[Candidate] Applies on Public Portal (AI Resume Auto-fill)
     │
     ▼
[System] Auto-Dispatches `new_application.blade.php` to Candidate
     │
     ▼
[AI Screening Engine] Scores Resume (Skills, Exp, Education)
     ├──────────────────────────────────┐
     ▼                                  ▼
[Score >= 75: Shortlist]      [Score < 75: Auto-Reject / Alternative Role]
     │                                  │
     ▼                                  ▼
[HR Admin] Books Video Interview   [System] Dispatches `alternative_role_recommendation.blade.php`
     │
     ▼
[System] Dispatches `interview_invitation.blade.php`
     │
     ▼
[LiveKit Room] Conducts Online Interview + Whisper Transcription
     │
     ▼
[HR Admin] Moves Candidate to "Hired"
     │
     ▼
[System] Dispatches `hired.blade.php` + Creates Profile in Employee Directory
```

---

## 8. Caching, Rate Limiting & Guardrails

### 8.1 Rate Limiting Configuration (`app/Http/Kernel.php` / `routes/api.php`)
To protect computational and third-party AI budgets:
- `ai-screening`: Max 30 requests per minute per IP.
- `ai-public-parser`: Max 10 requests per minute per IP.
- `ai-transcription`: Max 5 concurrent transcription tasks per user.

### 8.2 Caching Layer
- **Dashboard Metrics**: Executive statistics (e.g. total headcounts, pipeline metrics) are cached for 15–60 minutes.
- **Job Library & Categories**: Common taxonomy and active job categories cached in key-value store.
- **Permissions**: User role permissions cached per session to prevent repeated SQL joins on every route request.

---

## 9. Infrastructure, Storage & File Handling

- **File Storage Disk**: Handled via Laravel's `Storage` facade (`config/filesystems.php`).
  - `storage/app/public/resumes/`: Uploaded candidate resumes (PDF, DOCX).
  - `storage/app/public/avatars/`: User and employee profile pictures.
  - `storage/app/public/documents/`: Employee compliance files, contracts, IDs.
- **Database Security**:
  - Passwords hashed using bcrypt (cost factor 12).
  - SSL enforcement for remote database instances (`MYSQL_ATTR_SSL_CA`).
  - Sensitive API tokens stored as sha256 hashes in `personal_access_tokens`.

---
*ARTMS — Architecture & Technical Specification Document*
