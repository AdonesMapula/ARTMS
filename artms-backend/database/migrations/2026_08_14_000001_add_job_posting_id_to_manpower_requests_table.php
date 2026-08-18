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
            $table->foreignId('job_posting_id')->nullable()->constrained('job_postings')->nullOnDelete()->after('job_library_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('manpower_requests', function (Blueprint $table) {
            $table->dropForeign(['job_posting_id']);
            $table->dropColumn('job_posting_id');
        });
    }
};
