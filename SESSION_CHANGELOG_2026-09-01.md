# ARTMS — Comprehensive Session Changelog & System Updates
**Date:** September 1, 2026  
**Scope:** Developer Role & Portal, Database Live Inspector, Interactive Permissions, Department Head PRF History, Applicants & Employees Reseed, and Pagination Updates.

---

## Executive Summary of Changes

This update introduces a dedicated **Developer Portal** with real-time database inspection and bulk table cleanup tools, removes rigid permission locks for Super Admins, enriches Department Head PRF change visibility, reseeds sanitized **Applicants** (with live AI evaluations) and **Department Heads** (across 10 departments), enforces default login credentials, and refines the **Applicants Directory** pagination.

---

## 1. New Features

### 1.1 Developer Role & Dedicated Developer Portal
- **New Role (`developer`)**: Added native `developer` role to the authentication, authorization, and RBAC system.
- **Dedicated Route Hierarchy (`/developer/*`)**:
  - `/developer/database`: Complete database management and live table inspector.
  - `/developer/users`: Direct user management & account creation.
  - `/developer/archived-users`: Archived user recovery and permanent purge.
  - `/developer/departments`: Department configuration and head assignments.
  - `/developer/roles`: Role definitions and system permissions review.
  - `/developer/audit-logs`: System audit trail and diagnostic logs.
  - `/developer/settings`: Portal preferences.
- **Root Authorization & Middleware**:
  - Configured `RoleMiddleware.php` and `CheckPermission.php` to grant developer accounts wildcard administrative access (`*`).
  - Synced frontend hooks (`usePermissions.js`, `PermissionProtectedRoute.jsx`) to prevent 403 / Access Denied roadblocks.

### 1.2 Interactive Database Manager & Live Inspector
- **Master Multi-Select Bulk Actions**:
  - Added checkboxes for every table with a **"Check All / Uncheck All"** master toggle.
  - Added quick filter shortcuts: **"Select All Non-System Tables"** and **"Deselect Protected Tables"** (`users`, `roles`, `permissions`, `departments`, `migrations`).
  - Batch truncate with auto-increment ID resets (`ALTER TABLE ... AUTO_INCREMENT = 1`).
- **Live Database Table Inspector Modal**:
  - Clicking any table row opens a real-time data inspector displaying total records, column schemas, types, and primary keys.
  - Masked sensitive columns (e.g. `password`, `remember_token`).
  - In-modal search and pagination.

### 1.3 Super Admin Interactive Role Permissions Management
- **Unrestricted Interactive Checkboxes**: Removed hardcoded role restriction locks (`ROLE_AVAILABLE_PERMISSIONS`), giving Super Admins complete control to grant or revoke any permission across any role.
- **Batch & Category Toggles**: Added **"Grant All"**, **"Revoke All"**, and per-resource category toggles.
- **In-Modal Search**: Instant search filtering of permissions by key, label, description, or module.

