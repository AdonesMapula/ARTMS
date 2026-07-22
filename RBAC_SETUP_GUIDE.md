# 🔐 RBAC System Setup Guide - Complete Redesign

## 🎯 What's New

This is a **complete redesign** of the permission system with:

### ✅ Key Improvements
1. **Guaranteed Super Admin Access** - 9 different bypass checks ensure Super Admin NEVER gets locked out
2. **Boolean Permission System** - Simple true/false columns in database (no complex pivot tables)
3. **Correct localStorage Key** - Uses `artms_user` (not `user`)
4. **Immediate Updates** - Permission changes apply after logout/login
5. **Multiple Fallbacks** - System works even if API fails
6. **Clean Code** - Well-documented, easy to maintain

---

## 🚀 Installation Steps

### Step 1: Run New SQL Setup (5 minutes)

1. Open **phpMyAdmin**
2. Select database `artms_db`
3. Click **SQL** tab
4. Open the file `NEW_RBAC_SETUP.sql`
5. Copy **ALL** contents
6. Paste into phpMyAdmin
7. Click **"Go"** button
8. Wait for success message

**Expected Output:**
```
✅ Total Permissions: 70+
✅ Super Admin Permissions: 70+
✅ HR Admin Permissions: 30+
✅ COO Permissions: 15+
✅ Department Head Permissions: 7
✅ Employee Permissions: 2
```

---

### Step 2: Clear Browser Cache (30 seconds)

**Open browser console (F12) and run:**
```javascript
localStorage.clear();
location.reload();
```

**Or manually:**
1. Press `F12`
2. Go to **Application** tab
3. Click **Local Storage** > your site
4. Right-click > **Clear**
5. Reload page (`F5`)

---

### Step 3: Login as Super Admin (10 seconds)

1. Go to login page
2. Enter Super Admin credentials
3. Login

---

### Step 4: Test Everything (2 minutes)

#### ✅ Test Super Admin Access
1. Go to **Users** page → Should work ✅
2. Go to **Departments** page → Should work ✅
3. Go to **Roles & Permissions** page → Should work ✅
4. Console shows **NO warnings** ✅

#### ✅ Test Permission Management
1. Click **"Manage Permissions"** on **HR Admin**
2. Modal opens showing permissions
3. Uncheck "View Job Library"
4. Click **"Save"**
5. Success message appears ✅

#### ✅ Test Other Roles (if you have test accounts)
1. Logout from Super Admin
2. Login as **HR Admin**
3. Try to access **Job Library** → Should see "Access Denied" ❌
4. Try to access **Roles** page → Should see "Access Denied" ❌
5. Sidebar stays visible ✅

---

## 📊 New Database Structure

### Old System (WRONG)
```
role_permission table (pivot table)
├── id
├── role_name
└── permission_id

Problems:
- Complex joins needed
- Hard to update
- Easy to create inconsistent data
- Can lock out Super Admin
```

### New System (CORRECT)
```
permissions table
├── id
├── name (e.g., "view_users")
├── display_name (e.g., "View Users")
├── description
├── resource (e.g., "users")
├── super_admin (1 = yes, 0 = no)  ← Boolean!
├── hr_admin (1 = yes, 0 = no)     ← Boolean!
├── coo (1 = yes, 0 = no)          ← Boolean!
├── department_head (1 = yes, 0 = no)
└── employee (1 = yes, 0 = no)

Advantages:
- Simple SELECT queries
- Fast UPDATE statements
- Super Admin column always 1 (can't be changed)
- Easy to understand and debug
```

---

## 🔧 How It Works

### Super Admin Bypass Checks

The system has **9 different checks** to ensure Super Admin always has access:

#### Frontend (usePermissions.js)
1. **Check #1-3**: During permission loading (localStorage check, wildcard grant, API fallback)
2. **Check #4-9**: During permission checking (role check, wildcard check for each method)

#### Backend (PermissionController.php)
- Super Admin endpoints return ALL permissions
- Cannot update Super Admin permissions via API
- Super Admin column in database is always 1

### Permission Flow

```
User logs in
    ↓
Frontend checks localStorage key: "artms_user"
    ↓
If role === "super_admin"
    → Grant ["*"] wildcard (bypasses all checks)
    → Done! ✅
    ↓
If role !== "super_admin"
    → Call API: GET /api/permissions/role/{role}
    → Backend returns permissions where {role} column = 1
    → Frontend stores permissions array
    → Done! ✅
    ↓
User visits protected page
    ↓
PermissionProtectedRoute checks:
    1. Is user Super Admin? → Allow ✅
    2. Does user have "*" wildcard? → Allow ✅
    3. Does user have required permission? → Allow/Deny
```

---

## 🎨 Permission Modal UI

### How Permissions Appear

When Super Admin edits a role's permissions:

#### HR Admin Modal:
```
✅ View Dashboard          (checkable - available for HR Admin)
✅ View Job Library        (checkable - available for HR Admin)
✅ Create Job Postings     (checkable - available for HR Admin)
🔒 View Users              (locked - NOT available for HR Admin)
🔒 Manage Roles            (locked - NOT available for HR Admin)
```

#### COO Modal:
```
✅ View Dashboard          (checkable)
✅ Approve PRF             (checkable)
✅ View Job Library        (checkable)
🔒 Create Job Library      (locked - COO can only view/approve)
🔒 Edit Applicants         (locked - COO can only view)
```

#### Department Head Modal:
```
✅ View Dashboard          (checkable)
✅ Create PRF              (checkable)
✅ View Request History    (checkable)
🔒 View Job Library        (locked - not available)
🔒 Approve anything        (locked - not available)
```

