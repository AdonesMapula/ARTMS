# 🔐 Complete RBAC System Setup Guide

## 🎯 Overview

This guide walks you through setting up the complete Role-Based Access Control (RBAC) system with:
- ✅ Laravel Sanctum authentication
- ✅ Boolean permission system in MySQL
- ✅ Super Admin guaranteed access
- ✅ Granular permission management
- ✅ React frontend integration

---

## 📋 Step-by-Step Installation

### Step 1: Run Database Migrations (Required)

Open your terminal in the `artms-backend` directory:

```bash
cd artms-backend

# Run migrations to create permissions table
php artisan migrate

# Seed the permissions table with default data
php artisan db:seed --class=PermissionSeeder
```

**Expected Output:**
```
✅ Migration: 2025_01_23_000001_create_permissions_table
✅ Permissions seeded successfully!
Total permissions: 60+
```

---

### Step 2: Verify Database Tables

Open phpMyAdmin and verify:

```sql
-- Check permissions table exists
DESCRIBE permissions;

-- Should show columns:
-- id, name, display_name, description, resource
-- super_admin, hr_admin, coo, department_head, employee
-- created_at, updated_at

-- Check data was seeded
SELECT COUNT(*) FROM permissions;
-- Should return 60+

-- Verify Super Admin has all permissions
SELECT COUNT(*) FROM permissions WHERE super_admin = 1;
-- Should return 60+ (all permissions)

-- Check sample permissions
SELECT name, display_name, super_admin, hr_admin, coo 
FROM permissions 
WHERE resource = 'users' 
LIMIT 5;
```

---

### Step 3: Verify Users Table Has Correct Roles

```sql
-- Check your Super Admin user
SELECT id, name, email, role, is_active FROM users WHERE role = 'super_admin';

-- If role is wrong, update it:
UPDATE users SET role = 'super_admin' WHERE id = 1;

-- Ensure account is active
UPDATE users SET is_active = 1 WHERE id = 1;
```

**Important:** The `role` column must exactly match: `super_admin`, `hr_admin`, `coo`, `department_head`, or `employee`

---

### Step 4: Test Backend API Endpoints

Open a new terminal and start the Laravel server:

```bash
cd artms-backend
php artisan serve
```

**Test Authentication:**

1. **Login Test:**
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@artms.com","password":"your_password"}'
```

Expected response:
```json
{
  "message": "Login successful.",
  "token": "1|xxxxxxxxx",
  "user": {
    "id": 1,
    "name": "Super Admin",
    "email": "admin@artms.com",
    "role": "super_admin"
  }
}
```

2. **Test Permissions Endpoint:**
```bash
# Replace YOUR_TOKEN with the token from login response
curl -X GET http://localhost:8000/api/permissions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

Expected response:
```json
{
  "success": true,
  "permissions": [...],
  "total": 60
}
```

---

### Step 5: Clear Frontend Cache

Open browser console (F12) and run:

```javascript
localStorage.clear();
location.reload();
```

Or manually:
1. Press `F12`
2. Go to **Application** tab
3. **Local Storage** → Select your site
4. Right-click → **Clear**
5. Reload page (`F5`)

---

### Step 6: Login to React Frontend

1. Navigate to login page: `http://localhost:5173/login`
2. Enter Super Admin credentials
3. Submit form

**What happens:**
- Frontend calls `POST /api/login`
- Backend returns token + user data
- Frontend stores in localStorage:
  - Key: `artms_token` → Value: Bearer token
  - Key: `artms_user` → Value: User object with role

**Verify in console:**
```javascript
console.log(localStorage.getItem('artms_token'));
console.log(JSON.parse(localStorage.getItem('artms_user')));
```

---

### Step 7: Test Permission System

1. **Test Super Admin Access:**
   - Navigate to: `/superadmin/roles`
   - Should load without errors ✅
   - Console should be clean ✅

2. **Test Permission Management:**
   - Click "Manage Permissions" on HR Admin
   - Modal should open ✅
   - Should show checkable vs locked permissions ✅
   - Change some permissions
   - Click "Save" ✅
   - Success message should appear ✅

