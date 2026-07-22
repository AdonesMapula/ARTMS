# ARTMS Permission System - Complete Guide

## 🎯 Quick Start

### For Super Admin Access Issue

**Problem:** You're Super Admin but seeing "Access Denied" on Roles page.

**Solution:** Run this SQL in phpMyAdmin, then **logout and login again**:

```sql
-- Run the full SETUP_PERMISSIONS.sql file
-- OR run these 3 quick commands:

-- 1. Create table (if not exists)
CREATE TABLE IF NOT EXISTS role_permission (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) NOT NULL,
    permission_id INT NOT NULL,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_permission (role_name, permission_id)
);

-- 2. Insert view_roles permission (if not exists)
INSERT IGNORE INTO permissions (name, display_name, description, resource) 
VALUES ('view_roles', 'View Roles', 'Can view roles page', 'roles');

-- 3. Assign to super_admin
INSERT IGNORE INTO role_permission (role_name, permission_id)
SELECT 'super_admin', id FROM permissions WHERE name = 'view_roles';
```

**But Actually:** The frontend code gives Super Admin `"*"` wildcard permission automatically, so you don't even need database permissions! Just **logout and login again**.

---

## 📋 System Overview

### How It Works

1. **Super Admin** gets `"*"` wildcard permission (hardcoded in `usePermissions.js`)
   - Bypasses ALL permission checks
   - No database permissions needed
   - Automatic access to everything

2. **Other Roles** (HR Admin, COO, DepartmentHead) load permissions from database
   - Fetch permissions via `/api/permissions/role/{role}`
   - If no permissions = Access Denied
   - If missing permission = Access Denied with sidebar/topbar visible

3. **Access Denied Behavior**
   - Shows inline "Access Denied" message
   - Sidebar and Topbar stay visible (per your requirement)
   - Users can navigate to other pages they have access to

---

## 🗄️ Database Schema

### 1. `permissions` table (already exists in your database)

