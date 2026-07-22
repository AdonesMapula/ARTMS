<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "==============================================\n";
echo "AUTH & PERMISSION ENDPOINT DEBUG\n";
echo "==============================================\n\n";

// Check if there are any users
$userCount = DB::table('users')->count();
echo "Total users in database: $userCount\n\n";

if ($userCount === 0) {
    echo "❌ ERROR: No users found in database!\n";
    echo "   Please create a Super Admin user first.\n";
    exit(1);
}

// Check for Super Admin users
$superAdmins = DB::table('users')
    ->where('role', 'super_admin')
    ->where('is_active', 1)
    ->get(['id', 'name', 'email', 'role', 'is_active']);

echo "Super Admin users:\n";
if ($superAdmins->isEmpty()) {
    echo "❌ ERROR: No active Super Admin users found!\n";
    exit(1);
}

foreach ($superAdmins as $admin) {
    echo "  ✅ ID: {$admin->id} | {$admin->name} ({$admin->email})\n";
    echo "     Role: {$admin->role} | Active: " . ($admin->is_active ? 'Yes' : 'No') . "\n";
    
    // Check if they have any tokens
    $tokenCount = DB::table('personal_access_tokens')
        ->where('tokenable_id', $admin->id)
        ->where('tokenable_type', 'App\\Models\\User')
        ->count();
    echo "     Active tokens: $tokenCount\n";
}

echo "\n";
echo "==============================================\n";
echo "TESTING PERMISSION ENDPOINT ACCESS\n";
echo "==============================================\n\n";

// Test the route definition
echo "Checking route registration...\n";
$routes = app('router')->getRoutes();
$permissionRoutes = [];

foreach ($routes as $route) {
    $uri = $route->uri();
    if (strpos($uri, 'permissions') !== false) {
        $permissionRoutes[] = [
            'method' => implode('|', $route->methods()),
            'uri' => $uri,
            'middleware' => $route->middleware(),
            'action' => $route->getActionName(),
        ];
    }
}

if (empty($permissionRoutes)) {
    echo "❌ ERROR: No permission routes found!\n";
    exit(1);
}

echo "✅ Found " . count($permissionRoutes) . " permission routes:\n\n";
foreach ($permissionRoutes as $route) {
    echo "  {$route['method']} /{$route['uri']}\n";
    echo "    Middleware: " . implode(', ', $route['middleware']) . "\n";
    echo "    Action: {$route['action']}\n\n";
}

echo "==============================================\n";
echo "CHECKING MIDDLEWARE REGISTRATION\n";
echo "==============================================\n\n";

// Check if RoleMiddleware is registered
$middlewareAliases = app('router')->getMiddleware();
if (isset($middlewareAliases['role'])) {
    echo "✅ 'role' middleware is registered\n";
    echo "   Class: " . $middlewareAliases['role'] . "\n";
} else {
    echo "❌ ERROR: 'role' middleware is NOT registered!\n";
    echo "   Check bootstrap/app.php or app/Http/Kernel.php\n";
}

echo "\n";
echo "==============================================\n";
echo "RECOMMENDATIONS\n";
echo "==============================================\n\n";

echo "To test the API endpoint:\n\n";
echo "1. Login as Super Admin to get a token:\n";
echo "   POST http://localhost:8000/api/login\n";
echo "   Body: {\"email\": \"admin@example.com\", \"password\": \"password\"}\n\n";

echo "2. Copy the token from the response\n\n";

echo "3. Test the permissions endpoint:\n";
echo "   GET http://localhost:8000/api/permissions/role/hr_admin\n";
echo "   Header: Authorization: Bearer {token}\n\n";

echo "4. Check frontend localStorage:\n";
echo "   - Key: 'artms_token' should contain the Bearer token\n";
echo "   - Key: 'artms_user' should contain user data with role='super_admin'\n\n";

echo "Common issues:\n";
echo "  - Frontend not sending Authorization header\n";
echo "  - Token expired or invalid\n";
echo "  - User account is deactivated (is_active = 0)\n";
echo "  - User role is not 'super_admin'\n";
echo "  - CORS issues blocking the request\n\n";
