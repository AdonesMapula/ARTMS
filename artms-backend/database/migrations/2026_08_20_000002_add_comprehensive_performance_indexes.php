<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations to add comprehensive indexes for high-volume and high-traffic queries.
     */
    public function up(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            if (Schema::hasTable('audit_logs')) {
                $table->index('created_at', 'idx_audit_logs_created_at');
                $table->index(['module', 'created_at'], 'idx_audit_logs_module_created');
                $table->index(['user_id', 'created_at'], 'idx_audit_logs_user_created');
            }
        });

        Schema::table('interviews', function (Blueprint $table) {
            if (Schema::hasTable('interviews')) {
                $table->index(['scheduled_at', 'status'], 'idx_interviews_scheduled_status');
                $table->index(['status', 'scheduled_at'], 'idx_interviews_status_scheduled');
                $table->index(['interviewer_id', 'status'], 'idx_interviews_interviewer_status');
            }
        });

        Schema::table('leave_requests', function (Blueprint $table) {
            if (Schema::hasTable('leave_requests')) {
                $table->index(['employee_id', 'status'], 'idx_leave_requests_employee_status');
                $table->index(['status', 'created_at'], 'idx_leave_requests_status_created');
            }
        });

        Schema::table('attendance_logs', function (Blueprint $table) {
            if (Schema::hasTable('attendance_logs')) {
                $table->index(['employee_id', 'date'], 'idx_attendance_employee_date');
                $table->index(['date', 'status'], 'idx_attendance_date_status');
            }
        });

        Schema::table('manpower_requests', function (Blueprint $table) {
            if (Schema::hasTable('manpower_requests')) {
                $table->index(['department_id', 'status'], 'idx_manpower_dept_status');
                $table->index(['status', 'created_at'], 'idx_manpower_status_created');
            }
        });

        Schema::table('employees', function (Blueprint $table) {
            if (Schema::hasTable('employees')) {
                $table->index(['department_id', 'employment_status'], 'idx_employees_dept_status');
                $table->index(['employment_status', 'created_at'], 'idx_employees_status_created');
            }
        });

        Schema::table('ai_evaluations', function (Blueprint $table) {
            if (Schema::hasTable('ai_evaluations')) {
                $table->index(['applicant_id', 'ai_score'], 'idx_ai_eval_applicant_score');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex('idx_audit_logs_created_at');
            $table->dropIndex('idx_audit_logs_module_created');
            $table->dropIndex('idx_audit_logs_user_created');
        });

        Schema::table('interviews', function (Blueprint $table) {
            $table->dropIndex('idx_interviews_scheduled_status');
            $table->dropIndex('idx_interviews_status_scheduled');
            $table->dropIndex('idx_interviews_interviewer_status');
        });

        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropIndex('idx_leave_requests_employee_status');
            $table->dropIndex('idx_leave_requests_status_created');
        });

        Schema::table('attendance_logs', function (Blueprint $table) {
            $table->dropIndex('idx_attendance_employee_date');
            $table->dropIndex('idx_attendance_date_status');
        });

        Schema::table('manpower_requests', function (Blueprint $table) {
            $table->dropIndex('idx_manpower_dept_status');
            $table->dropIndex('idx_manpower_status_created');
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->dropIndex('idx_employees_dept_status');
            $table->dropIndex('idx_employees_status_created');
        });

        Schema::table('ai_evaluations', function (Blueprint $table) {
            $table->dropIndex('idx_ai_eval_applicant_score');
        });
    }
};
