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
        // ── Default Departments ──────────────────────────────────────────────
        $departments = [
            ['department_name' => 'Human Resources', 'description' => 'Handles recruitment, employee relations, and HR operations.'],
            ['department_name' => 'Information Technology', 'description' => 'Manages software, hardware, and IT infrastructure.'],
            ['department_name' => 'Finance', 'description' => 'Manages budgeting, payroll, and financial reporting.'],
            ['department_name' => 'Operations', 'description' => 'Oversees day-to-day business operations.'],
            ['department_name' => 'Marketing', 'description' => 'Handles brand promotion, campaigns, and communications.'],
            ['department_name' => 'Administration', 'description' => 'General administrative support and facilities management.'],
        ];

        foreach ($departments as $dept) {
            Department::firstOrCreate(['department_name' => $dept['department_name']], $dept);
        }

        $hrDept = Department::where('department_name', 'Human Resources')->first();

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
        $itDept = Department::where('department_name', 'Information Technology')->first();

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

        $this->command->info('Default users seeded successfully.');
        $this->command->table(
            ['Role', 'Email', 'Password'],
            [
                ['Super Admin',     'superadmin@artms.com', 'SuperAdmin@2024'],
                ['HR Admin',        'hradmin@artms.com',    'HrAdmin@2024'],
                ['COO',             'coo@artms.com',        'CooUser@2024'],
                ['Department Head', 'depthead@artms.com',   'DeptHead@2024'],
            ]
        );
    }
}
