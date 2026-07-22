# 🧪 Authentication System Test Guide

## Quick Diagnosis Steps

Follow these steps to identify and fix authentication issues:

---

## Step 1: Test Backend is Running

```bash
cd artms-backend
php artisan serve
```

Open browser: `http://localhost:8000/up`
- ✅ Should return: Status 200 OK
- ❌ If fails: Backend is not running

---

## Step 2: Test Database Connection

```bash
cd artms-backend
php artisan tinker
```

```php
>>> DB::connection()->getPdo();
// Should return PDO object, not error

>>> DB::table('users')->where('role', 'super_admin')->first();
// Should return user object

>>> DB::table('permissions')->count();
// Should return 60+
```

---

## Step 3: Test Login Endpoint (No Auth Required)

```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@artms.com","password":"your_password"}' \
  -v
```

**Expected Response (200):**
```json
{
  "message": "Login successful.",
  "token": "1|xxxxxxxxxxxxxxxx",
  "user": {
    "id": 1,
    "name": "Super Admin",
    "email": "admin@artms.com",
    "role": "super_admin"
  }
}
```

**Common Errors:**

### Error: 401 Invalid credentials
**Cause:** Wrong password or email doesn't exist
**Solution:**
```sql
-- Reset password in database
UPDATE users SET password = '$2y$12$...' WHERE email = 'admin@artms.com';

-- Or create user if doesn't exist
INSERT INTO users (name, email, password, role, is_active) 
VALUES ('Super Admin', 'admin@artms.com', '$2y$12$...', 'super_admin', 1);
```

### Error: 403 Account deactivated
**Cause:** User's `is_active` is 0
**Solution:**
```sql
UPDATE users SET is_active = 1 WHERE email = 'admin@artms.com';
```

---

## Step 4: Test Authenticated Endpoint

First, save the token from Step 3:

```bash
TOKEN="1|paste_your_token_here"
```

Then test an authenticated endpoint:

```bash
curl -X GET http://localhost:8000/api/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" \
  -v
```

**Expected Response (200):**
```json
{
  "user": {
    "id": 1,
    "name": "Super Admin",
    "email": "admin@artms.com",
    "role": "super_admin",
    "is_active": 1
  }
}
```

**Common Errors:**

### Error: 401 Unauthenticated
**Causes:**
1. Token not sent correctly
2. Token expired or invalid
3. Sanctum not configured

**Solutions:**

**Check 1: Verify token is sent in header**
```bash
# Look for this line in curl output:
> Authorization: Bearer 1|xxxxx
```

**Check 2: Verify token exists in database**
```bash
php artisan tinker
```
```php
>>> DB::table('personal_access_tokens')->where('tokenable_id', 1)->get();
// Should show tokens for user ID 1
```

**Check 3: Clear Laravel cache**
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

---

## Step 5: Test Permission Endpoint (Super Admin Only)

```bash
curl -X GET http://localhost:8000/api/permissions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" \
  -v
```

**Expected Response (200):**
```json
{
  "success": true,
  "permissions": [...],
  "total": 60
}
```

**Common Errors:**

### Error: 403 Forbidden - Role Check Failed
**Cause:** User's role is not 'super_admin' or middleware blocking

**Check user's role:**
```bash
php artisan tinker
```
```php
>>> $user = DB::table('users')->where('id', 1)->first();
>>> $user->role;
// MUST return exactly: "super_admin"
```

**Fix if wrong:**
```sql
UPDATE users SET role = 'super_admin' WHERE id = 1;
```

### Error: 500 Internal Server Error
**Cause:** Permissions table doesn't exist or query error

**Check table exists:**
```bash
php artisan tinker
```
```php
>>> Schema::hasTable('permissions');
// Should return: true

>>> DB::table('permissions')->count();
// Should return: 60+
```

**Fix if table missing:**
```bash
php artisan migrate
php artisan db:seed --class=PermissionSeeder
```

---

## Step 6: Test Role Permissions Endpoint

```bash
curl -X GET http://localhost:8000/api/permissions/role/super_admin \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" \
  -v
```

**Expected Response (200):**
```json
{
  "success": true,
  "role": "super_admin",
  "permissions": [...],
  "count": 60
}
```

**This endpoint specifically fails with 403? Check:**

1. **Route protection:**
```bash
php artisan route:list --path=permissions
```

Should show:
```
GET|HEAD  api/permissions/role/{role}  ║ auth:sanctum, role:super_admin
```

2. **RoleMiddleware logic:**

The middleware checks:
- User is authenticated
- User is active
- User's role matches

