<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PermissionSeeder extends Seeder
{
    /**
     * Seed the permissions table with all system permissions.
     * Each permission has boolean flags for which roles can access it.
     */
    public function run(): void
    {
        $permissions = [
            // Dashboard & Reports (Everyone)
            ['name' => 'view_dashboard', 'display_name' => 'View Dashboard', 'description' => 'Can access dashboard page', 'resource' => 'dashboard', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 1, 'department_head' => 1, 'employee' => 1],
            ['name' => 'view_reports', 'display_name' => 'View Reports', 'description' => 'Can view reports and analytics', 'resource' => 'reports', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 1, 'department_head' => 1, 'employee' => 0],

            // Users Management (Super Admin Only)
            ['name' => 'view_users', 'display_name' => 'View Users', 'description' => 'Can access users page', 'resource' => 'users', 'super_admin' => 1, 'hr_admin' => 0, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
            ['name' => 'create_users', 'display_name' => 'Create Users', 'description' => 'Can create new users', 'resource' => 'users', 'super_admin' => 1, 'hr_admin' => 0, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
            ['name' => 'edit_users', 'display_name' => 'Edit Users', 'description' => 'Can edit user information', 'resource' => 'users', 'super_admin' => 1, 'hr_admin' => 0, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
            ['name' => 'delete_users', 'display_name' => 'Delete Users', 'description' => 'Can delete users', 'resource' => 'users', 'super_admin' => 1, 'hr_admin' => 0, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
            ['name' => 'manage_users', 'display_name' => 'Manage Users', 'description' => 'Full user management access', 'resource' => 'users', 'super_admin' => 1, 'hr_admin' => 0, 'coo' => 0, 'department_head' => 0, 'employee' => 0],

            // Departments Management (Super Admin Only)
            ['name' => 'view_departments', 'display_name' => 'View Departments', 'description' => 'Can access departments page', 'resource' => 'departments', 'super_admin' => 1, 'hr_admin' => 0, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
            ['name' => 'create_departments', 'display_name' => 'Create Departments', 'description' => 'Can create new departments', 'resource' => 'departments', 'super_admin' => 1, 'hr_admin' => 0, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
            ['name' => 'edit_departments', 'display_name' => 'Edit Departments', 'description' => 'Can edit departments', 'resource' => 'departments', 'super_admin' => 1, 'hr_admin' => 0, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
            ['name' => 'delete_departments', 'display_name' => 'Delete Departments', 'description' => 'Can delete departments', 'resource' => 'departments', 'super_admin' => 1, 'hr_admin' => 0, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
            ['name' => 'manage_departments', 'display_name' => 'Manage Departments', 'description' => 'Full department management', 'resource' => 'departments', 'super_admin' => 1, 'hr_admin' => 0, 'coo' => 0, 'department_head' => 0, 'employee' => 0],

            // Roles & Permissions Management (Super Admin Only)
            ['name' => 'view_roles', 'display_name' => 'View Roles', 'description' => 'Can access roles & permissions page', 'resource' => 'roles', 'super_admin' => 1, 'hr_admin' => 0, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
            ['name' => 'create_roles', 'display_name' => 'Create Roles', 'description' => 'Can create custom roles', 'resource' => 'roles', 'super_admin' => 1, 'hr_admin' => 0, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
            ['name' => 'edit_roles', 'display_name' => 'Edit Roles', 'description' => 'Can edit role permissions', 'resource' => 'roles', 'super_admin' => 1, 'hr_admin' => 0, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
            ['name' => 'delete_roles', 'display_name' => 'Delete Roles', 'description' => 'Can delete custom roles', 'resource' => 'roles', 'super_admin' => 1, 'hr_admin' => 0, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
            ['name' => 'manage_roles', 'display_name' => 'Manage Roles', 'description' => 'Full role management access', 'resource' => 'roles', 'super_admin' => 1, 'hr_admin' => 0, 'coo' => 0, 'department_head' => 0, 'employee' => 0],

            // Manpower Requests / PRF
            ['name' => 'view_manpower_requests', 'display_name' => 'View All PRF Requests', 'description' => 'Can view all manpower requests', 'resource' => 'manpower_requests', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 1, 'department_head' => 0, 'employee' => 0],
            ['name' => 'create_manpower_requests', 'display_name' => 'Create PRF', 'description' => 'Can create manpower requests', 'resource' => 'manpower_requests', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 0, 'department_head' => 1, 'employee' => 0],
            ['name' => 'edit_manpower_requests', 'display_name' => 'Edit PRF', 'description' => 'Can edit own manpower requests', 'resource' => 'manpower_requests', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 0, 'department_head' => 1, 'employee' => 0],
            ['name' => 'delete_manpower_requests', 'display_name' => 'Delete PRF', 'description' => 'Can delete manpower requests', 'resource' => 'manpower_requests', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 0, 'department_head' => 1, 'employee' => 0],
            ['name' => 'approve_manpower_requests', 'display_name' => 'Approve PRF', 'description' => 'Can approve/reject PRF requests', 'resource' => 'manpower_requests', 'super_admin' => 1, 'hr_admin' => 0, 'coo' => 1, 'department_head' => 0, 'employee' => 0],
            ['name' => 'view_manpower_request', 'display_name' => 'Access PRF Page', 'description' => 'Can access PRF creation page', 'resource' => 'manpower_request', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 0, 'department_head' => 1, 'employee' => 0],
            ['name' => 'view_request_history', 'display_name' => 'View Request History', 'description' => 'Can view own request history', 'resource' => 'request_history', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 1, 'department_head' => 1, 'employee' => 0],

            // COO Approval Pages
            ['name' => 'view_prf_approvals', 'display_name' => 'View PRF Approvals', 'description' => 'Can access PRF approval page', 'resource' => 'prf_approvals', 'super_admin' => 1, 'hr_admin' => 0, 'coo' => 1, 'department_head' => 0, 'employee' => 0],
            ['name' => 'view_job_library_approvals', 'display_name' => 'View Job Library Approvals', 'description' => 'Can access job library approval page', 'resource' => 'job_library_approvals', 'super_admin' => 1, 'hr_admin' => 0, 'coo' => 1, 'department_head' => 0, 'employee' => 0],
            ['name' => 'view_job_posting_approvals', 'display_name' => 'View Job Posting Approvals', 'description' => 'Can access job posting approval page', 'resource' => 'job_posting_approvals', 'super_admin' => 1, 'hr_admin' => 0, 'coo' => 1, 'department_head' => 0, 'employee' => 0],

            // Job Library
            ['name' => 'view_job_library', 'display_name' => 'View Job Library', 'description' => 'Can access job library page', 'resource' => 'job_library', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 1, 'department_head' => 0, 'employee' => 0],
            ['name' => 'create_job_library', 'display_name' => 'Create Job Templates', 'description' => 'Can create job templates', 'resource' => 'job_library', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
            ['name' => 'edit_job_library', 'display_name' => 'Edit Job Templates', 'description' => 'Can edit job templates', 'resource' => 'job_library', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
            ['name' => 'delete_job_library', 'display_name' => 'Delete Job Templates', 'description' => 'Can delete job templates', 'resource' => 'job_library', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
            ['name' => 'manage_job_library', 'display_name' => 'Manage Job Library', 'description' => 'Full job library management', 'resource' => 'job_library', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
            ['name' => 'approve_job_library', 'display_name' => 'Approve Job Templates', 'description' => 'Can approve job templates', 'resource' => 'job_library', 'super_admin' => 1, 'hr_admin' => 0, 'coo' => 1, 'department_head' => 0, 'employee' => 0],

            // Job Postings
            ['name' => 'view_job_postings', 'display_name' => 'View Job Postings', 'description' => 'Can access job postings page', 'resource' => 'job_postings', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 1, 'department_head' => 0, 'employee' => 0],
            ['name' => 'create_job_postings', 'display_name' => 'Create Job Postings', 'description' => 'Can create job postings', 'resource' => 'job_postings', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
            ['name' => 'edit_job_postings', 'display_name' => 'Edit Job Postings', 'description' => 'Can edit job postings', 'resource' => 'job_postings', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
            ['name' => 'delete_job_postings', 'display_name' => 'Delete Job Postings', 'description' => 'Can delete job postings', 'resource' => 'job_postings', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
            ['name' => 'manage_job_postings', 'display_name' => 'Manage Job Postings', 'description' => 'Full job posting management', 'resource' => 'job_postings', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
            ['name' => 'publish_job_postings', 'display_name' => 'Publish Job Postings', 'description' => 'Can publish to public site', 'resource' => 'job_postings', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
            ['name' => 'approve_job_postings', 'display_name' => 'Approve Job Postings', 'description' => 'Can approve job postings', 'resource' => 'job_postings', 'super_admin' => 1, 'hr_admin' => 0, 'coo' => 1, 'department_head' => 0, 'employee' => 0],

            // Applicants
            ['name' => 'view_applicants', 'display_name' => 'View Applicants', 'description' => 'Can access applicants page', 'resource' => 'applicants', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 1, 'department_head' => 0, 'employee' => 0],
            ['name' => 'create_applicants', 'display_name' => 'Create Applicants', 'description' => 'Can manually add applicants', 'resource' => 'applicants', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
            ['name' => 'edit_applicants', 'display_name' => 'Edit Applicants', 'description' => 'Can edit applicant information', 'resource' => 'applicants', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
            ['name' => 'delete_applicants', 'display_name' => 'Delete Applicants', 'description' => 'Can delete applicant records', 'resource' => 'applicants', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
            ['name' => 'manage_applicants', 'display_name' => 'Manage Applicants', 'description' => 'Full applicant management', 'resource' => 'applicants', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
            ['name' => 'hire_applicants', 'display_name' => 'Hire Applicants', 'description' => 'Can convert applicants to employees', 'resource' => 'applicants', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
            ['name' => 'reject_applicants', 'display_name' => 'Reject Applicants', 'description' => 'Can reject applicants', 'resource' => 'applicants', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 0, 'department_head' => 0, 'employee' => 0],

            // AI Screening
            ['name' => 'view_ai_screening', 'display_name' => 'View AI Screening', 'description' => 'Can access AI screening page', 'resource' => 'ai_screening', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 1, 'department_head' => 0, 'employee' => 0],
            ['name' => 'perform_ai_screening', 'display_name' => 'Perform AI Screening', 'description' => 'Can run AI screening', 'resource' => 'ai_screening', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
            ['name' => 'review_ai_screening', 'display_name' => 'Review AI Screening', 'description' => 'Can review AI results', 'resource' => 'ai_screening', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 0, 'department_head' => 0, 'employee' => 0],

            // Interviews
            ['name' => 'view_interviews', 'display_name' => 'View Interviews', 'description' => 'Can access interviews page', 'resource' => 'interviews', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 1, 'department_head' => 0, 'employee' => 0],
            ['name' => 'create_interviews', 'display_name' => 'Create Interviews', 'description' => 'Can schedule interviews', 'resource' => 'interviews', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
            ['name' => 'edit_interviews', 'display_name' => 'Edit Interviews', 'description' => 'Can edit interview schedules', 'resource' => 'interviews', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
            ['name' => 'delete_interviews', 'display_name' => 'Delete Interviews', 'description' => 'Can delete interviews', 'resource' => 'interviews', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
            ['name' => 'manage_interviews', 'display_name' => 'Manage Interviews', 'description' => 'Full interview management', 'resource' => 'interviews', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 0, 'department_head' => 0, 'employee' => 0],

            // Pipeline
            ['name' => 'view_pipeline', 'display_name' => 'View Pipeline', 'description' => 'Can access recruitment pipeline', 'resource' => 'pipeline', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 1, 'department_head' => 0, 'employee' => 0],
            ['name' => 'manage_pipeline', 'display_name' => 'Manage Pipeline', 'description' => 'Can manage pipeline stages', 'resource' => 'pipeline', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 0, 'department_head' => 0, 'employee' => 0],

            // Employees
            ['name' => 'view_employees', 'display_name' => 'View Employees', 'description' => 'Can access employees page', 'resource' => 'employees', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
            ['name' => 'create_employees', 'display_name' => 'Create Employees', 'description' => 'Can add new employees', 'resource' => 'employees', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
            ['name' => 'edit_employees', 'display_name' => 'Edit Employees', 'description' => 'Can edit employee information', 'resource' => 'employees', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
            ['name' => 'delete_employees', 'display_name' => 'Delete Employees', 'description' => 'Can delete employee records', 'resource' => 'employees', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
            ['name' => 'manage_employees', 'display_name' => 'Manage Employees', 'description' => 'Full employee management', 'resource' => 'employees', 'super_admin' => 1, 'hr_admin' => 1, 'coo' => 0, 'department_head' => 0, 'employee' => 0],
        ];

        // Insert all permissions
        foreach ($permissions as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['name' => $permission['name']],
                $permission
            );
        }

        $this->command->info('✅ Permissions seeded successfully!');
        $this->command->info('Total permissions: ' . count($permissions));
    }
}
