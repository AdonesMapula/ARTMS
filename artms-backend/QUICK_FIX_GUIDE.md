# QUICK FIX GUIDE - RBAC 500 Error

## Problem
❌ **Error**: `GET /api/permissions/role/hr_admin` returns 500 error  
❌ **Impact**: Cannot open "Manage Permissions" modal

## Root Cause
Database has **old pivot table schema**, but controller expects **new boolean column schema**

## Solution (Choose One)

### ✅ Option 1: Automated Fix (RECOMMENDED)

**Windows:**
```bash
cd artms-backend
FIX_PERMISSIONS_SCHEMA.bat
```

**Mac/Linux:**
```bash
cd artms-backend
chmod +x FIX_PERMISSIONS_SCHEMA.sh
./FIX_PERMISSIONS_SCHEMA.sh
```

### ✅ Option 2: Manual Fix

```bash
cd artms-backend

# Rollback old migration
php artisan migrate:rollback --step=2

# Run new migration
php artisan migrate

# Seed permissions
php artisan db:seed --class=PermissionSeeder
```

## What This Does

1. **Drops** old `permissions` and `role_permissions` tables
2. **Creates** new `permissions` table with boolean columns:
   - `super_admin` (always 1)
   - `hr_admin`
   - `coo`
   - `department_head`  
   - `employee`
3. **Seeds** 66 default permissions with proper role assignments

## Verification

### Test in Terminal
```bash
php artisan tinker
```
```php
// Should return true
Schema::hasTable('permissions')

// Should return 66
DB::table('permissions')->count()

// Should work now! (returns permissions with hr_admin = 1)
DB::table('permissions')->where('hr_admin', 1)->count()
```

### Test API Endpoint
```bash
curl -X GET http://localhost:8000/api/permissions/role/hr_admin \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected**: 200 OK with permissions list

### Test in Frontend
1. Login to application
2. Go to **Roles & Permissions**
3. Click **"Manage Permissions"** for any role
4. Modal should open successfully ✅

## If You Get Errors

### Error: "Nothing to rollback"
Your database might already be in a good state. Try:
```bash
php artisan migrate
php artisan db:seed --class=PermissionSeeder
```

### Error: "Table already exists"
Drop tables manually:
```bash
php artisan tinker
```
```php
Schema::dropIfExists('role_permissions');
Schema::dropIfExists('permissions');
exit
```

Then run:
```bash
php artisan migrate
php artisan db:seed --class=PermissionSeeder
```

### Error: "Permission denied" (Linux/Mac)
```bash
chmod +x FIX_PERMISSIONS_SCHEMA.sh
```

## Need More Details?

See: `RBAC_500_ERROR_ROOT_CAUSE.md` for complete technical analysis

---

**Ready to fix?** Run the automated script above! ⚡