**Debug the middleware:**
```php
// Add logging to RoleMiddleware.php
Log::info('Role check', [
    'user_id' => $user->id,
    'user_role' => $user->role,
    'required_roles' => $roles,
    'is_active' => $user->is_active,
]);
```

Then check logs:
```bash
tail -f storage/logs/laravel.log
```

---

## Step 7: Test Frontend Integration

### A. Check Token Storage

Open browser console (F12):

```javascript
// After logging in, check localStorage
const token = localStorage.getItem('artms_token');
const user = JSON.parse(localStorage.getItem('artms_user'));

console.log('Token:', token);
console.log('User:', user);
console.log('Role:', user?.role);

// Token should be like: "1|xxxxxxxxxx"
// Role should be exactly: "super_admin"
```

### B. Check API Calls

1. Open DevTools → Network tab
2. Navigate to Roles page
3. Look for request: `GET /api/permissions/role/super_admin`
4. Click on request
5. Check **Headers** tab:

```
Request Headers:
  Authorization: Bearer 1|xxxxxxxxxx
  Accept: application/json
  Content-Type: application/json
```

6. Check **Response** tab for error details

### C. Common Frontend Issues

**Issue: Token not being sent**
```javascript
// Check api.js interceptor
// artms-main/src/services/api.js
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('artms_token');
  console.log('Sending token:', token); // Debug log
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Issue: Wrong localStorage key**
```javascript
// Should be 'artms_token', not 'token'
localStorage.getItem('artms_token'); // ✅ Correct
localStorage.getItem('token');       // ❌ Wrong
```

---

## Step 8: Test Complete Flow

### Manual Flow Test

1. **Clear everything:**
```javascript
localStorage.clear();
location.reload();
```

2. **Login:**
- Go to: `http://localhost:5173/login`
- Enter: `admin@artms.com` / password
- Submit

3. **Check storage:**
```javascript
console.log('Token:', localStorage.getItem('artms_token'));
console.log('User:', localStorage.getItem('artms_user'));
```

4. **Navigate to Roles page:**
- Go to: `http://localhost:5173/superadmin/roles`
- Should load without 403 error ✅

5. **Check Network:**
- Open DevTools → Network
- Should see: `GET /api/permissions/all-roles` with Status 200 ✅

---

## 🔧 Quick Fixes

### Fix 1: Reset Super Admin User

```sql
-- Ensure Super Admin exists with correct role
UPDATE users 
SET role = 'super_admin', 
    is_active = 1,
    email_verified_at = NOW()
WHERE id = 1;
```

### Fix 2: Regenerate Tokens

```bash
php artisan tinker
```
```php
>>> $user = User::find(1);
>>> $user->tokens()->delete();
>>> exit
```

Then login again to get new token.

### Fix 3: Clear All Caches

```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
php artisan optimize:clear
```

### Fix 4: Rebuild Permissions Table

```bash
php artisan migrate:fresh
php artisan migrate
php artisan db:seed --class=PermissionSeeder
```

⚠️ **Warning:** `migrate:fresh` drops all tables!

### Fix 5: Check Environment

```bash
# artms-backend/.env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=artms_db
DB_USERNAME=root
DB_PASSWORD=

SANCTUM_STATEFUL_DOMAINS=localhost,localhost:5173,127.0.0.1:5173
FRONTEND_URL=http://localhost:5173
```

---

## ✅ Success Criteria

System is working correctly when:

1. ✅ `curl` login returns 200 with token
2. ✅ `curl` /api/me returns 200 with user
3. ✅ `curl` /api/permissions returns 200 with data
4. ✅ Frontend login stores token in localStorage
5. ✅ Frontend can access `/superadmin/roles`
6. ✅ Network tab shows 200 responses
7. ✅ Console has NO 403 or 500 errors

---

## 🐛 Still Not Working?

### Enable Debug Mode

**Backend:**
```bash
# artms-backend/.env
APP_DEBUG=true
```

Then check errors in:
- Browser console
- Network tab → Response
- `storage/logs/laravel.log`

**Frontend:**
```javascript
// Add to api.js
api.interceptors.request.use((config) => {
  console.log('🔵 API Request:', config.method.toUpperCase(), config.url);
  console.log('🔵 Headers:', config.headers);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('🟢 API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('🔴 API Error:', error.response?.status, error.config?.url);
    console.error('🔴 Error Data:', error.response?.data);
    return Promise.reject(error);
  }
);
```

---

**Last Updated:** January 2025  
**Version:** 1.0
