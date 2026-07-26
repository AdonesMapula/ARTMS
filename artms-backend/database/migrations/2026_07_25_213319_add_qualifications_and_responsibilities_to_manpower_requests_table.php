<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('manpower_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('manpower_requests', 'qualifications')) {
                $table->json('qualifications')->nullable()->after('justification');
            }
            if (!Schema::hasColumn('manpower_requests', 'responsibilities')) {
                $table->json('responsibilities')->nullable()->after('qualifications');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('manpower_requests', function (Blueprint $table) {
            $columnsToDrop = [];
            if (Schema::hasColumn('manpower_requests', 'qualifications')) {
                $columnsToDrop[] = 'qualifications';
            }
            if (Schema::hasColumn('manpower_requests', 'responsibilities')) {
                $columnsToDrop[] = 'responsibilities';
            }
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
