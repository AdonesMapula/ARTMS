<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $hrDept = Department::where('department_name', 'Human Resources')->first();
        $itDept = Department::where('department_name', 'Information Technology')->first();

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

        User::firstOrCreate(
            ['email' => 'coo@artms.com'],
            [
                'name'      => 'Chief Operating Officer',
                'password'  => Hash::make('CooUser@2024'),
                'role'      => 'coo',
                'is_active' => true,
            ]
        );

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

        $this->command->info('Users seeded successfully.');
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
