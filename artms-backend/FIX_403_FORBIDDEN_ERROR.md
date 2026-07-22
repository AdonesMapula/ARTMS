# ✅ FIX: 403 Forbidden Error - Permissions API

## Problem
```
GET http://localhost:8000/api/permissions/role/hr_admin 403 (Forbidden)
Failed to load permissions
```

## Root Cause Analysis

The 403 error occurs because the `/api/permissions/role/{role}` endpoint requires **Super Admin** access:

```php
// artms-backend/routes/api.php
Route::middleware('role:super_admin')->group(function () {
    Route::get('permissions/role/{role}', [PermissionController::class, 'getByRole']);
});
```

The RoleMiddleware checks:
1. ✅ User is authenticated (`auth:sanctum`)
2. ✅ User account is active (`is_active = 1`)  
3. ❌ User role is `super_admin` ← **THIS IS FAILING**

## Diagnosis Steps

### Step 1: Check LocalStorage

Open browser DevTools → Console and run:
```javascript
console.log('Token:', localStorage.getItem('artms_token'));
console.log('User:', JSON.parse(localStorage.getItem('artms_user')));
```

**Expected output:**
```javascript
Token: "1|abc123..." // Should exist
User: { 
  id: 1, 
  name: "Admin", 
  email: "admin@example.com",
  role: "super_admin" // Must be "super_admin"
}
```

### Step 2: Test Authentication

Visit: `http://localhost:5173/test-auth.html`

This test page will:
- ✅ Check if token exists in localStorage
- ✅ Validate token by calling `/api/me`
- ✅ Test permissions endpoint
- ✅ Show detailed error messages

### Step 3: Check Backend User

Run in `artms-backend` directory:
```bash
php artisan tinker
```

```php
$user = User::where('email', 'superadmin@artms.com')->first();
echo "Role: " . $user->role . "\n";
echo "Active: " . ($user->is_active ? 'Yes' : 'No') . "\n";
echo "Token count: " . $user->tokens()->count() . "\n";
```

**Expected:**
- Role: `super_admin`
- Active: `Yes`
- Token count: At least 1

## Solutions

### Solution 1: Login Again (Most Common)

The token might be expired or invalid.

**Steps:**
1. Logout from the application
2. Login as Super Admin again
3. Try accessing Roles & Permissions page

**Why this works:**
- Creates a fresh authentication token
- Ensures token belongs to the Super Admin user
- Clears any cached authentication state

---

### Solution 2: Check User Role in Database

If login doesn't fix it, the logged-in user might not be Super Admin.

**Check user role:**
```bash
cd artms-backend
php artisan tinker
```

```php
// Find the logged-in user by email
$user = User::where('email', 'YOUR_EMAIL@example.com')->first();
echo "Current role: " . $user->role . "\n";

// If not super_admin, update it:
$user->role = 'super_admin';
$user->save();
echo "✅ Role updated to super_admin\n";
```

---

### Solution 3: Check Account Status

User account might be deactivated.

```php
$user = User::where('email', 'YOUR_EMAIL@example.com')->first();
echo "Active status: " . ($user->is_active ? 'Yes' : 'No') . "\n";

// If deactivated, activate it:
$user->is_active = true;
$user->save();
echo "✅ Account activated\n";
```

---

### Solution 4: Clear Old Tokens

Token might be corrupted.

**Option A: Clear from frontend**
```javascript
// In browser console
localStorage.removeItem('artms_token');
localStorage.removeItem('artms_user');
// Then login again
```

**Option B: Clear from backend**
```bash
php artisan tinker
```

```php
// Clear all tokens for a user
$user = User::where('email', 'YOUR_EMAIL@example.com')->first();
$user->tokens()->delete();
echo "✅ All tokens deleted\n";
// Then login again to get a fresh token
```

---

### Solution 5: Verify Backend is Running

Make sure Laravel dev server is running:

```bash
cd artms-backend
php artisan serve
```

Should output:
```
Server running on [http://127.0.0.1:8000]
```

---

### Solution 6: Check CORS Configuration

If frontend can't reach backend, check CORS settings.

**File:** `artms-backend/config/cors.php`

Should allow frontend origin:
```php
'allowed_origins' => ['http://localhost:5173', 'http://localhost:3000'],
```

---

## Quick Test Checklist

Run these commands to verify everything:

```bash
# 1. Check database schema (should show boolean columns)
cd artms-backend
php test-permissions-api.php

# 2. Check auth configuration
php test-auth-debug.php

# 3. Verify routes are registered
php artisan route:list --path=permissions

# 4. Check Super Admin exists
php artisan tinker --execute="User::where('role', 'super_admin')->count()"
```

---

## Prevention

### Always Login as Super Admin

Only Super Admin can:
- View all permissions
- Manage permissions for any role
- Access `/api/permissions/role/{role}` endpoints

Other roles (HR Admin, COO, Department Head) **cannot** access the permissions API, even for their own role.

### Token Expiration

Sanctum tokens have a default expiration. If working for long periods:
1. Backend logs might show expired tokens
2. Solution: Login again to refresh token

---

## Expected Behavior After Fix

### ✅ Working Flow:

1. **Login as Super Admin**
   ```
   POST /api/login
   Body: { "email": "superadmin@artms.com", "password": "password" }
   Response: { "token": "1|abc123...", "user": { "role": "super_admin" } }
   ```

2. **Navigate to Roles & Permissions**
   - URL: http://localhost:5173/super-admin/roles
   - Page loads successfully

3. **Click "Manage Permissions"**
   ```
   GET /api/permissions/role/hr_admin
   Headers: { "Authorization": "Bearer 1|abc123..." }
   Response: { "success": true, "permissions": [...], "count": 41 }
   ```

4. **Modal Opens**
   - Shows all 62 permissions
   - HR Admin has 41 selected
   - Super Admin can modify and save

5. **Save Changes**
   ```
   POST /api/permissions/role/hr_admin
   Body: { "permission_ids": [1, 2, 3, ...] }
   Response: { "success": true, "message": "Permissions updated" }
   ```

---

## Debug Commands

### Check current user authentication:
```bash
curl http://localhost:8000/api/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test permissions endpoint directly:
```bash
curl http://localhost:8000/api/permissions/role/hr_admin \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Accept: application/json"
```

### Expected responses:

**Success (200):**
```json
{
  "success": true,
  "role": "hr_admin",
  "permissions": [ ... ],
  "count": 41
}
```

**Forbidden (403):**
```json
{
  "message": "Forbidden. You do not have the required role."
}
```

**Unauthorized (401):**
```json
{
  "message": "Unauthenticated."
}
```

---

## Still Not Working?

1. **Open browser DevTools → Network tab**
2. **Click "Manage Permissions" button**
3. **Find the failed request** (`permissions/role/hr_admin`)
4. **Check Request Headers:**
   - ✅ `Authorization: Bearer ...` should be present
   - ✅ Token should match localStorage value
5. **Check Response:**
   - Read the exact error message
   - Check response status code

6. **Check Laravel logs:**
```bash
cd artms-backend
tail -f storage/logs/laravel.log
```

---

## Summary

**Most Common Fix:**
```bash
1. Logout from application
2. Login as Super Admin (superadmin@artms.com)
3. Navigate to Roles & Permissions
4. Click "Manage Permissions" ✅ Should work now!
```

**If that doesn't work:**
- Use `test-auth.html` page to diagnose
- Check user role in database
- Verify account is active
- Clear old tokens and login again

---

**Status**: Solution provided  
**Test Page**: http://localhost:5173/test-auth.html  
**Backend Test**: `php test-auth-debug.php`
