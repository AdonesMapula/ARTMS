<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
DB::statement("ALTER TABLE manpower_requests MODIFY status ENUM('pending', 'approved', 'rejected', 'fulfilled', 'revised') DEFAULT 'pending'");
echo "ENUM updated successfully.\n";
