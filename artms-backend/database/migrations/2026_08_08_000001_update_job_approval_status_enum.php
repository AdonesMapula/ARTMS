<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE job_library MODIFY COLUMN approval_status ENUM('pending', 'approved', 'rejected', 'revised', 'needs_revision') DEFAULT 'pending'");
        DB::statement("ALTER TABLE job_postings MODIFY COLUMN approval_status ENUM('pending', 'approved', 'rejected', 'revised', 'needs_revision') DEFAULT 'pending'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE job_library MODIFY COLUMN approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'");
        DB::statement("ALTER TABLE job_postings MODIFY COLUMN approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'");
    }
};