```sql
CREATE TABLE permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) UNIQUE NOT NULL,  -- 'view_users', 'view_roles', etc.
    display_name VARCHAR(255),          -- 'View Users', 'View Roles', etc.
    description TEXT,
    resource VARCHAR(100),              -- 'users', 'roles', 'departments', etc.
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### 2. `role_permission` table (needs to be created)

```sql
CREATE TABLE role_permission (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) NOT NULL,     -- 'super_admin', 'hr_admin', etc.
    permission_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_permission (role_name, permission_id)
);
```

---

## 🔑 Permission List

### Page Access Permissions (Required for route access)

| Permission | Page | Who Gets It |
|-----------|------|-------------|
| `view_dashboard` | Dashboard | All roles |
| `view_users` | Users Management | Super Admin only |
| `view_departments` | Departments | Super Admin only |
| `view_roles` | Roles & Permissions | Super Admin only |
| `view_manpower_request` | Create PRF (Dept Head) | Department Head |
| `view_request_history` | Request History (Dept Head) | Department Head |
| `view_manpower_requests` | All PRF Requests (HR Admin) | HR Admin, COO |
| `view_job_library` | Job Library | HR Admin, COO |
| `view_job_postings` | Job Postings | HR Admin, COO |
| `view_applicants` | Applicants | HR Admin, COO |
| `view_ai_screening` | AI Screening | HR Admin, COO |
| `view_interviews` | Interviews | HR Admin, COO |
| `view_pipeline` | Recruitment Pipeline | HR Admin, COO |
| `view_employees` | Employees | HR Admin |
| `view_reports` | Reports & Analytics | All (except Employee) |
| `view_prf_approvals` | PRF Approvals (COO) | COO only |
| `view_job_library_approvals` | Job Library Approvals (COO) | COO only |
| `view_job_posting_approvals` | Job Posting Approvals (COO) | COO only |

### Action Permissions (for future button/feature access)

These are set up but not yet used in the UI:

- `create_users`, `edit_users`, `delete_users`, `manage_users`
- `create_departments`, `edit_departments`, `delete_departments`, `manage_departments`
- `create_roles`, `edit_roles`, `delete_roles`, `manage_roles`
- `create_manpower_requests`, `edit_manpower_requests`, `delete_manpower_requests`, `approve_manpower_requests`
- `create_job_library`, `edit_job_library`, `delete_job_library`, `manage_job_library`, `approve_job_library`
- `create_job_postings`, `edit_job_postings`, `delete_job_postings`, `manage_job_postings`, `publish_job_postings`, `approve_job_postings`
- `create_applicants`, `edit_applicants`, `delete_applicants`, `manage_applicants`, `hire_applicants`, `reject_applicants`
- `perform_ai_screening`, `review_ai_screening`
- `create_interviews`, `edit_interviews`, `delete_interviews`, `manage_interviews`
- `manage_pipeline`, `create_employees`, `edit_employees`, `delete_employees`, `manage_employees`

---

## 👥 Role Permission Matrix

### 🔹 Super Admin
- ✅ **Automatic** `"*"` wildcard = access to EVERYTHING
- ✅ User management (create, edit, delete users)
- ✅ Department management
- ✅ Role & Permission management
- ✅ All HR Admin features (can do everything HR Admin can do)
- ✅ All COO features (can do everything COO can do)
- **Special:** Frontend gives `"*"` permission automatically (no database needed)

### 🔹 HR Admin (hr_admin)
- ✅ Dashboard & Reports
- ✅ View all Manpower Requests (PRF)
- ✅ Job Library (create, edit, delete templates)
- ✅ Job Posting (create, edit, publish job postings)
- ✅ Applicants (full management - view, edit, delete, hire, reject)
- ✅ AI Screening (run AI screening on applicants)
- ✅ Interviews (schedule, manage interviews)
- ✅ Recruitment Pipeline (manage candidate stages)
- ✅ Employees (view, manage employee records)
- ❌ **Cannot access:** Users, Departments, Roles (Super Admin only)
- ❌ **Cannot access:** COO approval pages

### 🔹 COO
- ✅ Dashboard & Reports
- ✅ PRF Approvals (approve/reject manpower requests)
- ✅ Job Library Approvals (approve job templates)
- ✅ Job Posting Approvals (approve job postings)
- ✅ **View-only:** Manpower Requests, Job Library, Job Postings, Applicants, Interviews, Pipeline
- ❌ **Cannot create/edit** (approval-only role)
- ❌ **Cannot access:** Users, Departments, Roles
- ❌ **Cannot access:** AI Screening, Employees

### 🔹 Department Head (department_head)
- ✅ Dashboard
- ✅ Create Manpower Request (submit PRF)
- ✅ View Request History (own requests only)
- ✅ Edit/Delete own pending requests
- ✅ Reports (view-only)
- ❌ **Cannot access:** Any HR Admin features
- ❌ **Cannot access:** Any COO features
- ❌ **Cannot access:** Users, Departments, Roles

### 🔹 Employee
- ✅ Dashboard only
- ❌ Everything else

---

## 🛠️ Setup Instructions

### Step 1: Run SQL in phpMyAdmin

1. Open phpMyAdmin
2. Select your ARTMS database
3. Click "SQL" tab
4. Paste the contents of `SETUP_PERMISSIONS.sql`
5. Click "Go"

The SQL file will:
- ✅ Create `role_permission` table (if not exists)
- ✅ Insert all 50+ permissions (using INSERT IGNORE to avoid duplicates)
- ✅ Assign permissions to all roles
- ✅ Show verification query with permission counts

### Step 2: Verify Backend Routes

Check that `artms-backend/routes/api.php` has these routes (should already exist):

```php
Route::get('permissions', [PermissionController::class, 'index']);
Route::get('permissions/role/{role}', [PermissionController::class, 'getByRole']);
Route::post('permissions/role/{role}', [PermissionController::class, 'updateRolePermissions']);
Route::get('permissions/all-roles', [PermissionController::class, 'getAllRoles']);
Route::post('permissions/sync-defaults', [PermissionController::class, 'syncDefaultPermissions']);
```

### Step 3: Test Each Role

#### Test Super Admin ✅
1. Logout from current session
2. Login as `super_admin`
3. Should access:
   - ✅ Users page
   - ✅ Departments page
   - ✅ Roles page
   - ✅ All HR Admin pages
   - ✅ All COO pages
4. Check browser console - should see `permissions: ["*"]`

#### Test HR Admin ✅
1. Logout and login as `hr_admin`
2. Should access:
   - ✅ Manpower Requests
   - ✅ Job Library
   - ✅ Job Postings
   - ✅ Applicants
   - ✅ AI Screening
   - ✅ Interviews
   - ✅ Pipeline
   - ✅ Employees
3. Should see "Access Denied" on:
   - ❌ Users (Super Admin only)
   - ❌ Departments (Super Admin only)
   - ❌ Roles (Super Admin only)
   - ❌ PRF Approvals (COO only)

#### Test COO ✅
1. Logout and login as `coo`
2. Should access:
   - ✅ PRF Approvals
   - ✅ Job Library Approvals
   - ✅ Job Posting Approvals
3. Should see "Access Denied" on:
   - ❌ Job Library (cannot create/edit, only approve)
   - ❌ Job Postings (cannot create/edit, only approve)
   - ❌ Applicants management
   - ❌ Users, Departments, Roles

#### Test Department Head ✅
1. Logout and login as `department_head`
2. Should access:
   - ✅ Manpower Request (create PRF)
   - ✅ Request History
3. Should see "Access Denied" on:
   - ❌ Everything else (all HR Admin and COO pages)

---

## 💻 Frontend Code Structure

### Files Modified/Created

#### ✅ `ARTMS-main/src/hooks/usePermissions.js`
- Loads permissions from backend
- **Super Admin bypass:** If `user.role === "super_admin"`, sets `permissions: ["*"]`
- Provides `hasPermission()`, `hasAnyPermission()`, `hasAllPermissions()` functions

#### ✅ `ARTMS-main/src/components/PermissionProtectedRoute.jsx`
- Wraps routes that require permissions
- Shows `<InlineAccessDenied />` if permission check fails
- Keeps sidebar/topbar visible (your requirement)

#### ✅ `ARTMS-main/src/components/InlineAccessDenied.jsx`
- Shows "Access Denied" message
- Keeps layout intact (sidebar/topbar visible)
- Suggests contacting admin

#### ✅ `ARTMS-main/src/routes/AppRoutes.jsx`
- All protected routes wrapped with `<PermissionProtectedRoute>`
- Each route has specific `permission` prop

### Usage Examples

#### Protect a Route
```jsx
<Route
  path="users"
  element={
    <PermissionProtectedRoute permission="view_users">
      <Users />
    </PermissionProtectedRoute>
  }
