# ARTMS — AI Recruitment & Talent Management System
## Comprehensive System Overview & Technical Specification

> **System Version:** 2.0  
> **Backend:** Laravel 11 / PHP 8.2+ (REST API + Sanctum)  
> **Frontend:** React 18 / Vite / React Router v6  
> **AI Services:** OpenAI / Gemini / Whisper AI  
> **Real-Time Video:** LiveKit WebRTC Engine  

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Deep-Dive: Authentication & Login System](#2-deep-dive-authentication--login-system)
3. [Deep-Dive: Email & Notification System](#3-deep-dive-email--notification-system)
4. [Recruitment & Applicant Tracking System (ATS)](#4-recruitment--applicant-tracking-system-ats)
5. [AI Screening & Candidate Evaluation Engine](#5-ai-screening--candidate-evaluation-engine)
6. [LiveKit Video Interviews & AI Analytics](#6-livekit-video-interviews--ai-analytics)
7. [Manpower Requisition & Approvals (PRF)](#7-manpower-requisition--approvals-prf)
8. [Job Library & Standardization](#8-job-library--standardization)
9. [Workforce & Employee Management](#9-workforce--employee-management)
10. [Attendance, Leaves & Payroll](#10-attendance-leaves--payroll)
11. [Role-Based Access Control (RBAC) & Permissions Matrix](#11-role-based-access-control-rbac--permissions-matrix)
12. [Audit Logging & Security Oversight](#12-audit-logging--security-oversight)
13. [Role Capabilities & Dashboard Matrix](#13-role-capabilities--dashboard-matrix)
14. [API Endpoints Summary](#14-api-endpoints-summary)

---

## 1. Executive Summary

**ARTMS (AI Recruitment and Talent Management System)** is an enterprise platform designed to automate and streamline the full talent acquisition and employee management lifecycle. It bridges recruiters, department heads, executive approvers (COO), and applicants through intelligent automation, AI-driven resume screening, real-time video interviewing with live behavioral analytics, and human resource management.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 ARTMS ECOSYSTEM                                 │
├───────────────────┬───────────────────────────────┬─────────────────────────────┤
│  Recruitment/ATS  │   AI Screening & Video Rooms  │    Workforce Management     │
│  - Job Board      │   - Automated CV Scoring      │    - Employee Directory     │
│  - Resume Parser  │   - LiveKit WebRTC Rooms      │    - Document Compliance    │
│  - Candidate Hub  │   - Whisper Audio-to-Text     │    - Attendance & Leaves    │
│  - Hiring Pipeline│   - Live Sentiment Analysis   │    - Payroll Overview       │
└───────────────────┴───────────────────────────────┴─────────────────────────────┘
```

---

## 2. Deep-Dive: Authentication & Login System

The authentication layer is driven by **Laravel Sanctum (Token-Based Bearer Authentication)** on the backend and **React Context API** on the frontend.

```
                      ┌─────────────────────────────────────────┐
                      │              ARTMS Client               │
                      └────────────────────┬────────────────────┘
                                           │
             ┌─────────────────────────────┼─────────────────────────────┐
             ▼                             ▼                             ▼
    ┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
    │  Direct Login   │           │ Forgot Password │           │  Account Setup  │
    │ (Email/Password)│           │   (6-Digit OTP) │           │ (Admin Invited) │
    └────────┬────────┘           └────────┬────────┘           └────────┬────────┘
             │                             │                             │
             ▼                             ▼                             ▼
    POST /api/auth/login        POST /api/auth/verify-otp     POST /api/auth/setup-account
             │                  POST /api/auth/reset-password            │
             ▼                                                           ▼
     Sanctum Token Issued ◄──────────────────────────────────────────────┘
             │
             ▼
    Role-Based Dashboard Redirection
```

### 2.1 Core Authentication Features

#### 1. Standard Login (`POST /api/auth/login`)
- Validates credentials using `Hash::check()`.
- Verifies account active status (`is_active`). Inactive/deactivated users receive a `403 Forbidden` error with a customized message.
- Tracks `last_login_at` timestamp and client IP (`last_login_ip`).
- Revokes previous tokens and issues a fresh Sanctum bearer token (`artms-token`).
- Records an immutable audit log entry in `AuditLog`.
- Returns token and structured user payload:
  ```json
  {
    "message": "Login successful.",
    "token": "1|xxxxxxxxxxxxxxxxxxxxxxxx",
    "user": {
      "id": 1,
      "name": "Super Admin",
      "email": "admin@artms.com",
      "avatar": "http://localhost:8000/storage/avatars/user1.jpg",
      "role": "super_admin",
      "department_id": null,
      "employee_id": null
    }
  }
  ```

#### 2. Forgot Password & 6-Digit Email OTP (`POST /api/auth/forgot-password` & `/api/auth/verify-otp`)
- Generates a cryptographically secure 6-digit numeric OTP (`otp_code`).
- Sets a 10-minute expiry window (`otp_expires_at`).
- Transmits the OTP directly to the user's verified email.
- Verifies OTP correctness before allowing password resetting.

#### 3. Password Reset (`POST /api/auth/reset-password`)
- Confirms valid OTP submission.
- Hashes and updates the user's password with `Hash::make()`.
- Clears the OTP code and revokes all active sessions/tokens.

#### 4. Account Setup for Invited Users (`POST /api/auth/setup-account`)
- When Super Admin creates a new staff account, the system generates a secure cryptographic token in `password_reset_tokens` and emails a setup link with a temporary password.
- The user accesses `/setup-account?email=...&token=...`, validates their invitation token, and creates their permanent password.
- Sets `email_verified_at` to `now()`.

#### 5. Authenticated Session Management
- **Token Verification (`GET /api/me`)**: Validates token freshness on client launch and returns user profile, department, and linked employee data.
- **Profile Updates (`PUT /api/me/profile`)**: Modifies name, contact information, and departmental data.
- **Avatar Uploads (`POST /api/me/avatar`)**: Supports direct multipart file uploads or base64 image strings saved to public storage.
- **Password Changes (`POST /api/auth/change-password`)**: Authenticated users can modify their password by confirming their current password.
- **Logout (`POST /api/auth/logout`)**: Deletes the active access token and purges client storage.

---

## 3. Deep-Dive: Email & Notification System

ARTMS utilizes a dual-channel notification architecture: **In-App Persistent Notifications** coupled with **Non-Blocking Asynchronous Emails** via `NotificationService`.

```
                        ┌───────────────────────────────┐
                        │   System Action / Trigger     │
                        └───────────────┬───────────────┘
                                        │
                         NotificationService::notifyUser()
                                        │
                ┌───────────────────────┴───────────────────────┐
                ▼                                               ▼
     [Database In-App Alert]                         [Asynchronous Email]
  - Inserts into `notifications` table          - Dispatched via Laravel `defer()`
  - Real-time unread badges                     - Non-blocking execution
  - Direct deep-link routing                    - Responsive HTML blade templates
```

### 3.1 Asynchronous Execution Architecture
To guarantee fast HTTP responses, all email operations run via `NotificationService::dispatchAsyncMail()`, which employs non-blocking deferrals. The API immediately completes requests while emails are compiled and transmitted in the background.

### 3.2 Complete Email Templates & Trigger Conditions

| # | Template File | Target Recipient | Redirection / Button Policy | Content & Key Functionality |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `candidate_notification.blade.php` | External Applicant | **No login button** (informational notice) | Candidate application updates, shortlisting notices, hiring notices. |
| 2 | `screening_rejection.blade.php` | External Applicant | **No login button** | Professional rejection message, constructive feedback, talent pool archiving notice. |
| 3 | `alternative_role_recommendation.blade.php` | External Applicant | Public `/jobs` link only | AI-recommended alternative vacancies with public application links. |
| 4 | `interview_invitation.blade.php` | External Applicant | Direct Video Room link | Dynamic stage badge, interview date/time, LiveKit public video room link. |
| 5 | `interview_reminder.blade.php` | External Applicant | Direct Video Room link | Schedule confirmation, video room link, camera/microphone readiness tips. |
| 6 | `system-notification.blade.php` | Internal Staff | Deep-link to internal portal / approvals | Event title, summary description, category badge (alert, approval, info), CTA button to app URL. |
| 7 | `otp.blade.php` | Internal Staff | N/A (Code only) | 6-digit bold OTP security code, 10-minute expiry warning, security advice. |
| 8 | `user-created.blade.php` | New Internal Staff | Password setup link | Temporary password, secure account setup button, initial login guidance. |

> **Applicant Email Isolation Rule**: External applicants do not have internal staff login accounts. All applicant-facing email communications are strictly informational or link only to public resources (e.g. public job postings `/jobs`, public video interview rooms `/interview/:id/room`), and never contain internal admin portal login buttons.

---

## 4. Recruitment & Applicant Tracking System (ATS)

* **Public Job Portal**: Clean, responsive job board featuring search, department filters, employment type tags, and detailed qualification requirements.
* **AI-Assisted Application Form**:
  - Drag-and-drop resume upload (PDF/DOCX).
  - **AI Resume Parser** automatically extracts full name, contact info, skills, education, and experience, pre-filling the application form.
* **Application Status Tracking**: Public portal where candidates input their unique Application Code to view real-time stage progress without logging in.
* **Multi-Stage ATS Pipeline**: Visual pipeline progressing candidates through stages:
  $$\text{Applied} \longrightarrow \text{AI Screened} \longrightarrow \text{Interview 1} \longrightarrow \text{Interview 2} \longrightarrow \text{Final Interview} \longrightarrow \text{Offered} \longrightarrow \text{Hired / Rejected}$$
* **Applicant Dossier**: Unified candidate view with embedded resume viewer, interview histories, scorecard evaluations, and internal recruiter notes.

---

## 5. AI Screening & Candidate Evaluation Engine

* **Automated CV Evaluation**: Evaluates applicant credentials against job specifications to generate objective metrics:
  - **Skills Match Score (0–100%)**: Direct match against mandatory and optional technical skills.
  - **Experience Fit Score (0–100%)**: Relevant years of experience and domain background.
  - **Education Fit Score (0–100%)**: Degree relevance and academic qualifications.
  - **Overall Match Score**: Weighted aggregate score with AI reasoning summary, listed strengths, and identified skill gaps.
* **Batch Screening**: HR administrators can screen all pending candidates for a job posting with a single click.
* **Intelligent Alternative Role Matching**: When a candidate does not meet requirements for a specific posting, AI scans all other active job openings and recommends matching positions.

---

## 6. LiveKit Video Interviews & AI Analytics

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         LIVEKIT VIDEO INTERVIEW SUITE                           │
├───────────────────────────────┬─────────────────────────────────────────────────┤
│ Real-Time Video / Audio Room  │ - WebRTC low-latency streaming via LiveKit      │
│                               │ - Separate interviewer & candidate views        │
├───────────────────────────────┼─────────────────────────────────────────────────┤
│ Live Speech-to-Text           │ - Whisper AI / real-time audio transcription    │
│                               │ - Timecoded speaker diarization                 │
├───────────────────────────────┼─────────────────────────────────────────────────┤
│ Behavioral & Sentiment Engine │ - Real-time candidate confidence & tone analysis│
│                               │ - Key technical topic and sentiment tracking    │
├───────────────────────────────┼─────────────────────────────────────────────────┤
│ Post-Session Evaluation       │ - AI-generated comprehensive interview summary  │
│                               │ - Downloadable candidate assessment report      │
└───────────────────────────────┴─────────────────────────────────────────────────┘
```

* **Interactive Calendar**: Visual scheduling calendar with conflict prevention and interview stage tracking.

---

## 7. Manpower Requisition & Approvals (PRF)

1. **Requisition Creation (Department Head)**: Submits Personnel Requisition Forms (PRF) specifying requested headcount, job specifications, employment type, urgency, and budget justification.
2. **HR Review**: HR Admin reviews department requests for organizational alignment and budget feasibility.
3. **Executive Approval (COO)**: COO conducts final review and approves or rejects requisitions with feedback.
4. **1-Click Job Posting Conversion**: Approved manpower requests can be instantly converted into public job postings.

---

## 8. Job Library & Standardization

* **Standardized Job Descriptions**: Centralized repository of approved organizational roles, responsibilities, salary ranges, and competencies.
* **AI Job Document Parser**: Extracts structured job titles, duties, and qualification requirements from uploaded PDF/DOCX job descriptions.
* **Governance Pipeline**: New role definitions created by HR require COO approval before being published for recruitment.

---

## 9. Workforce & Employee Management

* **Employee Directory**: Central database storing profile records, job titles, department assignments, emergency contacts, and employment history.
* **Document Compliance**: Secure document repository for contracts, identification IDs, clearances, and certifications with verification statuses (`Pending`, `Verified`, `Rejected`).
* **Clearance & Offboarding**: Managed exit workflows tracking department sign-offs, asset returns, and termination records.
* **Audit Trail**: Logs all historical modifications made to employee records.

---

## 10. Attendance, Leaves & Payroll

* **Attendance Tracking**: Daily clock-in/out records, work hours calculation, and summary reporting.
* **Leave Management**: Leave application submission, balance tracking, and multi-tier approval workflows.
* **Payroll Overview**: Payroll cycle generation, allowance/deduction tracking, and salary release management.

---

## 11. Role-Based Access Control (RBAC) & Permissions Matrix

ARTMS combines **Role-Level Route Guards** with a **Dynamic Permission Matrix**:

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

### Granular System Permissions:
- **User & Access Control**: `view_users`, `manage_users`, `view_roles`, `manage_roles`, `view_departments`, `manage_departments`
- **Recruitment & Approvals**: `view_manpower_requests`, `manage_manpower_requests`, `view_prf_approvals`, `view_job_library`, `manage_job_library`, `view_job_library_approvals`, `view_job_postings`, `manage_job_postings`
- **ATS & Screening**: `view_applicants`, `manage_applicants`, `view_ai_screening`, `manage_ai_screening`, `view_pipeline`, `view_interviews`, `manage_interviews`
- **Workforce & Compliance**: `view_employees`, `manage_employees`, `view_reports`, `view_audit_logs`

---

## 12. Audit Logging & Security Oversight

* **Immutable Action Tracking**: Automatically logs security events (logins, logouts, password resets, account activations), data creations, updates, and deletions.
* **Context Capture**: Captures action type, module, actor user ID, email, IP address, and timestamp.
* **Super Admin Audit Viewer**: Searchable log interface for compliance and security reviews.

---

## 13. Role Capabilities & Dashboard Matrix

| Role | Key Capabilities & Dashboards |
| :--- | :--- |
| **Super Admin** | Full platform control, user account management, custom roles & permission matrix, audit logs, oversight over all HR/ATS operations, system settings. |
| **HR Admin** | Candidate pipeline management, AI resume screening, job postings, LiveKit video interviews, employee records, attendance, and analytics. |
| **COO** | Executive dashboard, PRF/Manpower requisition approvals, Job Library role approvals, high-level recruitment metrics. |
| **Department Head** | PRF creation, requisition history tracking, department employee monitoring, notification center. |
| **Employee** | Profile management, document uploads, leave requests, attendance viewing. |
| **Candidate (Public)** | Job portal browsing, AI resume parsing application, application tracking by code, video interview room access. |

---

## 14. API Endpoints Summary

```
Public Endpoints (/api/public/*)
├── GET   /health                           - System health & database status
├── GET   /job-postings                     - Public job board listings
├── GET   /job-postings/{id}                - Detailed job posting view
├── POST  /applicants                       - Submit job application
├── POST  /applicants/track                 - Track application by Application Code
├── POST  /parse-resume                     - AI resume extraction (Rate Limited)
├── POST  /interviews/{id}/livekit-token    - Applicant video room token
└── POST  /interviews/{id}/transcribe-audio - Audio transcript generator

Authentication Endpoints (/api/auth/*)
├── POST  /login                            - User login (Sanctum Token)
├── POST  /logout                           - Revoke active token
├── POST  /forgot-password                  - Request 6-digit OTP
├── POST  /verify-otp                       - Validate OTP code
├── POST  /reset-password                   - Reset password with OTP
├── POST  /setup-account                    - Setup invited account with token
└── POST  /change-password                  - Update password (Authenticated)

Core Protected Endpoints (/api/*)
├── GET   /me                               - Current authenticated user & relations
├── PUT   /me/profile                       - Update user profile
├── POST  /me/avatar                        - Upload user profile picture
├── GET   /notifications                    - In-app notification list
├── GET   /dashboard/{role}                 - Role-specific dashboard statistics
├── API   /users                            - Super Admin user management
├── API   /roles                            - Custom roles & permission matrix
├── API   /departments                      - Department management
├── API   /job-library                      - Job Library templates
├── API   /job-postings                     - Job posting management
├── API   /applicants                       - Applicant Tracking System
├── API   /ai/*                             - AI screening, scoring & rankings
├── API   /interviews                       - Video interview scheduling & reports
├── API   /employees                        - Employee directory & compliance
├── API   /attendance                       - Attendance & summary logs
├── API   /leaves                           - Leave management
└── API   /manpower-requests                - PRF creation & approval workflow
```

---
*ARTMS — AI Recruitment & Talent Management System*
