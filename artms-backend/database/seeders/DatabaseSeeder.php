<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Default Departments (with department_code per new schema) ────────
        $departments = [
            [
                'department_name' => 'Human Resources',
                'department_code' => 'HR',
                'description'     => 'Handles recruitment, employee relations, and HR operations.',
            ],
            [
                'department_name' => 'Information Technology',
                'department_code' => 'IT',
                'description'     => 'Manages software, hardware, and IT infrastructure.',
            ],
            [
                'department_name' => 'Finance',
                'department_code' => 'FIN',
                'description'     => 'Manages budgeting, payroll, and financial reporting.',
            ],
            [
                'department_name' => 'Operations',
                'department_code' => 'OPS',
                'description'     => 'Oversees day-to-day business operations.',
            ],
            [
                'department_name' => 'Marketing',
                'department_code' => 'MKT',
                'description'     => 'Handles brand promotion, campaigns, and communications.',
            ],
            [
                'department_name' => 'Administration',
                'department_code' => 'ADM',
                'description'     => 'General administrative support and facilities management.',
            ],
        ];

        foreach ($departments as $dept) {
            Department::firstOrCreate(
                ['department_name' => $dept['department_name']],
                $dept
            );
        }

        $hrDept = Department::where('department_name', 'Human Resources')->first();
        $itDept = Department::where('department_name', 'Information Technology')->first();

        // ── Super Admin ──────────────────────────────────────────────────────
        User::firstOrCreate(
            ['email' => 'superadmin@artms.com'],
            [
                'name'          => 'Super Admin',
                'password'      => Hash::make('SuperAdmin@2024'),
                'role'          => 'super_admin',
                'department_id' => $hrDept?->id,
                'is_active'     => true,
            ]
        );

        // ── HR Admin ─────────────────────────────────────────────────────────
        User::firstOrCreate(
            ['email' => 'hradmin@artms.com'],
            [
                'name'          => 'HR Administrator',
                'password'      => Hash::make('HrAdmin@2024'),
                'role'          => 'hr_admin',
                'department_id' => $hrDept?->id,
                'is_active'     => true,
            ]
        );

        // ── COO ──────────────────────────────────────────────────────────────
        User::firstOrCreate(
            ['email' => 'coo@artms.com'],
            [
                'name'      => 'Chief Operating Officer',
                'password'  => Hash::make('CooUser@2024'),
                'role'      => 'coo',
                'is_active' => true,
            ]
        );

        // ── Department Head ───────────────────────────────────────────────────
        User::firstOrCreate(
            ['email' => 'depthead@artms.com'],
            [
                'name'          => 'Department Head',
                'password'      => Hash::make('DeptHead@2024'),
                'role'          => 'department_head',
                'department_id' => $itDept?->id,
                'is_active'     => true,
            ]
        );

        // ── Interviewer (uses hr_admin role — interviewer access via custom_role_id) ──
        User::firstOrCreate(
            ['email' => 'interviewer@artms.com'],
            [
                'name'          => 'Interviewer User',
                'password'      => Hash::make('Interviewer@2024'),
                'role'          => 'hr_admin',
                'department_id' => $hrDept?->id,
                'is_active'     => true,
            ]
        );

        $this->command->info('✅ Default users and departments seeded successfully.');
        $this->command->table(
            ['Role', 'Email', 'Password'],
            [
                ['Super Admin',     'superadmin@artms.com',  'SuperAdmin@2024'],
                ['HR Admin',        'hradmin@artms.com',     'HrAdmin@2024'],
                ['COO',             'coo@artms.com',         'CooUser@2024'],
                ['Department Head', 'depthead@artms.com',    'DeptHead@2024'],
                ['Interviewer',     'interviewer@artms.com', 'Interviewer@2024'],
            ]
        );

        // ── Call Sub-Seeders (in dependency order) ────────────────────────────
        $this->call(PermissionSeeder::class);
        $this->call(ManpowerRequestSeeder::class);
        $this->call(JobPostingSeeder::class);
        $this->call(EmployeeSeeder::class);
        $this->call(InterviewSeeder::class);
        $this->call(MessageSeeder::class);
    }
}