/>
```

#### Check Permission in Component
```jsx
import { usePermissions } from '../hooks/usePermissions';

function MyComponent() {
  const { hasPermission, loading } = usePermissions();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {hasPermission('delete_users') && (
        <button onClick={handleDelete}>Delete User</button>
      )}
    </div>
  );
}
```

#### Require Multiple Permissions
```jsx
<PermissionProtectedRoute 
  permissions={['view_reports', 'view_analytics']}
  mode="all"  // User must have ALL permissions
>
  <ReportsPage />
</PermissionProtectedRoute>
```

#### Check Any Permission (OR logic)
```jsx
const { hasAnyPermission } = usePermissions();

const canManageJobs = hasAnyPermission([
  'create_job_library',
  'edit_job_library',
  'delete_job_library'
]);
```

---

## 🐛 Troubleshooting

### Issue 1: Super Admin Sees "Access Denied"

**Symptoms:** 
- You're logged in as Super Admin
- Clicking "Roles" shows "Access Denied"

**Solution:**
1. Check browser console for errors
2. **Logout and login again** (this refreshes permissions in memory)
3. Check `localStorage.getItem('user')` - should show `role: "super_admin"`
4. Check network tab - `/api/permissions/role/super_admin` should NOT be called (Super Admin bypasses this)
5. Verify `usePermissions.js` has the Super Admin bypass code (lines 27-32)

**Quick Fix:**
```javascript
// In browser console:
localStorage.clear();
// Then login again
```

### Issue 2: HR Admin Can Access Super Admin Pages

**Symptoms:**
- HR Admin can access Users, Departments, or Roles pages

**Solution:**
1. Check `AppRoutes.jsx` - those routes should have `permission="view_users"` etc.
2. Check database - `hr_admin` should NOT have those permissions:
```sql
SELECT p.name 
FROM role_permission rp 
JOIN permissions p ON rp.permission_id = p.id 
WHERE rp.role_name = 'hr_admin' AND p.name IN ('view_users', 'view_departments', 'view_roles');
-- Should return 0 rows
```

### Issue 3: Permissions Not Loading (Infinite Loading Spinner)

**Symptoms:**
- Pages show loading spinner forever
- Console shows 404 or 500 errors

**Solution:**
1. Check backend is running: `php artisan serve`
2. Test permission endpoint directly:
```bash
curl http://localhost:8000/api/permissions/role/hr_admin
```
3. Check Laravel logs: `artms-backend/storage/logs/laravel.log`
4. Verify `role_permission` table exists:
```sql
SHOW TABLES LIKE 'role_permission';
```

### Issue 4: COO Sees Wrong Approvals

**Symptoms:**
- COO can access Job Library edit page
- COO cannot access PRF Approvals

**Solution:**
1. Check COO permissions in database:
```sql
SELECT p.name 
FROM role_permission rp 
JOIN permissions p ON rp.permission_id = p.id 
WHERE rp.role_name = 'coo';
```
Should include: `view_prf_approvals`, `view_job_library_approvals`, `view_job_posting_approvals`
2. Check `AppRoutes.jsx` - COO routes should have correct permissions:
```jsx
<Route
  path="prf-approvals"
  element={
    <PermissionProtectedRoute permission="view_prf_approvals">
      <ManpowerApprovals />
    </PermissionProtectedRoute>
  }
