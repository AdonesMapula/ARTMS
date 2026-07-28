<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations to add composite indexes for read query performance.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->index(['department_id', 'is_active', 'role'], 'idx_users_dept_active_role');
        });

        Schema::table('job_postings', function (Blueprint $table) {
            $table->index(['status', 'is_active', 'created_at'], 'idx_job_postings_status_active_created');
            $table->index(['department_id', 'status'], 'idx_job_postings_dept_status');
        });

        Schema::table('applicants', function (Blueprint $table) {
            $table->index(['job_posting_id', 'status'], 'idx_applicants_posting_status');
            $table->index(['status', 'created_at'], 'idx_applicants_status_created');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->index(['notifiable_id', 'read_at'], 'idx_notifications_user_read');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_dept_active_role');
        });

        Schema::table('job_postings', function (Blueprint $table) {
            $table->dropIndex('idx_job_postings_status_active_created');
            $table->dropIndex('idx_job_postings_dept_status');
        });

        Schema::table('applicants', function (Blueprint $table) {
            $table->dropIndex('idx_applicants_posting_status');
            $table->dropIndex('idx_applicants_status_created');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('idx_notifications_user_read');
        });
    }
};
