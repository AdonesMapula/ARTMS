<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = App\Models\User::where('email', 'superadmin@artms.com')->first();
auth()->login($user);

$payload = [
    'job_library_id' => 1,
    'position_needed' => 'Test',
    'headcount' => 1,
    'justification' => 'Employment Status: Full time | Plantilla Type: Replacement | Replacement For: John Doe',
    'qualifications' => [],
    'responsibilities' => [],
    'needed_by' => null,
    'urgency' => 'critical',
    'fit_threshold_high' => 80,
    'fit_threshold_medium' => 50,
];

$request = Illuminate\Http\Request::create('/api/manpower-requests', 'POST', $payload);
$request->setUserResolver(fn() => $user);

$response = app()->handle($request);
echo "Status: " . $response->getStatusCode() . "\n";
echo "Content: " . $response->getContent() . "\n";