---

## 📋 Role Permission Matrix

| Feature | Super Admin | HR Admin | COO | Dept Head | Employee |
|---------|-------------|----------|-----|-----------|----------|
| **System Administration** |
| Users | ✅ All | ❌ | ❌ | ❌ | ❌ |
| Departments | ✅ All | ❌ | ❌ | ❌ | ❌ |
| Roles | ✅ All | ❌ | ❌ | ❌ | ❌ |
| **Recruitment** |
| Manpower Requests | ✅ All | ✅ View All | ✅ Approve | ✅ Create Own | ❌ |
| Job Library | ✅ All | ✅ Manage | ✅ Approve | ❌ | ❌ |
| Job Postings | ✅ All | ✅ Manage | ✅ Approve | ❌ | ❌ |
| Applicants | ✅ All | ✅ Manage | ✅ View | ❌ | ❌ |
| AI Screening | ✅ All | ✅ Use | ✅ View | ❌ | ❌ |
| Interviews | ✅ All | ✅ Manage | ✅ View | ❌ | ❌ |
| Pipeline | ✅ All | ✅ Manage | ✅ View | ❌ | ❌ |
| **Employee Management** |
| Employees | ✅ All | ✅ Manage | ❌ | ❌ | ❌ |
| **General** |
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Reports | ✅ | ✅ | ✅ | ✅ | ❌ |

---

## 🐛 Troubleshooting

### Issue: Super Admin Still Locked Out

**Diagnosis Steps:**

1. **Check localStorage:**
```javascript
// In browser console (F12)
console.log(JSON.parse(localStorage.getItem("artms_user")));
```

**Expected Output:**
```javascript
{
  id: 1,
  name: "Super Admin",
  email: "admin@artms.com",
  role: "super_admin",  // ← Must be exactly this (lowercase)
  ...
}
```

**If role is wrong:**
- Logout
- Clear localStorage: `localStorage.clear()`
- Login again

2. **Check database:**
```sql
-- In phpMyAdmin
SELECT * FROM users WHERE id = 1;
```

**Expected Output:**
- `role` column should be `super_admin` (lowercase, with underscore)

**If role is wrong:**
```sql
UPDATE users SET role = 'super_admin' WHERE id = 1;
```

3. **Check permissions table:**
```sql
SELECT COUNT(*) FROM permissions WHERE super_admin = 1;
```

**Expected Output:**
- Should return 70+ (all permissions)

**If count is wrong:**
- Re-run `NEW_RBAC_SETUP.sql`

---

### Issue: Permission Changes Don't Apply

**Solution:**
1. User must **logout**
2. Clear browser cache (optional but recommended)
3. **Login again**
4. Permissions will refresh automatically

**Why?**
- Permissions are cached in localStorage for performance
- Only refreshed on login
- This is normal RBAC behavior

---

### Issue: Backend Returns 500 Error

**Check Laravel logs:**
```bash
# In artms-backend directory
tail -f storage/logs/laravel.log
```

**Common causes:**
1. **Database connection issue**
   - Check `.env` file
   - Verify database credentials

2. **Table doesn't exist**
   - Run `NEW_RBAC_SETUP.sql` again

3. **Column doesn't exist**
   - Verify permissions table has role columns
   ```sql
   DESCRIBE permissions;
   ```
   - Should show: super_admin, hr_admin, coo, department_head, employee columns

---

### Issue: Console Still Shows Warnings

**If you see warnings:**

1. **"No user found"** → Not logged in (normal before login)
2. **"EMERGENCY BYPASS"** → Hard refresh browser (`Ctrl + Shift + R`)
3. **"API failed"** → Check backend is running (`php artisan serve`)

**Clean console looks like:**
```
(No warnings! Just normal React DevTools message is fine)
```

---

## ✅ Verification Checklist

After completing setup, verify:

- [ ] SQL script executed successfully
- [ ] Database has new `permissions` table with role columns
- [ ] Browser localStorage cleared
- [ ] Logged in as Super Admin
- [ ] Can access Users page
- [ ] Can access Departments page
- [ ] Can access Roles & Permissions page
- [ ] Console shows NO warnings
- [ ] "Manage Permissions" modal opens
- [ ] Can see checkable vs locked permissions
- [ ] Can save permission changes
- [ ] Success message appears after saving
- [ ] Other roles show "Access Denied" on restricted pages
- [ ] Sidebar stays visible on "Access Denied" page

---

## 📞 Support

If you complete all steps and still have issues:

1. **Check console for errors** (F12 → Console tab)
2. **Check network requests** (F12 → Network tab)
3. **Check backend logs** (`storage/logs/laravel.log`)
4. **Verify database structure** (phpMyAdmin → permissions table)
5. **Test with this command:**
```javascript
// In browser console
const user = JSON.parse(localStorage.getItem("artms_user"));
console.log("Role:", user?.role);
console.log("Is super_admin?", user?.role === "super_admin");
```

---

## 🎉 Success Criteria

System is working correctly when:

✅ Super Admin can access ALL pages  
✅ Console is clean (no permission warnings)  
✅ Permission modal shows checkable vs locked permissions  
✅ Saving permissions shows success message  
✅ Other roles see "Access Denied" on restricted pages  
✅ Access Denied keeps sidebar/topbar visible  
✅ System NEVER locks out Super Admin under any circumstances  

---

**Status**: ✅ Production Ready  
**Last Updated**: January 2025  
**Version**: 2.0 (Complete Redesign)
