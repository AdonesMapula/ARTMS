<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Ensure Standard 10 Departments Exist ──────────────────────────
        $departmentsData = [
            ['department_name' => 'Information Technology',    'department_code' => 'IT',    'description' => 'Manages software architecture, systems, and technical infrastructure.'],
            ['department_name' => 'Human Resources',           'department_code' => 'HR',    'description' => 'Oversees talent acquisition, personnel management, and labor compliance.'],
            ['department_name' => 'Finance',                   'department_code' => 'FIN',   'description' => 'Handles financial reporting, corporate budgeting, auditing, and payroll.'],
            ['department_name' => 'Operations',                'department_code' => 'OPS',   'description' => 'Directs daily workflow operations, resource logistics, and supply chain.'],
            ['department_name' => 'Marketing',                 'department_code' => 'MKT',   'description' => 'Drives brand promotion, digital marketing, public relations, and growth campaigns.'],
            ['department_name' => 'Administration',            'department_code' => 'ADM',   'description' => 'General corporate facilities management, compliance, and clerical services.'],
            ['department_name' => 'Software Engineering',      'department_code' => 'ENG',   'description' => 'Product development, core architecture, and full-stack software delivery.'],
            ['department_name' => 'Quality Assurance',         'department_code' => 'QA',    'description' => 'Software QA testing, automated testing pipelines, and release verification.'],
            ['department_name' => 'Sales & Business Dev',      'department_code' => 'SALES', 'description' => 'Client acquisition, commercial partnerships, and enterprise accounts.'],
            ['department_name' => 'Customer Support',          'department_code' => 'CS',    'description' => 'Customer success, post-onboarding support, and helpdesk operations.'],
        ];

        foreach ($departmentsData as $dept) {
            $existing = Department::where('department_name', $dept['department_name'])
                ->orWhere('department_code', $dept['department_code'])
                ->first();

            if (!$existing) {
                Department::create($dept);
            }
        }

        // ── 2. Clean out old Employees & Related Tables ──────────────────────
        Schema::disableForeignKeyConstraints();
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('TRUNCATE TABLE employee_documents, attendance_logs, employees RESTART IDENTITY CASCADE;');
        } else {
            DB::table('employee_documents')->truncate();
            DB::table('attendance_logs')->truncate();
            DB::table('employees')->truncate();
        }
        Schema::enableForeignKeyConstraints();

        $deptMap = Department::pluck('id', 'department_name')->toArray();

        // ── 3. Exactly 10 Department Heads Across 10 Departments ─────────────
        $deptHeads = [
            [
                'first_name'              => 'IT Dept',
                'middle_name'             => null,
                'last_name'               => 'Head',
                'email'                   => 'depthead@artms.com',
                'phone'                   => '+63 917 100 0001',
                'department_name'         => 'Information Technology',
                'job_title'               => 'Head of Information Technology',
                'basic_salary'            => 115000.00,
                'hire_date'               => '2021-03-01',
                'birth_date'              => '1985-08-14',
                'gender'                  => 'Male',
                'address'                 => 'IT Park, Lahug, Cebu City, Philippines',
                'emergency_contact_name'  => 'Maria Head',
                'emergency_contact_phone' => '+63 917 100 0002',
            ],
            [
                'first_name'              => 'Elena',
                'middle_name'             => 'Marie',
                'last_name'               => 'Vasquez',
                'email'                   => 'elena.vasquez@artms.com',
                'phone'                   => '+63 918 200 0002',
                'department_name'         => 'Human Resources',
                'job_title'               => 'Head of Human Resources',
                'basic_salary'            => 110000.00,
                'hire_date'               => '2020-06-15',
                'birth_date'              => '1987-11-20',
                'gender'                  => 'Female',
                'address'                 => 'Cebu Business Park, Cebu City, Philippines',
                'emergency_contact_name'  => 'Carlos Vasquez',
                'emergency_contact_phone' => '+63 918 200 0003',
            ],
            [
                'first_name'              => 'Marcus',
                'middle_name'             => 'James',
                'last_name'               => 'Sterling',
                'email'                   => 'marcus.sterling@artms.com',
                'phone'                   => '+63 919 300 0003',
                'department_name'         => 'Finance',
                'job_title'               => 'Head of Finance & Accounting',
                'basic_salary'            => 125000.00,
                'hire_date'               => '2019-01-10',
                'birth_date'              => '1983-04-05',
                'gender'                  => 'Male',
                'address'                 => 'Banilad, Mandaue City, Cebu, Philippines',
                'emergency_contact_name'  => 'Victoria Sterling',
                'emergency_contact_phone' => '+63 919 300 0004',
            ],
            [
                'first_name'              => 'Rodrigo',
                'middle_name'             => 'Alfonso',
                'last_name'               => 'Alvarez',
                'email'                   => 'rodrigo.alvarez@artms.com',
                'phone'                   => '+63 920 400 0004',
                'department_name'         => 'Operations',
                'job_title'               => 'Head of Operations & Logistics',
                'basic_salary'            => 108000.00,
                'hire_date'               => '2021-08-01',
                'birth_date'              => '1986-09-12',
                'gender'                  => 'Male',
                'address'                 => 'Poblacion, Lapu-Lapu City, Cebu, Philippines',
                'emergency_contact_name'  => 'Teresa Alvarez',
                'emergency_contact_phone' => '+63 920 400 0005',
            ],
            [
                'first_name'              => 'Clara',
                'middle_name'             => 'Isabel',
                'last_name'               => 'Del Rosario',
                'email'                   => 'clara.delrosario@artms.com',
                'phone'                   => '+63 921 500 0005',
                'department_name'         => 'Marketing',
                'job_title'               => 'Head of Marketing & Communications',
                'basic_salary'            => 105000.00,
                'hire_date'               => '2022-02-15',
                'birth_date'              => '1989-07-28',
                'gender'                  => 'Female',
                'address'                 => 'Guadalupe, Cebu City, Philippines',
                'emergency_contact_name'  => 'David Del Rosario',
                'emergency_contact_phone' => '+63 921 500 0006',
            ],
            [
                'first_name'              => 'Fernando',
                'middle_name'             => 'Luis',
                'last_name'               => 'Gomez',
                'email'                   => 'fernando.gomez@artms.com',
                'phone'                   => '+63 922 600 0006',
                'department_name'         => 'Administration',
                'job_title'               => 'Head of Corporate Administration',
                'basic_salary'            => 98000.00,
                'hire_date'               => '2020-10-01',
                'birth_date'              => '1984-12-03',
                'gender'                  => 'Male',
                'address'                 => 'Tabunok, Talisay City, Cebu, Philippines',
                'emergency_contact_name'  => 'Sofia Gomez',
                'emergency_contact_phone' => '+63 922 600 0007',
            ],
            [
                'first_name'              => 'Katrina',
                'middle_name'             => 'Anne',
                'last_name'               => 'Morales',
                'email'                   => 'katrina.morales@artms.com',
                'phone'                   => '+63 923 700 0007',
                'department_name'         => 'Software Engineering',
                'job_title'               => 'Head of Software Engineering',
                'basic_salary'            => 130000.00,
                'hire_date'               => '2019-11-18',
                'birth_date'              => '1988-03-25',
                'gender'                  => 'Female',
                'address'                 => 'Mandaue Reclamation Area, Cebu, Philippines',
                'emergency_contact_name'  => 'Julian Morales',
                'emergency_contact_phone' => '+63 923 700 0008',
            ],
            [
                'first_name'              => 'Victor',
                'middle_name'             => 'Manuel',
                'last_name'               => 'Navarro',
                'email'                   => 'victor.navarro@artms.com',
                'phone'                   => '+63 924 800 0008',
                'department_name'         => 'Quality Assurance',
                'job_title'               => 'Head of Quality Assurance & Testing',
                'basic_salary'            => 102000.00,
                'hire_date'               => '2021-05-10',
                'birth_date'              => '1990-10-15',
                'gender'                  => 'Male',
                'address'                 => 'Basak, San Nicolas, Cebu City, Philippines',
                'emergency_contact_name'  => 'Angela Navarro',
                'emergency_contact_phone' => '+63 924 800 0009',
            ],
            [
                'first_name'              => 'Bianca',
                'middle_name'             => 'Joy',
                'last_name'               => 'Sy',
                'email'                   => 'bianca.sy@artms.com',
                'phone'                   => '+63 925 900 0009',
                'department_name'         => 'Sales & Business Dev',
                'job_title'               => 'Head of Sales & Partnerships',
                'basic_salary'            => 112000.00,
                'hire_date'               => '2021-09-01',
                'birth_date'              => '1987-06-30',
                'gender'                  => 'Female',
                'address'                 => 'Mabolo, Cebu City, Philippines',
                'emergency_contact_name'  => 'Kenneth Sy',
                'emergency_contact_phone' => '+63 925 900 0010',
            ],
            [
                'first_name'              => 'Dominic',
                'middle_name'             => 'Paul',
                'last_name'               => 'Tan',
                'email'                   => 'dominic.tan@artms.com',
                'phone'                   => '+63 926 000 0010',
                'department_name'         => 'Customer Support',
                'job_title'               => 'Head of Customer Support & Success',
                'basic_salary'            => 95000.00,
                'hire_date'               => '2022-04-11',
                'birth_date'              => '1991-01-19',
                'gender'                  => 'Male',
                'address'                 => 'Linao, Minglanilla, Cebu, Philippines',
                'emergency_contact_name'  => 'Grace Tan',
                'emergency_contact_phone' => '+63 926 000 0011',
            ],
        ];

        $outputRows = [];
        $index = 1;
        $docBatch = [];
        $attBatch = [];
        $now = now();
        $today = Carbon::today();

        $defaultDocTypes = [
            'birth_cert'    => 'Birth Certificate',
            'sss_card'      => 'SSS Number / Card / E-1 Form',
            'tin'           => 'Tax Identification Number (TIN)',
            'resume'        => 'Updated Resume / Curriculum Vitae',
            'nbi_clearance' => 'NBI Clearance',
            'medical_cert'  => 'Medical Clearance / Fit to Work Certificate',
            'philhealth'    => 'PhilHealth MDR / ID',
            'pagibig'       => 'Pag-IBIG MID / Member Record',
            'diploma'       => 'Diploma / Transcript of Records',
            'photo'         => '2x2 Professional ID Photo',
        ];

        foreach ($deptHeads as $dh) {
            $deptId = $deptMap[$dh['department_name']] ?? reset($deptMap);
            $empIdFormatted = 'EMP-' . str_pad($index, 4, '0', STR_PAD_LEFT);

            // Find or create User account for this department head
            $user = User::firstOrCreate(
                ['email' => $dh['email']],
                [
                    'name'          => trim($dh['first_name'] . ' ' . $dh['last_name']),
                    'first_name'    => $dh['first_name'],
                    'last_name'     => $dh['last_name'],
                    'password'      => Hash::make('DeptHead@2024'),
                    'role'          => 'department_head',
                    'department_id' => $deptId,
                    'is_active'     => true,
                ]
            );

            // Update user's department_id to ensure link
            if ($user->department_id !== $deptId) {
                $user->update(['department_id' => $deptId]);
            }

            $employee = Employee::create([
                'employee_id'              => $empIdFormatted,
                'user_id'                  => $user->id,
                'first_name'               => $dh['first_name'],
                'middle_name'              => $dh['middle_name'],
                'last_name'                => $dh['last_name'],
                'email'                    => $dh['email'],
                'phone'                    => $dh['phone'],
                'contact_number'           => $dh['phone'],
                'department_id'            => $deptId,
                'job_title'                => $dh['job_title'],
                'position'                 => $dh['job_title'],
                'employment_status'        => 'regular',
                'employment_type'          => 'regular',
                'hire_date'                => $dh['hire_date'],
                'date_hired'               => $dh['hire_date'],
                'birth_date'               => $dh['birth_date'],
                'gender'                   => $dh['gender'],
                'address'                  => $dh['address'],
                'emergency_contact_name'   => $dh['emergency_contact_name'],
                'emergency_contact_phone'  => $dh['emergency_contact_phone'],
                'emergency_contact_number' => $dh['emergency_contact_phone'],
                'basic_salary'             => $dh['basic_salary'],
                'salary'                   => $dh['basic_salary'],
                'documents_status'         => 'complete',
                'clearance_processed'      => false,
            ]);

            // Batch documents
            foreach ($defaultDocTypes as $type => $remarks) {
                $docBatch[] = [
                    'employee_id'   => $employee->id,
                    'document_type' => $type,
                    'status'        => 'verified',
                    'remarks'       => $remarks,
                    'file_path'     => 'documents/' . strtolower($dh['first_name'] . '_' . $dh['last_name']) . "_{$type}.pdf",
                    'original_name' => "{$type}.pdf",
                    'submitted_at'  => $now,
                    'verified_at'   => $now,
                    'created_at'    => $now,
                    'updated_at'    => $now,
                ];
            }

            // Batch 15 days of attendance logs
            for ($d = 14; $d >= 0; $d--) {
                $logDate = $today->copy()->subDays($d);
                if ($logDate->isWeekend()) {
                    continue;
                }

                $timeIn = $logDate->copy()->setTime(7, 55, 0);
                $timeOut = $logDate->copy()->setTime(17, 10, 0);

                $attBatch[] = [
                    'employee_id'  => $employee->id,
                    'date'         => $logDate->toDateString(),
                    'time_in'      => $timeIn->format('H:i:s'),
                    'time_out'     => $timeOut->format('H:i:s'),
                    'status'       => 'present',
                    'hours_worked' => 9.25,
                    'created_at'   => $now,
                    'updated_at'   => $now,
                ];
            }

            $outputRows[] = [
                $empIdFormatted,
                trim($dh['first_name'] . ' ' . $dh['last_name']),
                $dh['department_name'],
                $dh['job_title'],
                $dh['email'],
                '₱' . number_format($dh['basic_salary'], 2),
            ];

            $index++;
        }

        // Insert batches in bulk
        if (!empty($docBatch)) {
            DB::table('employee_documents')->insert($docBatch);
        }
        if (!empty($attBatch)) {
            DB::table('attendance_logs')->insert($attBatch);
        }

        if (isset($this->command)) {
            $this->command->info("✅ Successfully seeded exactly 10 Department Head employees across all departments!");
            $this->command->table(
                ['Employee ID', 'Name', 'Department', 'Job Title (Dept Head)', 'Email', 'Basic Salary'],
                $outputRows
            );
        }
    }
}
