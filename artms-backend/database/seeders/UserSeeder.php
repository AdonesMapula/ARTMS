<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();

        // Remove current tokens, OTPs, and existing users
        DB::table('personal_access_tokens')->truncate();
        DB::table('authentication_otps')->truncate();
        DB::table('users')->truncate();

        Schema::enableForeignKeyConstraints();

        $hrDept = Department::where('department_name', 'Human Resources')->first();
        $itDept = Department::where('department_name', 'Information Technology')->first();
        $opsDept = Department::where('department_name', 'Operations')->first();

        $users = [
            [
                'name'          => 'Super Admin',
                'first_name'    => 'Super',
                'last_name'     => 'Admin',
                'email'         => 'superadmin@artms.com',
                'password'      => Hash::make('SuperAdmin@2024'),
                'role'          => 'super_admin',
                'department_id' => $hrDept?->id,
                'is_active'     => true,
            ],
            [
                'name'          => 'System Developer',
                'first_name'    => 'System',
                'last_name'     => 'Developer',
                'email'         => 'developer@artms.com',
                'password'      => Hash::make('Developer@2024'),
                'role'          => 'developer',
                'department_id' => $itDept?->id,
                'is_active'     => true,
            ],
            [
                'name'          => 'HR Administrator',
                'first_name'    => 'HR',
                'last_name'     => 'Administrator',
                'email'         => 'hradmin@artms.com',
                'password'      => Hash::make('HrAdmin@2024'),
                'role'          => 'hr_admin',
                'department_id' => $hrDept?->id,
                'is_active'     => true,
            ],
            [
                'name'          => 'Chief Operating Officer',
                'first_name'    => 'COO',
                'last_name'     => 'Executive',
                'email'         => 'coo@artms.com',
                'password'      => Hash::make('CooUser@2024'),
                'role'          => 'coo',
                'department_id' => $opsDept?->id ?? $hrDept?->id,
                'is_active'     => true,
            ],
            [
                'name'          => 'Department Head',
                'first_name'    => 'IT Dept',
                'last_name'     => 'Head',
                'email'         => 'depthead@artms.com',
                'password'      => Hash::make('DeptHead@2024'),
                'role'          => 'department_head',
                'department_id' => $itDept?->id,
                'is_active'     => true,
            ],
            [
                'name'          => 'Interviewer User',
                'first_name'    => 'Interviewer',
                'last_name'     => 'Specialist',
                'email'         => 'interviewer@artms.com',
                'password'      => Hash::make('Interviewer@2024'),
                'role'          => 'hr_admin',
                'department_id' => $hrDept?->id,
                'is_active'     => true,
            ],
        ];

        foreach ($users as $userData) {
            User::create($userData);
        }

        if (isset($this->command)) {
            $this->command->info('Users table cleared and reseeded with default role accounts.');
            $this->command->table(
                ['Role', 'Name', 'Email', 'Default Password'],
                [
                    ['Super Admin',     'Super Admin',              'superadmin@artms.com',  'SuperAdmin@2024'],
                    ['Developer',       'System Developer',         'developer@artms.com',   'Developer@2024'],
                    ['HR Admin',        'HR Administrator',         'hradmin@artms.com',     'HrAdmin@2024'],
                    ['COO',             'Chief Operating Officer',   'coo@artms.com',         'CooUser@2024'],
                    ['Department Head', 'Department Head',          'depthead@artms.com',    'DeptHead@2024'],
                    ['Interviewer',     'Interviewer User',         'interviewer@artms.com', 'Interviewer@2024'],
                ]
            );
        }
    }
}

