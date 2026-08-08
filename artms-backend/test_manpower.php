<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = App\Models\User::where('email', 'superadmin@artms.com')->first();
if (!$user) {
    die("User not found\n");
}

auth()->login($user);

$request = Illuminate\Http\Request::create('/api/manpower-requests', 'POST', [
    'position_needed' => 'Test Position',
    'headcount' => 1,
    'urgency' => 'medium',
]);
$request->setUserResolver(fn() => $user);

$response = app()->handle($request);
echo "Status: " . $response->getStatusCode() . "\n";
echo "Content: " . $response->getContent() . "\n";