/>
```

---

## 🚀 Next Steps

### Completed ✅
- ✅ Permission system architecture
- ✅ `usePermissions` hook with Super Admin bypass
- ✅ `PermissionProtectedRoute` component
- ✅ `InlineAccessDenied` component (keeps sidebar/topbar visible)
- ✅ All routes protected with permissions
- ✅ Backend API endpoints (`PermissionController.php`)
- ✅ SQL setup file (`SETUP_PERMISSIONS.sql`)
- ✅ Documentation (`PERMISSION_SYSTEM_GUIDE.md`)

### Todo 🔄
1. **Run SQL setup in phpMyAdmin** (you need to do this!)
2. **Test all roles** (Super Admin, HR Admin, COO, Department Head)
3. **Optional:** Implement permission editing UI in `Roles.jsx`
   - Show list of all permissions
   - Allow Super Admin to check/uncheck permissions for each role
   - Save button calls `/api/permissions/role/{role}` endpoint
4. **Optional:** Add `PermissionGate` to `Sidebar.jsx`
   - Hide menu items user doesn't have permission for
   - Example: HR Admin shouldn't even see "Users", "Departments", "Roles" menu items
5. **Optional:** Add action-level permission checks
   - Hide "Delete" button if no `delete_users` permission
   - Disable "Approve" button if no `approve_manpower_requests` permission

---

## 📞 Support

If you encounter issues:

1. Check this guide's Troubleshooting section
2. Verify SQL setup ran successfully
3. Check browser console for JavaScript errors
4. Check backend Laravel logs for API errors
5. Test permission endpoints with `curl` or Postman

**Files to check:**
- Frontend: `ARTMS-main/src/hooks/usePermissions.js`
- Frontend: `ARTMS-main/src/routes/AppRoutes.jsx`
- Backend: `artms-backend/app/Http/Controllers/PermissionController.php`
- Backend: `artms-backend/routes/api.php`
- Database: `permissions` table, `role_permission` table

---

**Last Updated:** January 2025  
**Status:** ✅ Frontend Complete | ✅ Backend Complete | 🔄 Database Setup Required (by you)