### 1.4 Top AI-Ranked Candidates per Position
- **Interactive Position Filter Chips**: Added position filter chips (e.g. *All Positions*, *Software Engineer*, *HR Assistant*, *Senior Accountant*, *IT Support*, etc.) to the Applicants dashboard.
- **Dynamic AI Candidate Rankings**: Real-time ranking displaying the top 3 candidates (🥇 #1 Top, 🥈 #2 High, 🥉 #3 Rank) with composite AI scores, fit indicators, and matched skill breakdowns.

---

## 2. Updated & Enhanced Features

### 2.1 Department Head PRF Request History
- **Dual Visibility with Department Isolation**:
  - Department Heads only view manpower requests originating from their account or department.
  - HR Admins, COOs, and Super Admins retain global system visibility.
  - When changes or modifications are requested on a PRF, changes and approval remarks are clearly displayed to both HR and the respective Department Head.

### 2.2 Applicants Directory & Pagination
- **Updated Page Size**: Configured `pageSize = 9` in `Applicants.jsx` to render 9 candidate cards/rows per page.
- **Dynamic Pagination Controls**: Bottom pagination bar automatically activates when total candidates exceed 9.

### 2.3 Reseeded Applicants (Exactly 10 Real-World Candidates)
- Reseeded `applicants` table with exactly 10 comprehensive records with complete personal demographics, contact info, resume paths, and statuses.
- Attached complete `ai_evaluations` records containing:
  - `ai_score` (ranging from 58.0% to 96.5%)
  - `confidence_level` (78% to 98%)
  - `fit_label` (`high`, `medium`, `low`)
  - `qualification_match`
  - `skills_matched` & `skills_missing` JSON arrays
  - `score_breakdown` (`skills`, `experience`, `education`, `technical_fit`)
  - `ai_summary` and `ai_feedback`

### 2.4 Reseeded Department Heads (10 Department Heads Across All Departments)
- Reseeded `employees` table with 10 dedicated Department Heads:
  1. **IT Dept Head** (`depthead@artms.com`) — *Head of Information Technology* (Information Technology)
  2. **Elena Vasquez** (`elena.vasquez@artms.com`) — *Head of Human Resources* (Human Resources)
  3. **Marcus Sterling** (`marcus.sterling@artms.com`) — *Head of Finance & Accounting* (Finance)
  4. **Rodrigo Alvarez** (`rodrigo.alvarez@artms.com`) — *Head of Operations & Logistics* (Operations)
  5. **Clara Del Rosario** (`clara.delrosario@artms.com`) — *Head of Marketing & Communications* (Marketing)
  6. **Fernando Gomez** (`fernando.gomez@artms.com`) — *Head of Corporate Administration* (Administration)
  7. **Katrina Morales** (`katrina.morales@artms.com`) — *Head of Software Engineering* (Software Engineering)
  8. **Victor Navarro** (`victor.navarro@artms.com`) — *Head of Quality Assurance & Testing* (Quality Assurance)
  9. **Bianca Sy** (`bianca.sy@artms.com`) — *Head of Sales & Partnerships* (Sales & Business Dev)
  10. **Dominic Tan** (`dominic.tan@artms.com`) — *Head of Customer Support & Success* (Customer Support)
- **Full Column & 201 File Integrity**:
  - Complete fields: `employee_id`, `user_id`, `job_title`, `employment_status` (`regular`), `employment_type` (`regular`), salaries, and dates.
  - Automatically seeded 10 default 201 File Checklist documents (`employee_documents`) with status `verified`.
  - Automatically seeded 15 weekdays of realistic attendance logs (`attendance_logs`).

### 2.5 Job Templates & Job Postings Unique IDs
- Re-seeded Job Templates in Job Library (`JL-001` through `JL-015`) with unique IDs.
- Ensured Job Postings maintain distinct relational keys without duplicate identifier collisions.

---

## 3. Removed & Cleaned Up Features

| Item / Feature | Reason for Removal / Cleanup |
| :--- | :--- |
| **Artificial Permission Locks in Modal** | Removed static disabling of checkboxes (`ROLE_AVAILABLE_PERMISSIONS`) in `PermissionModal.jsx` so Super Admins have full customization freedom. |
| **25 Extraneous User Accounts** | Removed all non-default / test accounts from `users` table, strictly enforcing the 6 premade default system credentials. |
| **Duplicate Job ID Generator Artifacts** | Removed duplicate template ID assignment logic in `JobPostingSeeder.php`. |
| **Hardcoded Candidate Placeholders** | Replaced mock applicant arrays with structured database records and `ai_evaluations` links. |

---

## 4. Default System Credentials Reference

| Role | Name | Email | Default Password | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | Super Admin | `superadmin@artms.com` | `SuperAdmin@2024` | Full system control & configuration |
| **Developer** | System Developer | `developer@artms.com` | `Developer@2024` | Database management, schema tracking & diagnostics |
| **HR Admin** | HR Administrator | `hradmin@artms.com` | `HrAdmin@2024` | Recruitment pipelines, job postings & candidates |
| **COO** | Chief Operating Officer | `coo@artms.com` | `CooUser@2024` | High-level executive approvals & reporting |
| **Department Head** | Department Head | `depthead@artms.com` | `DeptHead@2024` | Manpower requests & technical evaluations |
| **Interviewer** | Interviewer User | `interviewer@artms.com` | `Interviewer@2024` | Candidate interview evaluation & scoring |

---

## 5. Modified Files & Components Summary

### Frontend (`ARTMS-main`)
- `src/pages/Admin/Applicants.jsx` — Updated pagination (`pageSize = 9`), position filter chips, and AI ranking calculations.
- `src/pages/Developer/DatabaseManager.jsx` — Master check-all bulk deletion, quick filter toolbar, and real-time live table inspector modal.
- `src/modals/PermissionModal.jsx` — Removed permission lockouts; added global Select All / Deselect All, group toggles, and live search.
- `src/layouts/DeveloperLayout.jsx` — Added Developer portal navigation menu and access links.
- `src/routes/AppRoutes.jsx` — Registered developer portal routes and permission wrappers.
- `src/hooks/usePermissions.js` — Granted wildcard permissions (`*`) to the `developer` role.
- `src/components/PermissionProtectedRoute.jsx` — Permitted developer accounts direct route access.
- `src/services/developerService.js` — Added API wrappers for `getTableData` and `bulkTruncate`.

### Backend (`artms-backend`)
- `routes/api.php` — Authorized `developer` role across users, departments, roles, permissions, and audit logs.
- `app/Http/Controllers/DatabaseController.php` — Added `tableData()` inspector and `bulkTruncate()` endpoints.
- `app/Http/Controllers/PermissionController.php` — Added `developer` role to `$validRoles` with root wildcard permissions.
- `app/Http/Middleware/CheckPermission.php` — Added `developer` role bypass check.
- `database/seeders/UserSeeder.php` — Enforced 6 default accounts with active hashes.
- `database/seeders/ApplicantSeeder.php` — Seeded 10 applicants with complete `ai_evaluations` records.
- `database/seeders/EmployeeSeeder.php` — Seeded 10 Department Heads with 201 file documents and attendance logs.
- `database/seeders/JobPostingSeeder.php` — Re-seeded unique job templates and postings.
- `database/migrations/2026_09_01_000001_add_developer_role_to_users_table.php` — Added `developer` enum to `users` table.

### Root Project Documentation
- `README.md` — Documented Developer role credentials and access capabilities.
- `SESSION_CHANGELOG_2026-09-01.md` — Generated comprehensive session changelog and update history.
