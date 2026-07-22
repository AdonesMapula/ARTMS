#!/bin/bash

echo "===================================================================="
echo "RBAC PERMISSIONS SCHEMA FIX"
echo "===================================================================="
echo ""
echo "This script will:"
echo "1. Drop the old permissions table (pivot table design)"
echo "2. Run the new migration (boolean column design)"
echo "3. Seed default permissions"
echo ""
read -p "Press Enter to continue..."

cd "$(dirname "$0")"

echo ""
echo "[Step 1/3] Rolling back old permissions migration..."
php artisan migrate:rollback --step=2
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to rollback migrations"
    exit 1
fi

echo ""
echo "[Step 2/3] Running new permissions migration..."
php artisan migrate
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to run migrations"
    exit 1
fi

echo ""
echo "[Step 3/3] Seeding permissions with default values..."
php artisan db:seed --class=PermissionSeeder
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to seed permissions"
    exit 1
fi

echo ""
echo "===================================================================="
echo "SUCCESS! Permissions schema has been fixed."
echo "===================================================================="
echo ""
echo "The permissions table now uses the boolean column design:"
echo "- super_admin (always 1)"
echo "- hr_admin"
echo "- coo"
echo "- department_head"
echo "- employee"
echo ""
echo "You can now test the API endpoint:"
echo "  GET http://localhost:8000/api/permissions/role/hr_admin"
echo ""
