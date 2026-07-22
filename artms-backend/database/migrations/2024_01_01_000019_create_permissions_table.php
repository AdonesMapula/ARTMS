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
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // e.g., 'view_applicants', 'manage_users'
            $table->string('resource'); // e.g., 'applicants', 'users', 'job_library'
            $table->string('action'); // e.g., 'view', 'create', 'update', 'delete'
            $table->string('display_name'); // e.g., 'View Applicants'
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('role_permissions', function (Blueprint $table) {
            $table->id();
            $table->string('role'); // e.g., 'hr_admin', 'super_admin', 'coo', 'department_head'
            $table->foreignId('permission_id')->constrained('permissions')->onDelete('cascade');
            $table->timestamps();
            
            $table->unique(['role', 'permission_id']);
        });

        // Insert default permissions
        $this->insertDefaultPermissions();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('role_permissions');
        Schema::dropIfExists('permissions');
    }

    /**
     * Insert default permissions for the system
     */
    private function insertDefaultPermissions(): void
    {
        $permissions = [
            // Dashboard
            ['name' => 'view_dashboard', 'resource' => 'dashboard', 'action' => 'view', 'display_name' => 'View Dashboard', 'description' => 'Access to dashboard and analytics'],
            
            // Users
            ['name' => 'view_users', 'resource' => 'users', 'action' => 'view', 'display_name' => 'View Users', 'description' => 'View user list and details'],
            ['name' => 'create_users', 'resource' => 'users', 'action' => 'create', 'display_name' => 'Create Users', 'description' => 'Create new users'],
            ['name' => 'update_users', 'resource' => 'users', 'action' => 'update', 'display_name' => 'Update Users', 'description' => 'Edit user information'],
            ['name' => 'delete_users', 'resource' => 'users', 'action' => 'delete', 'display_name' => 'Delete Users', 'description' => 'Delete users from system'],
            
            // Departments
            ['name' => 'view_departments', 'resource' => 'departments', 'action' => 'view', 'display_name' => 'View Departments', 'description' => 'View department list'],
            ['name' => 'manage_departments', 'resource' => 'departments', 'action' => 'manage', 'display_name' => 'Manage Departments', 'description' => 'Create, update, and delete departments'],
            
            // Manpower Requests
            ['name' => 'view_manpower_requests', 'resource' => 'manpower_requests', 'action' => 'view', 'display_name' => 'View Manpower Requests', 'description' => 'View manpower request list'],
            ['name' => 'create_manpower_requests', 'resource' => 'manpower_requests', 'action' => 'create', 'display_name' => 'Create Manpower Requests', 'description' => 'Create new manpower requests'],
            ['name' => 'approve_manpower_requests', 'resource' => 'manpower_requests', 'action' => 'approve', 'display_name' => 'Approve Manpower Requests', 'description' => 'Approve or reject manpower requests'],
            
            // Job Library
            ['name' => 'view_job_library', 'resource' => 'job_library', 'action' => 'view', 'display_name' => 'View Job Library', 'description' => 'View job library entries'],
            ['name' => 'manage_job_library', 'resource' => 'job_library', 'action' => 'manage', 'display_name' => 'Manage Job Library', 'description' => 'Create, update, and delete job library entries'],
            ['name' => 'approve_job_library', 'resource' => 'job_library', 'action' => 'approve', 'display_name' => 'Approve Job Library', 'description' => 'Approve job library entries'],
            
            // Job Postings
            ['name' => 'view_job_postings', 'resource' => 'job_postings', 'action' => 'view', 'display_name' => 'View Job Postings', 'description' => 'View job postings'],
            ['name' => 'manage_job_postings', 'resource' => 'job_postings', 'action' => 'manage', 'display_name' => 'Manage Job Postings', 'description' => 'Create, update, and delete job postings'],
            ['name' => 'approve_job_postings', 'resource' => 'job_postings', 'action' => 'approve', 'display_name' => 'Approve Job Postings', 'description' => 'Approve job postings'],
            ['name' => 'publish_job_postings', 'resource' => 'job_postings', 'action' => 'publish', 'display_name' => 'Publish Job Postings', 'description' => 'Publish job postings to public'],
            
            // Applicants
            ['name' => 'view_applicants', 'resource' => 'applicants', 'action' => 'view', 'display_name' => 'View Applicants', 'description' => 'View applicant list and details'],
            ['name' => 'manage_applicants', 'resource' => 'applicants', 'action' => 'manage', 'display_name' => 'Manage Applicants', 'description' => 'Update applicant status and information'],
            ['name' => 'hire_applicants', 'resource' => 'applicants', 'action' => 'hire', 'display_name' => 'Hire Applicants', 'description' => 'Mark applicants as hired'],
            ['name' => 'reject_applicants', 'resource' => 'applicants', 'action' => 'reject', 'display_name' => 'Reject Applicants', 'description' => 'Reject applicants'],
            
            // AI Screening
            ['name' => 'view_ai_screening', 'resource' => 'ai_screening', 'action' => 'view', 'display_name' => 'View AI Screening', 'description' => 'View AI screening results'],
            ['name' => 'perform_ai_screening', 'resource' => 'ai_screening', 'action' => 'perform', 'display_name' => 'Perform AI Screening', 'description' => 'Run AI screening on applicants'],
            ['name' => 'review_ai_screening', 'resource' => 'ai_screening', 'action' => 'review', 'display_name' => 'Review AI Screening', 'description' => 'Review and approve AI screening results'],
            
            // Interviews
            ['name' => 'view_interviews', 'resource' => 'interviews', 'action' => 'view', 'display_name' => 'View Interviews', 'description' => 'View interview schedule'],
            ['name' => 'manage_interviews', 'resource' => 'interviews', 'action' => 'manage', 'display_name' => 'Manage Interviews', 'description' => 'Schedule, update, and cancel interviews'],
            
            // Pipeline
            ['name' => 'view_pipeline', 'resource' => 'pipeline', 'action' => 'view', 'display_name' => 'View Pipeline', 'description' => 'View recruitment pipeline'],
            
            // Employees
            ['name' => 'view_employees', 'resource' => 'employees', 'action' => 'view', 'display_name' => 'View Employees', 'description' => 'View employee list and details'],
            ['name' => 'manage_employees', 'resource' => 'employees', 'action' => 'manage', 'display_name' => 'Manage Employees', 'description' => 'Create, update, and delete employees'],
            
            // Reports
            ['name' => 'view_reports', 'resource' => 'reports', 'action' => 'view', 'display_name' => 'View Reports', 'description' => 'Access reports and analytics'],
            
            // Audit Logs
            ['name' => 'view_audit_logs', 'resource' => 'audit_logs', 'action' => 'view', 'display_name' => 'View Audit Logs', 'description' => 'View system audit logs'],
            
            // System Settings
            ['name' => 'manage_system_settings', 'resource' => 'system_settings', 'action' => 'manage', 'display_name' => 'Manage System Settings', 'description' => 'Configure system settings'],
            
            // Roles & Permissions
            ['name' => 'manage_roles_permissions', 'resource' => 'roles_permissions', 'action' => 'manage', 'display_name' => 'Manage Roles & Permissions', 'description' => 'Manage role permissions'],
        ];

        foreach ($permissions as $permission) {
            DB::table('permissions')->insert(array_merge($permission, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }
};
