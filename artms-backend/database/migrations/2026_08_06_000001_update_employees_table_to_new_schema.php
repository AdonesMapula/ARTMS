<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            // Add new schema columns if they don't exist
            if (!Schema::hasColumn('employees', 'employee_id')) {
                $table->string('employee_id', 50)->unique()->nullable()->after('id');
            }
            if (!Schema::hasColumn('employees', 'first_name')) {
                $table->string('first_name')->nullable()->after('user_id');
            }
            if (!Schema::hasColumn('employees', 'middle_name')) {
                $table->string('middle_name')->nullable()->after('first_name');
            }
            if (!Schema::hasColumn('employees', 'last_name')) {
                $table->string('last_name')->nullable()->after('middle_name');
            }
            if (!Schema::hasColumn('employees', 'email')) {
                $table->string('email')->nullable()->after('last_name');
            }
            if (!Schema::hasColumn('employees', 'phone')) {
                $table->string('phone', 50)->nullable()->after('email');
            }
            if (!Schema::hasColumn('employees', 'job_title')) {
                $table->string('job_title')->nullable()->after('department_id');
            }
            if (!Schema::hasColumn('employees', 'hire_date')) {
                $table->date('hire_date')->nullable()->after('job_title');
            }
            if (!Schema::hasColumn('employees', 'birth_date')) {
                $table->date('birth_date')->nullable()->after('hire_date');
            }
            if (!Schema::hasColumn('employees', 'emergency_contact_phone')) {
                $table->string('emergency_contact_phone', 50)->nullable();
            }
            if (!Schema::hasColumn('employees', 'gender')) {
                $table->string('gender', 50)->nullable()->after('birth_date');
            }
            if (!Schema::hasColumn('employees', 'basic_salary')) {
                $table->decimal('basic_salary', 10, 2)->nullable()->after('gender');
            }
            if (!Schema::hasColumn('employees', 'avatar')) {
                $table->string('avatar')->nullable();
            }
            if (!Schema::hasColumn('employees', 'documents_status')) {
                $table->enum('documents_status', ['complete', 'incomplete', 'pending'])->default('pending');
            }
        });

        // Migrate existing data from old columns to new columns
        DB::statement("
            UPDATE employees e
            JOIN users u ON e.user_id = u.id
            SET
                e.first_name    = COALESCE(u.first_name, SUBSTRING_INDEX(u.name, ' ', 1)),
                e.middle_name   = NULL,
                e.last_name     = COALESCE(u.last_name, IF(LOCATE(' ', u.name) > 0, SUBSTRING(u.name, LOCATE(' ', u.name) + 1), NULL)),
                e.email         = COALESCE(e.email, u.email),
                e.phone         = COALESCE(e.phone, e.contact_number),
                e.job_title     = COALESCE(e.job_title, e.position),
                e.hire_date     = COALESCE(e.hire_date, e.date_hired),
                e.basic_salary  = COALESCE(e.basic_salary, e.salary)
            WHERE e.first_name IS NULL
        ");

        // Update employment_status enum safely by temporarily expanding to varchar first
        DB::statement("
            ALTER TABLE employees MODIFY COLUMN employment_status
            VARCHAR(50) NOT NULL DEFAULT 'regular'
        ");

        // Map old status values to new ones
        DB::statement("UPDATE employees SET employment_status = 'regular' WHERE employment_status IN ('active', 'on_leave') OR employment_status IS NULL OR employment_status = ''");

        DB::statement("
            ALTER TABLE employees MODIFY COLUMN employment_status
            ENUM('regular', 'probationary', 'contractual', 'project_based', 'ojt', 'resigned', 'terminated')
            NOT NULL DEFAULT 'regular'
        ");
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn([
                'employee_id', 'first_name', 'middle_name', 'last_name',
                'email', 'phone', 'job_title', 'hire_date', 'birth_date',
                'emergency_contact_phone', 'gender', 'basic_salary', 'avatar', 'documents_status',
            ]);
        });

        DB::statement("
            ALTER TABLE employees MODIFY COLUMN employment_status
            ENUM('active', 'resigned', 'terminated', 'on_leave')
            NOT NULL DEFAULT 'active'
        ");
    }
};