3. **Test Permission Changes:**
   - Logout from Super Admin
   - Login as HR Admin
   - Try to access `/superadmin/roles`
   - Should see "Access Denied" ❌
   - Sidebar should stay visible ✅

---

## 🔧 Troubleshooting

### Issue: 403 Forbidden on Permission Endpoints

**Root Cause:** Token not being sent or role middleware blocking request

**Solution 1: Verify Token is Stored**
```javascript
// In browser console
const token = localStorage.getItem('artms_token');
console.log('Token:', token);
// Should NOT be null or undefined
```

**Solution 2: Verify Token is Being Sent**
```javascript
// Check Network tab in DevTools
// Look at Request Headers for API calls
// Should see: Authorization: Bearer 1|xxxxx
```

**Solution 3: Check User Role**
```javascript
const user = JSON.parse(localStorage.getItem('artms_user'));
console.log('Role:', user?.role);
// MUST be exactly: "super_admin" (lowercase, underscore)
```

**Solution 4: Verify Backend Sanctum Config**
```bash
cd artms-backend
php artisan config:clear
php artisan cache:clear
```

---

### Issue: 500 Internal Server Error

**Root Cause:** Permissions table doesn't exist or has wrong structure

**Solution:**
```bash
cd artms-backend

# Check if migration ran
php artisan migrate:status

# If not, run it
php artisan migrate

# Seed permissions
php artisan db:seed --class=PermissionSeeder

# Verify in database
php artisan tinker
>>> DB::table('permissions')->count();
// Should return 60+
```

---

### Issue: Super Admin Still Can't Access

**Checklist:**

1. **Database Check:**
```sql
SELECT id, email, role, is_active FROM users WHERE id = 1;
-- role MUST be 'super_admin'
-- is_active MUST be 1
```

2. **Token Check:**
```javascript
// Browser console
localStorage.getItem('artms_token')
// Should return a long string starting with number|
```

3. **Logout and Login Again:**
```javascript
localStorage.clear();
location.reload();
// Then login again
```

4. **Check Network Requests:**
- Open DevTools → Network tab
- Try accessing Roles page
- Look for `/api/permissions/role/super_admin` request
- Check Response tab for error details

---

### Issue: "Table permissions doesn't exist"

**Solution:**
```bash
cd artms-backend

# Run migration
php artisan migrate

# If migration file is not detected, refresh autoloader
composer dump-autoload

# Try again
php artisan migrate

# Seed data
php artisan db:seed --class=PermissionSeeder
```

---

### Issue: CORS Errors

**Solution:**

1. **Check Laravel CORS config:**
```php
// artms-backend/config/cors.php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_origins' => ['http://localhost:5173'],
```

2. **Or use wildcard for development:**
```php
'allowed_origins' => ['*'],
```

3. **Clear config:**
```bash
php artisan config:clear
```

---

## 🎯 API Endpoint Reference

### Authentication Endpoints (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login` | Login and get token |
| POST | `/api/auth/forgot-password` | Send OTP for password reset |
| POST | `/api/auth/verify-otp` | Verify OTP code |
| POST | `/api/auth/reset-password` | Reset password with OTP |

### Permission Endpoints (Require Auth + super_admin role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/permissions` | Get all permissions |
| GET | `/api/permissions/role/{role}` | Get permissions for specific role |
| POST | `/api/permissions/role/{role}` | Update permissions for role |
| GET | `/api/permissions/all-roles` | Get permissions for all roles |
| GET | `/api/permissions/available/{role}` | Get available permissions for role |
| POST | `/api/permissions/sync-defaults` | Reset to default permissions |

---

## 📊 Database Schema

### permissions Table

```sql
CREATE TABLE permissions (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,           -- e.g., 'view_users'
    display_name VARCHAR(150) NOT NULL,          -- e.g., 'View Users'
    description TEXT,                            -- What this allows
    resource VARCHAR(50) NOT NULL,               -- Category (users, roles, etc)
    
    -- Boolean columns for each role
    super_admin TINYINT(1) DEFAULT 1,            -- Always 1
    hr_admin TINYINT(1) DEFAULT 0,               -- 0 or 1
    coo TINYINT(1) DEFAULT 0,                    -- 0 or 1
    department_head TINYINT(1) DEFAULT 0,        -- 0 or 1
    employee TINYINT(1) DEFAULT 0,               -- 0 or 1
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_resource (resource)
);
```

