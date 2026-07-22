# 🚀 Quick Start: Fix Super Admin Access

## Problem
You're Super Admin but seeing "Access Denied" on the Roles page.

## Solution (2 steps)

### Step 1: Run SQL in phpMyAdmin

1. Open **phpMyAdmin**
2. Select your **ARTMS database**
3. Click **SQL** tab
4. Copy and paste **entire contents** of `SETUP_PERMISSIONS.sql` file
5. Click **Go**

You should see:
```
✅ Table 'role_permission' created
✅ 50+ permissions inserted
✅ Permissions assigned to all roles
```

### Step 2: Logout and Login

1. Click your profile in top right
2. Click **Logout**
3. Login again as Super Admin
4. Navigate to **Roles** page
5. ✅ **Should work now!**

---

## What the SQL Does

### Creates `role_permission` Table
Links roles to their allowed permissions.

### Inserts Permissions
All 50+ permissions for every page:
- `view_users`, `view_departments`, `view_roles`
- `view_job_library`, `view_job_postings`, `view_applicants`
- `view_ai_screening`, `view_interviews`, `view_pipeline`
- `view_employees`, `view_reports`
- `view_prf_approvals`, `view_job_library_approvals`, `view_job_posting_approvals`
- And many more...

### Assigns Permissions to Roles

| Role | Permissions |
|------|-------------|
| **Super Admin** | ✅ ALL (automatic `*` wildcard) |
| **HR Admin** | ✅ Job Library, Job Postings, Applicants, AI Screening, Interviews, Pipeline, Employees |
| **COO** | ✅ PRF Approvals, Job Library Approvals, Job Posting Approvals (approval-only) |
| **Department Head** | ✅ Create PRF, View Request History |
| **Employee** | ✅ Dashboard only |

---

## Why Super Admin Works Automatically

The frontend code (`usePermissions.js`) gives Super Admin a **`"*"` wildcard permission**:

```javascript
// Super Admin has ALL permissions automatically
if (user.role === "super_admin") {
  setPermissions(["*"]); // Wildcard means "all permissions"
  setLoading(false);
  return;
}
```

This means Super Admin **bypasses ALL permission checks** without needing database permissions.

**But you still need to run the SQL** to set up permissions for other roles (HR Admin, COO, etc.).

---

## Testing After Setup

### ✅ Test Super Admin
1. Login as Super Admin
2. Should access:
   - ✅ Users
   - ✅ Departments
   - ✅ Roles
   - ✅ All HR Admin pages
   - ✅ All COO pages

### ✅ Test HR Admin
1. Login as HR Admin
2. Should access:
   - ✅ Job Library
   - ✅ Job Postings
   - ✅ Applicants
   - ✅ AI Screening
3. Should see "Access Denied":
   - ❌ Users (Super Admin only)
   - ❌ Departments (Super Admin only)
   - ❌ Roles (Super Admin only)

### ✅ Test COO
1. Login as COO
2. Should access:
   - ✅ PRF Approvals
   - ✅ Job Library Approvals
   - ✅ Job Posting Approvals
3. Should see "Access Denied":
   - ❌ Job Library (cannot create/edit)
   - ❌ Job Postings (cannot create/edit)
   - ❌ Users, Departments, Roles

### ✅ Test Department Head
1. Login as Department Head
2. Should access:
   - ✅ Create Manpower Request
   - ✅ Request History
3. Should see "Access Denied":
   - ❌ Everything else

---

## Important Notes

### Access Denied Keeps Sidebar Visible
When you see "Access Denied", the **sidebar and topbar stay visible** (per your requirement). You can navigate to other pages you have access to.

### No Need to Restart Backend
The SQL only affects the database. No need to restart `php artisan serve`.

### No Need to Rebuild Frontend
The frontend code is already set up. No need to `npm run build`.

---

## If Still Not Working

### Check 1: Verify SQL Ran Successfully
```sql
-- Run this in phpMyAdmin to check:
SELECT COUNT(*) FROM role_permission WHERE role_name = 'super_admin';
-- Should return a high number (50+)
```

### Check 2: Clear Browser Cache
```javascript
// In browser console:
localStorage.clear();
// Then login again
```

### Check 3: Verify Backend Route
Test in browser:
```
http://localhost:8000/api/permissions/role/super_admin
```
Should return JSON with permissions.

### Check 4: Check Browser Console
Open DevTools (F12), check for JavaScript errors in Console tab.

---

## Files Reference

| File | Purpose |
|------|---------|
| `SETUP_PERMISSIONS.sql` | **RUN THIS IN PHPMYADMIN** |
| `PERMISSION_SYSTEM_GUIDE.md` | Full documentation |
| `ARTMS-main/src/hooks/usePermissions.js` | Permission checking logic |
| `ARTMS-main/src/routes/AppRoutes.jsx` | Protected routes |
| `artms-backend/app/Http/Controllers/PermissionController.php` | Backend API |

---

**Need More Help?** See `PERMISSION_SYSTEM_GUIDE.md` for full documentation.
