<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "==============================================\n";
echo "PERMISSIONS TABLE VERIFICATION\n";
echo "==============================================\n\n";

// Check if table exists
if (!Schema::hasTable('permissions')) {
    echo "❌ ERROR: permissions table does not exist!\n";
    exit(1);
}

echo "✅ Table 'permissions' exists\n\n";

// Get columns
$columns = Schema::getColumnListing('permissions');
echo "Columns (" . count($columns) . "):\n";
foreach ($columns as $col) {
    echo "  - $col\n";
}
echo "\n";

// Check for boolean role columns
$roleColumns = ['super_admin', 'hr_admin', 'coo', 'department_head', 'employee'];
$missingColumns = [];
foreach ($roleColumns as $roleCol) {
    if (!in_array($roleCol, $columns)) {
        $missingColumns[] = $roleCol;
    }
}

if (!empty($missingColumns)) {
    echo "❌ ERROR: Missing role columns: " . implode(', ', $missingColumns) . "\n";
    exit(1);
}

echo "✅ All role columns exist (super_admin, hr_admin, coo, department_head, employee)\n\n";

// Count total permissions
$total = DB::table('permissions')->count();
echo "Total permissions: $total\n\n";

// Test query for each role
$roles = ['super_admin', 'hr_admin', 'coo', 'department_head', 'employee'];
echo "Permissions per role:\n";
foreach ($roles as $role) {
    $count = DB::table('permissions')->where($role, 1)->count();
    echo "  - $role: $count permissions\n";
}

echo "\n";
echo "==============================================\n";
echo "API ENDPOINT SIMULATION TEST\n";
echo "==============================================\n\n";

// Simulate what the controller does
$testRole = 'hr_admin';
echo "Testing: GET /api/permissions/role/$testRole\n\n";

try {
    $permissions = DB::table('permissions')
        ->where($testRole, 1)
        ->orderBy('resource')
        ->orderBy('name')
        ->get();
    
    echo "✅ Query successful!\n";
    echo "   Found " . $permissions->count() . " permissions for $testRole\n\n";
    
    if ($permissions->count() > 0) {
        echo "Sample permissions (first 5):\n";
        foreach ($permissions->take(5) as $perm) {
            echo "  - {$perm->name} (resource: {$perm->resource})\n";
        }
    }
    
    echo "\n✅ SUCCESS: The API endpoint should now work!\n";
    
} catch (Exception $e) {
    echo "❌ ERROR: Query failed!\n";
    echo "   " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n==============================================\n";
echo "TEST COMPLETE\n";
echo "==============================================\n";