---

## 🔑 How It Works

### Authentication Flow

```
1. User enters email/password
   ↓
2. Frontend: POST /api/login
   ↓
3. Backend: Validates credentials
   ↓
4. Backend: Creates Sanctum token
   ↓
5. Backend: Returns {token, user}
   ↓
6. Frontend: Stores in localStorage
   - artms_token: "1|xxxxx"
   - artms_user: {id, name, email, role}
   ↓
7. Frontend: All API calls include header
   - Authorization: Bearer 1|xxxxx
```

### Permission Check Flow

```
1. User visits protected page (e.g., /superadmin/roles)
   ↓
2. React: PermissionProtectedRoute checks localStorage
   ↓
3. React: Calls usePermissions() hook
   ↓
4. Hook: Checks user role
   - If super_admin → Grant access ✅
   - If other role → Call API
   ↓
5. API: GET /api/permissions/role/{role}
   - Auth: Sanctum validates Bearer token
   - Middleware: role:super_admin checks user.role
   - Controller: Queries permissions table
   ↓
6. Backend: Returns permissions array
   ↓
7. Frontend: Stores in state
   ↓
8. Component: Checks hasPermission('view_roles')
   - If true → Show page ✅
   - If false → Show Access Denied ❌
```

### Permission Update Flow

```
1. Super Admin opens Roles page
   ↓
2. Clicks "Manage Permissions" on HR Admin
   ↓
3. Modal shows checkable permissions
   ↓
4. Super Admin checks/unchecks permissions
   ↓
5. Clicks "Save"
   ↓
6. Frontend: POST /api/permissions/role/hr_admin
   Body: {permission_ids: [1, 2, 3, ...]}
   ↓
7. Backend: Updates permissions table
   - SET hr_admin = 0 for all permissions
   - SET hr_admin = 1 for selected IDs
   ↓
8. Backend: Returns success
   ↓
9. Frontend: Shows success message
   ↓
10. HR Admin must logout/login to see changes
```

---

## ✅ Verification Checklist

After completing setup, verify:

- [ ] `permissions` table exists in database
- [ ] Table has 60+ rows
- [ ] All permissions have `super_admin = 1`
- [ ] Super Admin user has `role = 'super_admin'`
- [ ] Super Admin user has `is_active = 1`
- [ ] Laravel server is running (`php artisan serve`)
- [ ] React dev server is running (`npm run dev`)
- [ ] Browser localStorage is cleared
- [ ] Can login as Super Admin
- [ ] Token is stored in localStorage
- [ ] Can access `/superadmin/roles` page
- [ ] Can open "Manage Permissions" modal
- [ ] Can save permission changes
- [ ] Console shows NO 403 or 500 errors

---

## 🚀 Next Steps

Once system is working:

1. **Create test users for each role:**
   - HR Admin
   - COO
   - Department Head
   - Employee

2. **Test each role's access:**
   - Login as each role
   - Verify sidebar shows correct pages
   - Test permission restrictions

3. **Customize permissions:**
   - Adjust default permissions in `PermissionSeeder.php`
   - Re-run: `php artisan db:seed --class=PermissionSeeder`

4. **Production deployment:**
   - Set proper `APP_ENV=production`
   - Use strong tokens
   - Enable HTTPS
   - Configure proper CORS

---

## 📞 Support

If you still have issues after following this guide:

1. **Check Laravel logs:**
```bash
tail -f artms-backend/storage/logs/laravel.log
```

2. **Check browser console:**
- Press F12
- Look for errors in Console tab
- Check Network tab for API responses

3. **Test API directly:**
```bash
# Get a token first
TOKEN=$(curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@artms.com","password":"your_password"}' \
  | jq -r '.token')

# Test permissions endpoint
curl -X GET http://localhost:8000/api/permissions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

---

**Status:** ✅ Production Ready  
**Last Updated:** January 2025  
**Version:** 3.0 (Complete Laravel + React RBAC)
