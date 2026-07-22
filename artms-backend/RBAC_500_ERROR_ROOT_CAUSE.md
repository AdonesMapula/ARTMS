# RBAC 500 ERROR - ROOT CAUSE ANALYSIS

## Problem Summary

**Error**: `GET /api/permissions/role/hr_admin` returns **500 Internal Server Error**

**Location**: PermissionModal.jsx (Frontend) → PermissionController.php (Backend)

**User Impact**: Cannot open "Manage Permissions" modal for any role

---

## The Root Cause 🎯

### SCHEMA CONFLICT: Two Different Permission Table Designs

The system has **TWO conflicting migration files** for the permissions table:

#### 1. OLD SCHEMA (Currently in Database) ✓ Ran
**File**: `2024_01_01_000019_create_permissions_table.php`  
**Status**: Already executed (Batch 6)  
**Design**: Pivot table architecture with `role_permissions` junction table

**Table Structure**:
```sql
CREATE TABLE permissions (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) UNIQUE,
    resource VARCHAR(255),
    action VARCHAR(255),
    display_name VARCHAR(255),
    description TEXT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE role_permissions (
    id BIGINT PRIMARY KEY,
    role VARCHAR(255),
    permission_id BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(role, permission_id)
);
```

#### 2. NEW SCHEMA (NOT Applied) ✗ Pending
**File**: `2025_01_23_000001_create_permissions_table.php`  
**Status**: **PENDING** (never executed)  
**Design**: Boolean column architecture

**Table Structure**:
```sql
CREATE TABLE permissions (
    id BIGINT PRIMARY KEY,
    name VARCHAR(100) UNIQUE,
    display_name VARCHAR(150),
    description TEXT NULL,
    resource VARCHAR(50),
    super_admin BOOLEAN DEFAULT 1,      -- ⭐ NEW
    hr_admin BOOLEAN DEFAULT 0,         -- ⭐ NEW
    coo BOOLEAN DEFAULT 0,              -- ⭐ NEW
    department_head BOOLEAN DEFAULT 0,  -- ⭐ NEW
    employee BOOLEAN DEFAULT 0,         -- ⭐ NEW
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

## Why The Error Occurs

### Controller Expects NEW Schema, Database Has OLD Schema

**PermissionController.php Line 96-99**:
```php
public function getByRole(string $role): JsonResponse
{
    // This query expects boolean columns!
    $permissions = DB::table('permissions')
        ->where($role, 1)  // ❌ Fails: column 'hr_admin' doesn't exist
        ->get();
}
```

**What Happens**:
1. Frontend calls: `GET /api/permissions/role/hr_admin`
2. Controller tries: `SELECT * FROM permissions WHERE hr_admin = 1`
3. MySQL error: **"Unknown column 'hr_admin' in 'where clause'**
4. Laravel returns: **500 Internal Server Error**

---

## Investigation Timeline

### Step 1: Check Migration Status
```bash
php artisan migrate:status
```

**Result**:
```
2024_01_01_000019_create_permissions_table ......... [6] Ran ✓
2025_01_23_000001_create_permissions_table ......... Pending ✗
```

**Finding**: Old migration ran, new migration never executed!

### Step 2: Verify Table Structure
```bash
php artisan tinker
```
```php
Schema::hasTable('permissions')          // true ✓
DB::table('permissions')->count()        // 66 ✓
Schema::getColumnListing('permissions')  
// ['id', 'name', 'resource', 'action', 'display_name', 'description', ...]
// ❌ Missing: super_admin, hr_admin, coo, department_head, employee
```

**Finding**: Table exists but has old structure!

### Step 3: Check Controller Logic
**File**: `app/Http/Controllers/PermissionController.php`

The controller was updated to use boolean columns but the database wasn't updated:

```php
// Line 96-99: Expects boolean role columns
$permissions = DB::table('permissions')
    ->where($role, 1)  // This assumes 'hr_admin', 'coo', etc. columns exist
    ->get();
```

---

## Why This Happened

1. **Development Evolution**: 
   - Initially built with pivot table design (2024)
   - Later refactored to boolean columns for simplicity (2025)
   
2. **Incomplete Migration**:
   - Controller was updated to use new schema
   - New migration file was created  
   - **But migration was never run** ❌
   
3. **Migration Conflict**:
   - Both migration files try to create `permissions` table
   - Old one already ran, new one is blocked

---

## The Solution

### Option 1: Automated Script (Recommended) ⭐

**Windows**:
```bash
cd artms-backend
./FIX_PERMISSIONS_SCHEMA.bat
```

**Mac/Linux**:
```bash
cd artms-backend
chmod +x FIX_PERMISSIONS_SCHEMA.sh
./FIX_PERMISSIONS_SCHEMA.sh
```

**What it does**:
1. Rolls back the old permissions migration
2. Runs the new permissions migration  
3. Seeds default permissions

### Option 2: Manual Steps

```bash
cd artms-backend

# Step 1: Rollback old migration (drops old tables)
php artisan migrate:rollback --step=2

# Step 2: Run new migration (creates new table with boolean columns)
php artisan migrate

# Step 3: Seed default permissions
php artisan db:seed --class=PermissionSeeder

# Step 4: Verify
php artisan tinker
```
```php
Schema::hasTable('permissions')  // should be true
Schema::getColumnListing('permissions')  // should include role columns
DB::table('permissions')->count()  // should show 66
DB::table('permissions')->where('hr_admin', 1)->count()  // should work!
```

---

## Verification

### Test API Endpoint
```bash
curl -X GET http://localhost:8000/api/permissions/role/hr_admin \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "role": "hr_admin",
  "permissions": [...],
  "count": 34
}
```

### Test Frontend
1. Login to application
2. Navigate to Roles & Permissions
3. Click "Manage Permissions" for HR Admin
4. Modal should open showing all permissions ✓

---

## Key Takeaways

1. **Root Cause**: Schema mismatch between controller logic and database structure
2. **Why Misleading**: Error said "table doesn't exist" but actually meant "column doesn't exist"
3. **Preventable**: Always run migrations after updating controller logic
4. **Detection**: Check `migrate:status` when seeing database errors

---

## Related Files

- **Controller**: `app/Http/Controllers/PermissionController.php`
- **Old Migration**: `database/migrations/2024_01_01_000019_create_permissions_table.php`
- **New Migration**: `database/migrations/2025_01_23_000001_create_permissions_table.php`
- **Seeder**: `database/seeders/PermissionSeeder.php`
- **Frontend**: `src/components/Roles/PermissionModal.jsx`
- **Fix Scripts**: `FIX_PERMISSIONS_SCHEMA.bat` / `FIX_PERMISSIONS_SCHEMA.sh`

---

**Document Created**: 2026-07-22  
**Status**: Root cause identified, solution provided  
**Next Action**: Run fix script to update database schema
