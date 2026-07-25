<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Converts the ENUM to a flexible VARCHAR (String) so you never have this error again
        DB::statement("ALTER TABLE applicants MODIFY COLUMN status VARCHAR(255) NOT NULL DEFAULT 'applied'");
    }

    public function down(): void
    {
        // Not strictly necessary to revert, but good practice
        DB::statement("ALTER TABLE applicants MODIFY COLUMN status VARCHAR(255) NOT NULL DEFAULT 'applied'");
    }
};