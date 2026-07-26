# ARTMS — Database Schema Documentation

> **Last Updated:** July 26, 2026
> **Database Engine:** MySQL 8.0
> **ORM:** Laravel 11 Eloquent
> **Charset:** utf8mb4 / utf8mb4_unicode_ci

---

## Table of Contents

1. [Overview](#overview)
2. [Entity Relationship Summary](#entity-relationship-summary)
3. [Schema Reference](#schema-reference)
4. [Enum Reference](#enum-reference)
5. [Key Relationships](#key-relationships)
6. [Migration History](#migration-history)

---

## Overview

ARTMS (Automated Recruitment and Talent Management System) uses a **MySQL 8.0** relational database managed through **Laravel 11 Eloquent migrations**.

| Domain | Tables |
|---|---|
| Core / Auth | departments, users, sessions, password_reset_tokens, personal_access_tokens |
| Access Control | permissions, custom_roles |
| Workforce and HR | employees, attendance_logs, leave_requests, payroll, employee_documents, performance_evaluations |
| Recruitment Pipeline | job_library, manpower_requests, job_postings, applicants, applicant_documents, applicant_notes, ai_evaluations |
| Interview and AI | interviews, interview_transcripts, ai_interview_reports |
| System | audit_logs, notifications, cache, jobs |

---

## Entity Relationship Summary

departments
  +-- users (department_id)
  |     +-- employees (user_id)
  |           +-- attendance_logs
  |           +-- leave_requests
  |           +-- payroll
  |           +-- employee_documents
  |           +-- performance_evaluations
  +-- manpower_requests (department_id)
  +-- job_postings (department_id)

job_library
  +-- manpower_requests (job_library_id)
  +-- job_postings (job_library_id)

manpower_requests
  +-- job_postings (manpower_request_id)
        +-- applicants (job_posting_id)
              +-- applicant_documents
              +-- applicant_notes
              +-- ai_evaluations
              +-- interviews
                    +-- interview_transcripts
                    +-- ai_interview_reports (1:1)

users
  +-- permissions (role-based boolean columns, no pivot table)
  +-- custom_roles (RBAC extension layer)

---

## Schema Reference


### departments

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint UNSIGNED PK | - | auto | |
| department_name | varchar(255) | No | - | |
| department_code | varchar(255) | Yes | NULL | Unique. Added 2026-07-25 |
| description | text | Yes | NULL | |
| is_active | tinyint(1) | No | 1 | Soft-disable without deleting |
| created_at | timestamp | Yes | NULL | |
| updated_at | timestamp | Yes | NULL | |

**Indexes:** department_code UNIQUE

---

### users

System accounts for all roles. Split name fields added 2026-07-25.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint UNSIGNED PK | - | auto | |
| employee_id | varchar(255) | Yes | NULL | Unique. Maps to HR employee record |
| first_name | varchar(255) | Yes | NULL | Added 2026-07-25 |
| middle_name | varchar(255) | Yes | NULL | Added 2026-07-25 |
| last_name | varchar(255) | Yes | NULL | Added 2026-07-25 |
| name | varchar(255) | No | - | Legacy full-name column |
| email | varchar(255) | No | - | Unique |
| email_verified_at | timestamp | Yes | NULL | |
| password | varchar(255) | No | - | Bcrypt hashed |
| role | enum | No | employee | super_admin, hr_admin, coo, department_head, employee |
| department_id | bigint UNSIGNED FK | Yes | NULL | -> departments.id nullOnDelete |
| is_active | tinyint(1) | No | 1 | |
| otp_code | varchar(255) | Yes | NULL | One-time password for 2FA |
| otp_expires_at | timestamp | Yes | NULL | |
| two_factor_enabled | tinyint(1) | No | 0 | |
| two_factor_secret | varchar(255) | Yes | NULL | TOTP secret |
| last_login_at | timestamp | Yes | NULL | |
| last_login_ip | varchar(255) | Yes | NULL | |
| remember_token | varchar(100) | Yes | NULL | |
| created_at | timestamp | Yes | NULL | |
| updated_at | timestamp | Yes | NULL | |
| deleted_at | timestamp | Yes | NULL | Soft delete |

**Indexes:** email UNIQUE, employee_id UNIQUE, department_id FK

---

### sessions

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | varchar(255) PK | - | Session token |
| user_id | bigint UNSIGNED | Yes | Indexed |
| ip_address | varchar(45) | Yes | IPv4 or IPv6 |
| user_agent | text | Yes | |
| payload | longtext | No | Serialized session data |
| last_activity | int | No | Unix timestamp. Indexed |

---

### password_reset_tokens

| Column | Type | Nullable | Notes |
|---|---|---|---|
| email | varchar(255) PK | - | Primary key |
| token | varchar(255) | No | Hashed reset token |
| created_at | timestamp | Yes | |

---

### personal_access_tokens

Laravel Sanctum API tokens.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint UNSIGNED PK | - | auto | |
| tokenable_type | varchar(255) | No | - | Polymorphic type |
| tokenable_id | bigint UNSIGNED | No | - | Polymorphic id |
| name | text | No | - | Token label |
| token | varchar(64) | No | - | Unique SHA-256 hash |
| abilities | text | Yes | NULL | JSON array of abilities |
| last_used_at | timestamp | Yes | NULL | |
| expires_at | timestamp | Yes | NULL | Indexed |
| created_at | timestamp | Yes | NULL | |
| updated_at | timestamp | Yes | NULL | |

---

### permissions

Flat permission table with boolean columns per role — no pivot tables.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint UNSIGNED PK | - | auto | |
| name | varchar(100) | No | - | Unique. System key e.g. view_users |
| display_name | varchar(150) | No | - | Human-readable label |
| description | text | Yes | NULL | |
| resource | varchar(50) | No | - | Category e.g. users, roles. Indexed |
| super_admin | tinyint(1) | No | 1 | Always true for super admin |
| hr_admin | tinyint(1) | No | 0 | |
| coo | tinyint(1) | No | 0 | |
| department_head | tinyint(1) | No | 0 | |
| employee | tinyint(1) | No | 0 | |
| created_at | timestamp | Yes | NULL | |
| updated_at | timestamp | Yes | NULL | |

**Indexes:** name UNIQUE, (resource, name) composite

---

### custom_roles

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint UNSIGNED PK | - | auto | |
| name | varchar(255) | No | - | Display name e.g. Manager |
| key | varchar(255) | No | - | Unique system key e.g. manager |
| description | text | Yes | NULL | |
| is_active | tinyint(1) | No | 1 | |
| created_at | timestamp | Yes | NULL | |
| updated_at | timestamp | Yes | NULL | |

**Indexes:** key UNIQUE

---

### employees

HR profile record linked 1:1 to a users row.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint UNSIGNED PK | - | auto | |
| user_id | bigint UNSIGNED FK | No | - | -> users.id cascadeOnDelete |
| department_id | bigint UNSIGNED FK | No | - | -> departments.id restrictOnDelete |
| position | varchar(255) | No | - | Job title / position name |
| employment_status | enum | No | active | active, resigned, terminated, on_leave |
| date_hired | date | No | - | |
| salary | decimal(12,2) | No | 0.00 | |
| employment_type | varchar(255) | No | regular | regular, contractual, probationary |
| address | text | Yes | NULL | |
| contact_number | varchar(255) | Yes | NULL | |
| emergency_contact_name | varchar(255) | Yes | NULL | |
| emergency_contact_number | varchar(255) | Yes | NULL | |
| date_terminated | date | Yes | NULL | |
| termination_reason | text | Yes | NULL | |
| clearance_processed | tinyint(1) | No | 0 | Exit clearance flag |
| created_at | timestamp | Yes | NULL | |
| updated_at | timestamp | Yes | NULL | |
| deleted_at | timestamp | Yes | NULL | Soft delete |


### attendance_logs

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint UNSIGNED PK | - | auto | |
| employee_id | bigint UNSIGNED FK | No | - | -> employees.id cascadeOnDelete |
| date | date | No | - | |
| time_in | time | Yes | NULL | |
| time_out | time | Yes | NULL | |
| status | enum | No | present | present, absent, late, half_day, on_leave, holiday |
| late_minutes | int | No | 0 | |
| hours_worked | decimal(5,2) | No | 0.00 | |
| remarks | text | Yes | NULL | |
| created_at | timestamp | Yes | NULL | |
| updated_at | timestamp | Yes | NULL | |

**Indexes:** (employee_id, date) UNIQUE

---

### leave_requests

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint UNSIGNED PK | - | auto | |
| employee_id | bigint UNSIGNED FK | No | - | -> employees.id cascadeOnDelete |
| leave_type | enum | No | - | sick, vacation, emergency, maternity, paternity, other |
| start_date | date | No | - | |
| end_date | date | No | - | |
| days_count | int | No | 1 | |
| reason | text | No | - | |
| status | enum | No | pending | pending, approved, rejected, cancelled |
| approved_by | bigint UNSIGNED FK | Yes | NULL | -> users.id nullOnDelete |
| approved_at | timestamp | Yes | NULL | |
| approval_remarks | text | Yes | NULL | |
| created_at | timestamp | Yes | NULL | |
| updated_at | timestamp | Yes | NULL | |

---

### payroll

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint UNSIGNED PK | - | auto | |
| employee_id | bigint UNSIGNED FK | No | - | -> employees.id cascadeOnDelete |
| basic_salary | decimal(12,2) | No | - | |
| allowance | decimal(12,2) | No | 0.00 | |
| overtime_pay | decimal(12,2) | No | 0.00 | |
| deduction | decimal(12,2) | No | 0.00 | Misc deductions |
| tax | decimal(12,2) | No | 0.00 | Withholding tax |
| sss | decimal(12,2) | No | 0.00 | SSS contribution |
| philhealth | decimal(12,2) | No | 0.00 | PhilHealth contribution |
| pagibig | decimal(12,2) | No | 0.00 | Pag-IBIG contribution |
| net_salary | decimal(12,2) | No | - | Computed net pay |
| pay_date | date | No | - | |
| pay_period | varchar(255) | No | - | e.g. 2024-01-01 to 2024-01-15 |
| status | enum | No | draft | draft, released |
| processed_by | bigint UNSIGNED FK | Yes | NULL | -> users.id nullOnDelete |
| created_at | timestamp | Yes | NULL | |
| updated_at | timestamp | Yes | NULL | |

---

### employee_documents

201-file document checklist per employee.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint UNSIGNED PK | - | auto | |
| employee_id | bigint UNSIGNED FK | No | - | -> employees.id cascadeOnDelete |
| document_type | varchar(255) | No | - | e.g. birth_cert, sss_card, tin, nbi |
| file_path | varchar(255) | Yes | NULL | Storage path |
| original_name | varchar(255) | Yes | NULL | |
| status | enum | No | required | required, submitted, verified, rejected |
| remarks | text | Yes | NULL | |
| submitted_at | timestamp | Yes | NULL | |
| verified_by | bigint UNSIGNED FK | Yes | NULL | -> users.id nullOnDelete |
| verified_at | timestamp | Yes | NULL | |
| created_at | timestamp | Yes | NULL | |
| updated_at | timestamp | Yes | NULL | |

---

### performance_evaluations

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint UNSIGNED PK | - | auto | |
| employee_id | bigint UNSIGNED FK | No | - | -> employees.id cascadeOnDelete |
| evaluated_by | bigint UNSIGNED FK | No | - | -> users.id restrictOnDelete |
| evaluation_period | varchar(255) | No | - | e.g. Q1 2024 |
| score | decimal(5,2) | Yes | NULL | Numeric score |
| rating | enum | Yes | NULL | excellent, very_good, good, needs_improvement, unsatisfactory |
| criteria_scores | json | Yes | NULL | Breakdown by criterion |
| strengths | text | Yes | NULL | |
| areas_for_improvement | text | Yes | NULL | |
| remarks | text | Yes | NULL | |
| promotion_recommended | tinyint(1) | No | 0 | |
| created_at | timestamp | Yes | NULL | |
| updated_at | timestamp | Yes | NULL | |

---

### job_library

Master catalog of standardized job definitions, subject to COO approval.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint UNSIGNED PK | - | auto | |
| job_title | varchar(255) | No | - | |
| job_description | text | No | - | |
| qualifications | json | No | - | Array of qualification strings |
| responsibilities | json | No | - | Array of responsibility strings |
| job_category | varchar(255) | Yes | NULL | e.g. Engineering, Finance |
| employment_type | varchar(255) | No | full_time | |
| salary_min | decimal(12,2) | Yes | NULL | |
| salary_max | decimal(12,2) | Yes | NULL | |
| approval_status | enum | No | pending | pending, approved, rejected |
| approved_by | bigint UNSIGNED FK | Yes | NULL | -> users.id nullOnDelete |
| approved_at | timestamp | Yes | NULL | |
| approval_remarks | text | Yes | NULL | |
| created_by | bigint UNSIGNED FK | No | - | -> users.id restrictOnDelete |
| is_active | tinyint(1) | No | 1 | |
| created_at | timestamp | Yes | NULL | |
| updated_at | timestamp | Yes | NULL | |
| deleted_at | timestamp | Yes | NULL | Soft delete |

---

### manpower_requests

Position Requisition Form (PRF) submitted by department heads.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint UNSIGNED PK | - | auto | |
| department_id | bigint UNSIGNED FK | No | - | -> departments.id restrictOnDelete |
| requested_by | bigint UNSIGNED FK | No | - | -> users.id restrictOnDelete |
| job_library_id | bigint UNSIGNED FK | Yes | NULL | -> job_library.id nullOnDelete |
| position_needed | varchar(255) | No | - | Free-text position name |
| headcount | int | No | 1 | Number of positions |
| justification | text | Yes | NULL | Business justification |
| qualifications | json | Yes | NULL | Custom qualifications override |
| responsibilities | json | Yes | NULL | Custom responsibilities override |
| needed_by | date | Yes | NULL | Deadline for hiring |
| urgency | enum | No | medium | low, medium, high, critical |
| status | enum | No | pending | pending, approved, rejected, fulfilled |
| approved_by | bigint UNSIGNED FK | Yes | NULL | -> users.id nullOnDelete |
| approved_at | timestamp | Yes | NULL | |
| approval_remarks | text | Yes | NULL | |
| fit_threshold_high | tinyint UNSIGNED | No | 75 | AI score cutoff for high fit. Added 2026-07-17 |
| fit_threshold_medium | tinyint UNSIGNED | No | 50 | AI score cutoff for medium fit. Added 2026-07-17 |
| created_at | timestamp | Yes | NULL | |
| updated_at | timestamp | Yes | NULL | |
| deleted_at | timestamp | Yes | NULL | Soft delete |


### job_postings

Published job ads derived from an approved PRF and job library entry.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint UNSIGNED PK | - | auto | |
| job_library_id | bigint UNSIGNED FK | No | - | -> job_library.id restrictOnDelete |
| department_id | bigint UNSIGNED FK | No | - | -> departments.id restrictOnDelete |
| requested_by | bigint UNSIGNED FK | No | - | -> users.id restrictOnDelete |
| manpower_request_id | bigint UNSIGNED FK | Yes | NULL | -> manpower_requests.id nullOnDelete. Added 2026-07-17 |
| vacancies_count | int | No | 1 | |
| posting_date | date | Yes | NULL | |
| closing_date | date | Yes | NULL | |
| status | enum | No | draft | draft, pending_approval, published, closed, cancelled |
| approval_status | enum | No | pending | pending, approved, rejected |
| approved_by | bigint UNSIGNED FK | Yes | NULL | -> users.id nullOnDelete |
| approved_at | timestamp | Yes | NULL | |
| approval_remarks | text | Yes | NULL | |
| is_published | tinyint(1) | No | 0 | |
| location | varchar(255) | Yes | NULL | Work location. Added 2026-07-17 |
| description | text | Yes | NULL | Custom posting description. Added 2026-07-17 |
| qualifications | json | Yes | NULL | Override qualifications from library. Added 2026-07-25 |
| responsibilities | json | Yes | NULL | Override responsibilities from library. Added 2026-07-25 |
| is_modified_from_prf | tinyint(1) | No | 0 | Flag if HR edited from PRF defaults. Added 2026-07-25 |
| created_at | timestamp | Yes | NULL | |
| updated_at | timestamp | Yes | NULL | |
| deleted_at | timestamp | Yes | NULL | Soft delete |

---

### applicants

Individual job applications submitted for a specific posting.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint UNSIGNED PK | - | auto | |
| application_id | varchar(255) | No | - | Unique human-readable ID e.g. APP-2024-00001 |
| job_posting_id | bigint UNSIGNED FK | No | - | -> job_postings.id restrictOnDelete |
| first_name | varchar(255) | No | - | |
| last_name | varchar(255) | No | - | |
| middle_name | varchar(255) | Yes | NULL | |
| email | varchar(255) | No | - | Indexed |
| phone | varchar(255) | Yes | NULL | |
| date_of_birth | date | Yes | NULL | |
| address | text | Yes | NULL | |
| gender | varchar(255) | Yes | NULL | |
| civil_status | varchar(255) | Yes | NULL | |
| nationality | varchar(255) | Yes | NULL | |
| resume_path | varchar(255) | Yes | NULL | Storage path to resume file |
| resume_original_name | varchar(255) | Yes | NULL | Original filename |
| informed_consent | tinyint(1) | No | 0 | Data privacy consent flag |
| status | varchar(255) | No | applied | Pipeline stage. Changed from ENUM to VARCHAR 2026-07-23 |
| is_shortlisted | tinyint(1) | No | 0 | HR shortlist flag |
| overall_score | decimal(5,2) | Yes | NULL | Composite score from AI + interview |
| ranking | int | Yes | NULL | Rank among applicants for same posting |
| created_at | timestamp | Yes | NULL | |
| updated_at | timestamp | Yes | NULL | |
| deleted_at | timestamp | Yes | NULL | Soft delete |

**Indexes:** application_id UNIQUE, email INDEX

---

### applicant_documents

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint UNSIGNED PK | - | auto | |
| applicant_id | bigint UNSIGNED FK | No | - | -> applicants.id cascadeOnDelete |
| document_type | varchar(255) | No | - | e.g. resume, cover_letter, certificate, id |
| file_path | varchar(255) | No | - | Storage path |
| original_name | varchar(255) | No | - | |
| mime_type | varchar(255) | Yes | NULL | |
| file_size | bigint UNSIGNED | Yes | NULL | Bytes |
| created_at | timestamp | Yes | NULL | |
| updated_at | timestamp | Yes | NULL | |

---

### applicant_notes

Internal HR notes attached to an applicant record.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | bigint UNSIGNED PK | - | |
| applicant_id | bigint UNSIGNED FK | No | -> applicants.id cascadeOnDelete |
| created_by | bigint UNSIGNED FK | No | -> users.id restrictOnDelete |
| note | text | No | |
| created_at | timestamp | Yes | |
| updated_at | timestamp | Yes | |

---

### ai_evaluations

Automated resume-screening scores produced by the AI engine per applicant.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint UNSIGNED PK | - | auto | |
| applicant_id | bigint UNSIGNED FK | No | - | -> applicants.id cascadeOnDelete |
| ai_score | decimal(5,2) | Yes | NULL | Overall AI score 0-100 |
| confidence_level | decimal(5,2) | Yes | NULL | Model confidence 0-100 |
| fit_label | enum | Yes | NULL | high, medium, low |
| qualification_match | decimal(5,2) | Yes | NULL | % of qualifications matched |
| skills_matched | json | Yes | NULL | Array of matched skills |
| skills_missing | json | Yes | NULL | Array of missing skills |
| score_breakdown | json | Yes | NULL | Structured per-criterion scores |
| ai_summary | text | Yes | NULL | Narrative summary from AI |
| ai_feedback | text | Yes | NULL | Feedback surfaced to applicant |
| hr_interpretation | text | Yes | NULL | HR override notes |
| hr_decision | enum | No | pending | qualified, not_qualified, pending |
| reviewed_by | bigint UNSIGNED FK | Yes | NULL | -> users.id nullOnDelete |
| reviewed_at | timestamp | Yes | NULL | |
| created_at | timestamp | Yes | NULL | |
| updated_at | timestamp | Yes | NULL | |

---

### interviews

Scheduled interview sessions (supports in-person, online, and live video via LiveKit).

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint UNSIGNED PK | - | auto | |
| applicant_id | bigint UNSIGNED FK | No | - | -> applicants.id cascadeOnDelete |
| job_posting_id | bigint UNSIGNED FK | No | - | -> job_postings.id restrictOnDelete |
| interview_stage | enum | No | interview_1 | interview_1, interview_2, final |
| scheduled_at | datetime | No | - | |
| location | varchar(255) | Yes | NULL | Physical location for in-person |
| meeting_link | varchar(255) | Yes | NULL | URL for online meetings |
| livekit_room_name | varchar(255) | Yes | NULL | LiveKit room identifier. Added 2026-07-19 |
| interview_type | enum | No | in_person | in_person, online, phone |
| status | enum | No | scheduled | scheduled, confirmed, active, done, cancelled, no_show |
| applicant_confirmed | tinyint(1) | No | 0 | |
| applicant_confirmed_at | timestamp | Yes | NULL | |
| interviewer_id | bigint UNSIGNED FK | Yes | NULL | -> users.id nullOnDelete |
| rating_score | decimal(5,2) | Yes | NULL | Overall interview score |
| evaluation_notes | text | Yes | NULL | Free-text notes |
| rubric_scores | json | Yes | NULL | Structured rubric scores per criterion |
| ai_summary | text | Yes | NULL | AI-generated interview summary |
| ai_recommendation | text | Yes | NULL | AI hiring recommendation |
| hr_decision | enum | No | pending | pass, fail, pending |
| invitation_sent | tinyint(1) | No | 0 | Email invite sent flag |
| reminder_sent | tinyint(1) | No | 0 | Reminder email sent flag |
| created_at | timestamp | Yes | NULL | |
| updated_at | timestamp | Yes | NULL | |

---

### interview_transcripts

Real-time speech-to-text segments captured during a LiveKit video interview.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint UNSIGNED PK | - | auto | |
| interview_id | bigint UNSIGNED FK | No | - | -> interviews.id cascadeOnDelete |
| speaker_identity | varchar(255) | No | - | LiveKit identity string e.g. hr_3, applicant_7 |
| speaker_role | enum | No | system | hr, applicant, system |
| text | text | No | - | Transcribed speech segment |
| segment_offset | int UNSIGNED | No | 0 | Seconds from interview start |
| spoken_at | timestamp | No | CURRENT_TIMESTAMP | Wall-clock time received |
| created_at | timestamp | Yes | NULL | |
| updated_at | timestamp | Yes | NULL | |

**Indexes:** (interview_id, spoken_at) composite for ordered retrieval

---

### ai_interview_reports

AI-generated soft-skill analysis (1 report per interview, enforced via UNIQUE).

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | bigint UNSIGNED PK | - | auto | |
| interview_id | bigint UNSIGNED FK | No | - | UNIQUE -> interviews.id cascadeOnDelete |
| overall_score | tinyint UNSIGNED | No | 0 | Composite soft-skill score 0-100 |
| communication_score | tinyint UNSIGNED | No | 0 | 0-100 |
| confidence_score | tinyint UNSIGNED | No | 0 | 0-100 |
| strengths | json | No | - | Array of strength objects |
| weaknesses | json | No | - | Array of weakness objects |
| hiring_recommendation | text | No | - | Narrative recommendation from Grok |
| raw_ai_response | json | No | - | Full AI response for audit/debug |
| model_used | varchar(255) | No | grok-4.5 | AI model version identifier |
| generated_by | bigint UNSIGNED FK | Yes | NULL | -> users.id nullOnDelete |
| generated_at | timestamp | Yes | NULL | |
| created_at | timestamp | Yes | NULL | |
| updated_at | timestamp | Yes | NULL | |

**Indexes:** interview_id UNIQUE

---

### audit_logs

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | bigint UNSIGNED PK | - | |
| user_id | bigint UNSIGNED FK | Yes | -> users.id nullOnDelete |
| action | varchar(255) | No | login, logout, create, update, delete, approve, reject |
| module | varchar(255) | No | user, employee, applicant, job, payroll |
| model_type | varchar(255) | Yes | Fully-qualified model class name |
| model_id | bigint UNSIGNED | Yes | Primary key of affected record |
| old_values | json | Yes | State before change |
| new_values | json | Yes | State after change |
| ip_address | varchar(255) | Yes | |
| user_agent | varchar(255) | Yes | |
| description | text | Yes | Human-readable summary |
| created_at | timestamp | Yes | |
| updated_at | timestamp | Yes | |

---

### notifications

Laravel built-in polymorphic notification store.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | uuid PK | - | UUID primary key |
| type | varchar(255) | No | Notification class FQCN |
| notifiable_type | varchar(255) | No | Polymorphic type |
| notifiable_id | bigint UNSIGNED | No | Polymorphic id |
| data | text | No | JSON payload |
| read_at | timestamp | Yes | NULL = unread |
| created_at | timestamp | Yes | |
| updated_at | timestamp | Yes | |

---

### cache / jobs (Laravel)

| Table | Purpose |
|---|---|
| cache | Key-value cache store |
| cache_locks | Atomic cache lock records |
| jobs | Queue job payloads |
| job_batches | Batched job tracking |
| failed_jobs | Failed job records for retry |


---

## Enum Reference

| Table.Column | Values |
|---|---|
| users.role | super_admin, hr_admin, coo, department_head, employee |
| employees.employment_status | active, resigned, terminated, on_leave |
| attendance_logs.status | present, absent, late, half_day, on_leave, holiday |
| leave_requests.leave_type | sick, vacation, emergency, maternity, paternity, other |
| leave_requests.status | pending, approved, rejected, cancelled |
| payroll.status | draft, released |
| employee_documents.status | required, submitted, verified, rejected |
| performance_evaluations.rating | excellent, very_good, good, needs_improvement, unsatisfactory |
| job_library.approval_status | pending, approved, rejected |
| manpower_requests.urgency | low, medium, high, critical |
| manpower_requests.status | pending, approved, rejected, fulfilled |
| job_postings.status | draft, pending_approval, published, closed, cancelled |
| job_postings.approval_status | pending, approved, rejected |
| applicants.status | VARCHAR(255) - applied, ai_screening, screening_passed, screening_failed, interview_1_scheduled, interview_1_done, interview_2_scheduled, interview_2_done, for_hiring, hired, rejected, withdrawn |
| ai_evaluations.fit_label | high, medium, low |
| ai_evaluations.hr_decision | qualified, not_qualified, pending |
| interviews.interview_stage | interview_1, interview_2, final |
| interviews.interview_type | in_person, online, phone |
| interviews.status | scheduled, confirmed, active, done, cancelled, no_show |
| interviews.hr_decision | pass, fail, pending |
| interview_transcripts.speaker_role | hr, applicant, system |

> **Note:** applicants.status was changed from ENUM to VARCHAR(255) in migration 2026_07_23 to allow flexible pipeline status values without requiring schema migrations for new stages.

---

## Key Relationships

`
departments      1 --* users
departments      1 --* employees
departments      1 --* manpower_requests
departments      1 --* job_postings

users            1 --1 employees
users             * --* permissions  (boolean columns per role, no pivot)

job_library      1 --* manpower_requests
job_library      1 --* job_postings

manpower_requests  1 --* job_postings

job_postings     1 --* applicants
job_postings     1 --* interviews

applicants       1 --* applicant_documents
applicants       1 --* applicant_notes
applicants       1 --* ai_evaluations
applicants       1 --* interviews

interviews       1 --* interview_transcripts
interviews       1 --1 ai_interview_reports   (UNIQUE constraint)

employees        1 --* attendance_logs
employees        1 --* leave_requests
employees        1 --* payroll
employees        1 --* employee_documents
employees        1 --* performance_evaluations
`

---

## Migration History

| Migration File | Date | Description |
|---|---|---|
| 2024_01_01_000000 | 2024-01-01 | Create departments table |
| 2024_01_01_000001 | 2024-01-01 | Create users, password_reset_tokens, sessions |
| 2024_01_01_000002 | 2024-01-01 | Create cache, jobs (framework tables) |
| 2024_01_01_000003 | 2024-01-01 | Create employees |
| 2024_01_01_000004 | 2024-01-01 | Create job_library |
| 2024_01_01_000005 | 2024-01-01 | Create job_postings |
| 2024_01_01_000006 | 2024-01-01 | Create applicants |
| 2024_01_01_000007 | 2024-01-01 | Create applicant_documents |
| 2024_01_01_000008 | 2024-01-01 | Create ai_evaluations |
| 2024_01_01_000009 | 2024-01-01 | Create interviews |
| 2024_01_01_000010 | 2024-01-01 | Create applicant_notes |
| 2024_01_01_000011 | 2024-01-01 | Create attendance_logs |
| 2024_01_01_000012 | 2024-01-01 | Create leave_requests |
| 2024_01_01_000013 | 2024-01-01 | Create payroll |
| 2024_01_01_000014 | 2024-01-01 | Create employee_documents |
| 2024_01_01_000015 | 2024-01-01 | Create audit_logs |
| 2024_01_01_000016 | 2024-01-01 | Create notifications |
| 2024_01_01_000017 | 2024-01-01 | Create performance_evaluations |
| 2024_01_01_000018 | 2024-01-01 | Create manpower_requests |
| 2024_01_01_000020 | 2024-01-01 | Create custom_roles |
| 2025_01_23_000001 | 2025-01-23 | Create permissions (role-boolean design, no pivot tables) |
| 2026_07_16_013017 | 2026-07-16 | Create personal_access_tokens (Sanctum) |
| 2026_07_17_132510 | 2026-07-17 | Add manpower_request_id, location, description to job_postings |
| 2026_07_17_153020 | 2026-07-17 | Add fit_threshold_high, fit_threshold_medium to manpower_requests |
| 2026_07_19_000001 | 2026-07-19 | Add livekit_room_name and active status to interviews |
| 2026_07_19_000002 | 2026-07-19 | Create interview_transcripts |
| 2026_07_19_000003 | 2026-07-19 | Create ai_interview_reports |
| 2026_07_23_152040 | 2026-07-23 | Change applicants.status from ENUM to VARCHAR(255) |
| 2026_07_25_000001 | 2026-07-25 | Add first_name, middle_name, last_name to users |
| 2026_07_25_000002 | 2026-07-25 | Add department_code (unique) to departments |
| 2026_07_25_213318 | 2026-07-25 | Add qualifications, responsibilities, is_modified_from_prf to job_postings |

---

*Generated from Laravel migration files in artms-backend/database/migrations/*
*Total: 27 application tables + 5 Laravel framework tables = 32 tables*
