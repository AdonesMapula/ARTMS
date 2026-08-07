<?php

namespace Database\Seeders;

use App\Models\AttendanceLog;
use App\Models\AuditLog;
use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeDocument;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $departments = Department::all();
        if ($departments->isEmpty()) {
            $this->call(DatabaseSeeder::class);
            $departments = Department::all();
        }

        $deptMap = $departments->pluck('id', 'department_name')->toArray();
        $defaultDeptId = reset($deptMap) ?: 1;

        // ── Sample Employees (aligned with DATABASE_SCHEMA.md) ──────────────
        $sampleEmployees = [
            [
                'first_name'               => 'Taylor',
                'middle_name'              => 'A.',
                'last_name'                => 'Reyes',
                'email'                    => 'taylor.reyes@artms.com',
                'phone'                    => '09171234567',
                'department_id'            => $deptMap['Operations'] ?? $defaultDeptId,
                'job_title'                => 'Senior Operations Lead',
                'employment_status'        => 'regular',
                'hire_date'                => '2023-01-15',
                'birth_date'               => '1990-04-22',
                'gender'                   => 'Male',
                'address'                  => 'Makati City, Metro Manila',
                'emergency_contact_name'   => 'Carlos Reyes',
                'emergency_contact_phone'  => '09181234567',
                'basic_salary'             => 65000.00,
                'documents_status'         => 'complete',
            ],
            [
                'first_name'               => 'Morgan',
                'middle_name'              => null,
                'last_name'                => 'Lee',
                'email'                    => 'morgan.lee@artms.com',
                'phone'                    => '09209876543',
                'department_id'            => $deptMap['Human Resources'] ?? $defaultDeptId,
                'job_title'                => 'HR Generalist',
                'employment_status'        => 'regular',
                'hire_date'                => '2022-03-03',
                'birth_date'               => '1993-08-15',
                'gender'                   => 'Female',
                'address'                  => 'Quezon City, Metro Manila',
                'emergency_contact_name'   => 'Sarah Lee',
                'emergency_contact_phone'  => '09219876543',
                'basic_salary'             => 45000.00,
                'documents_status'         => 'complete',
            ],
            [
                'first_name'               => 'Casey',
                'middle_name'              => 'B.',
                'last_name'                => 'Tan',
                'email'                    => 'casey.tan@artms.com',
                'phone'                    => '09351112222',
                'department_id'            => $deptMap['Information Technology'] ?? $defaultDeptId,
                'job_title'                => 'IT Service Desk Specialist',
                'employment_status'        => 'probationary',
                'hire_date'                => '2026-07-01',
                'birth_date'               => '1999-02-10',
                'gender'                   => 'Male',
                'address'                  => 'BGC, Taguig City',
                'emergency_contact_name'   => 'Helen Tan',
                'emergency_contact_phone'  => '09353334444',
                'basic_salary'             => 38000.00,
                'documents_status'         => 'incomplete',
            ],
            [
                'first_name'               => 'Jordan',
                'middle_name'              => 'C.',
                'last_name'                => 'Cruz',
                'email'                    => 'jordan.cruz@artms.com',
                'phone'                    => '09455556666',
                'department_id'            => $deptMap['Finance'] ?? $defaultDeptId,
                'job_title'                => 'Senior Accountant',
                'employment_status'        => 'regular',
                'hire_date'                => '2021-09-20',
                'birth_date'               => '1988-12-05',
                'gender'                   => 'Male',
                'address'                  => 'Mandaluyong City',
                'emergency_contact_name'   => 'Maria Cruz',
                'emergency_contact_phone'  => '09457778888',
                'basic_salary'             => 58000.00,
                'documents_status'         => 'complete',
            ],
            [
                'first_name'               => 'Riley',
                'middle_name'              => null,
                'last_name'                => 'Santos',
                'email'                    => 'riley.santos@artms.com',
                'phone'                    => '09569990000',
                'department_id'            => $deptMap['Operations'] ?? $defaultDeptId,
                'job_title'                => 'Business Operations Analyst',
                'employment_status'        => 'regular',
                'hire_date'                => '2020-06-05',
                'birth_date'               => '1995-07-19',
                'gender'                   => 'Female',
                'address'                  => 'Pasig City, Metro Manila',
                'emergency_contact_name'   => 'Elena Santos',
                'emergency_contact_phone'  => '09561112222',
                'basic_salary'             => 50000.00,
                'documents_status'         => 'complete',
            ],
            [
                'first_name'               => 'Avery',
                'middle_name'              => 'D.',
                'last_name'                => 'Gomez',
                'email'                    => 'avery.gomez@artms.com',
                'phone'                    => '09673334444',
                'department_id'            => $deptMap['Marketing'] ?? $defaultDeptId,
                'job_title'                => 'Content Specialist',
                'employment_status'        => 'resigned',
                'hire_date'                => '2019-02-28',
                'birth_date'               => '1992-11-30',
                'gender'                   => 'Female',
                'address'                  => 'Parañaque City',
                'emergency_contact_name'   => 'Luis Gomez',
                'emergency_contact_phone'  => '09675556666',
                'basic_salary'             => 42000.00,
                'documents_status'         => 'complete',
            ],
            // Additional employees for richer seed data
            [
                'first_name'               => 'Samantha',
                'middle_name'              => 'E.',
                'last_name'                => 'Villanueva',
                'email'                    => 'samantha.villanueva@artms.com',
                'phone'                    => '09281234567',
                'department_id'            => $deptMap['Finance'] ?? $defaultDeptId,
                'job_title'                => 'Payroll Officer',
                'employment_status'        => 'regular',
                'hire_date'                => '2020-11-10',
                'birth_date'               => '1991-03-25',
                'gender'                   => 'Female',
                'address'                  => 'Las Piñas City, Metro Manila',
                'emergency_contact_name'   => 'Ramon Villanueva',
                'emergency_contact_phone'  => '09289876543',
                'basic_salary'             => 48000.00,
                'documents_status'         => 'complete',
            ],
            [
                'first_name'               => 'Marcus',
                'middle_name'              => null,
                'last_name'                => 'Dela Torre',
                'email'                    => 'marcus.delatorre@artms.com',
                'phone'                    => '09151234567',
                'department_id'            => $deptMap['Information Technology'] ?? $defaultDeptId,
                'job_title'                => 'Systems Administrator',
                'employment_status'        => 'regular',
                'hire_date'                => '2021-04-01',
                'birth_date'               => '1989-06-14',
                'gender'                   => 'Male',
                'address'                  => 'Caloocan City, Metro Manila',
                'emergency_contact_name'   => 'Liza Dela Torre',
                'emergency_contact_phone'  => '09159876543',
                'basic_salary'             => 55000.00,
                'documents_status'         => 'complete',
            ],
            [
                'first_name'               => 'Patricia',
                'middle_name'              => 'G.',
                'last_name'                => 'Bautista',
                'email'                    => 'patricia.bautista@artms.com',
                'phone'                    => '09351113333',
                'department_id'            => $deptMap['Administration'] ?? $defaultDeptId,
                'job_title'                => 'Administrative Officer',
                'employment_status'        => 'contractual',
                'hire_date'                => '2025-01-15',
                'birth_date'               => '1998-09-08',
                'gender'                   => 'Female',
                'address'                  => 'Marikina City, Metro Manila',
                'emergency_contact_name'   => 'Jose Bautista',
                'emergency_contact_phone'  => '09354445555',
                'basic_salary'             => 32000.00,
                'documents_status'         => 'pending',
            ],
            [
                'first_name'               => 'Kevin',
                'middle_name'              => 'H.',
                'last_name'                => 'Garcia',
                'email'                    => 'kevin.garcia@artms.com',
                'phone'                    => '09461234567',
                'department_id'            => $deptMap['Marketing'] ?? $defaultDeptId,
                'job_title'                => 'Digital Marketing Specialist',
                'employment_status'        => 'probationary',
                'hire_date'                => '2026-06-01',
                'birth_date'               => '2000-01-20',
                'gender'                   => 'Male',
                'address'                  => 'Valenzuela City, Metro Manila',
                'emergency_contact_name'   => 'Ana Garcia',
                'emergency_contact_phone'  => '09469876543',
                'basic_salary'             => 30000.00,
                'documents_status'         => 'incomplete',
            ],
            [
                'first_name'               => 'Lena',
                'middle_name'              => null,
                'last_name'                => 'Mendoza',
                'email'                    => 'lena.mendoza@artms.com',
                'phone'                    => '09221234567',
                'department_id'            => $deptMap['Human Resources'] ?? $defaultDeptId,
                'job_title'                => 'Recruitment Specialist',
                'employment_status'        => 'regular',
                'hire_date'                => '2019-08-01',
                'birth_date'               => '1987-04-17',
                'gender'                   => 'Female',
                'address'                  => 'Malabon City, Metro Manila',
                'emergency_contact_name'   => 'Pedro Mendoza',
                'emergency_contact_phone'  => '09229876543',
                'basic_salary'             => 52000.00,
                'documents_status'         => 'complete',
            ],
            [
                'first_name'               => 'Daniel',
                'middle_name'              => 'I.',
                'last_name'                => 'Ramos',
                'email'                    => 'daniel.ramos@artms.com',
                'phone'                    => '09571234567',
                'department_id'            => $deptMap['Operations'] ?? $defaultDeptId,
                'job_title'                => 'OJT Intern',
                'employment_status'        => 'ojt',
                'hire_date'                => '2026-07-15',
                'birth_date'               => '2003-03-05',
                'gender'                   => 'Male',
                'address'                  => 'Navotas City, Metro Manila',
                'emergency_contact_name'   => 'Rosa Ramos',
                'emergency_contact_phone'  => '09579876543',
                'basic_salary'             => 0.00,
                'documents_status'         => 'pending',
            ],
            [
                'first_name'               => 'Angela',
                'middle_name'              => 'J.',
                'last_name'                => 'Torres',
                'email'                    => 'angela.torres@artms.com',
                'phone'                    => '09481234567',
                'department_id'            => $deptMap['Finance'] ?? $defaultDeptId,
                'job_title'                => 'Junior Accountant',
                'employment_status'        => 'terminated',
                'hire_date'                => '2022-05-10',
                'birth_date'               => '1996-10-12',
                'gender'                   => 'Female',
                'address'                  => 'Paranaque City, Metro Manila',
                'emergency_contact_name'   => 'Felix Torres',
                'emergency_contact_phone'  => '09489876543',
                'basic_salary'             => 35000.00,
                'documents_status'         => 'complete',
            ],
        ];

        $summary = [];

        foreach ($sampleEmployees as $index => $empData) {
            $fullName = trim("{$empData['first_name']} " . ($empData['middle_name'] ? "{$empData['middle_name']} " : '') . $empData['last_name']);

            // 1. Create or Find User account
            $user = User::firstOrCreate(
                ['email' => $empData['email']],
                [
                    'name'          => $fullName,
                    'password'      => Hash::make('Employee@2026'),
                    'role'          => 'employee',
                    'department_id' => $empData['department_id'],
                    'is_active'     => !in_array($empData['employment_status'], ['resigned', 'terminated']),
                ]
            );

            // 2. Create or Update Employee 201 Record
            $employee = Employee::updateOrCreate(
                ['user_id' => $user->id],
                [
                    // New schema columns
                    'first_name'              => $empData['first_name'],
                    'middle_name'             => $empData['middle_name'],
                    'last_name'               => $empData['last_name'],
                    'email'                   => $empData['email'],
                    'phone'                   => $empData['phone'],
                    'department_id'           => $empData['department_id'],
                    'job_title'               => $empData['job_title'],
                    'employment_status'       => $empData['employment_status'],
                    'hire_date'               => $empData['hire_date'],
                    'birth_date'              => $empData['birth_date'],
                    'gender'                  => $empData['gender'],
                    'address'                 => $empData['address'],
                    'emergency_contact_name'  => $empData['emergency_contact_name'],
                    'emergency_contact_phone' => $empData['emergency_contact_phone'],
                    'basic_salary'            => $empData['basic_salary'],
                    'documents_status'        => $empData['documents_status'],
                    // Legacy columns (kept in sync for backward compatibility)
                    'position'                => $empData['job_title'],
                    'salary'                  => $empData['basic_salary'],
                    'date_hired'              => $empData['hire_date'],
                    'contact_number'          => $empData['phone'],
                    'emergency_contact_number'=> $empData['emergency_contact_phone'],
                    'employment_type'         => $this->mapEmploymentType($empData['employment_status']),
                ]
            );

            // 3. Generate & Assign Employee ID (EMP-XXXX format per schema)
            $empNumber = $employee->generateEmployeeNumber();
            if (!$employee->employee_id) {
                $employee->update(['employee_id' => $empNumber]);
            } else {
                $empNumber = $employee->employee_id;
            }
            // Also store on user record
            $user->update(['employee_id' => $empNumber]);

            // 4. Seed 201 Document Checklist & Sample Files
            $employee->seedDefaultDocuments();
            $this->seedSampleDocumentFiles($employee, $empNumber);

            // 5. Seed Attendance Logs
            $this->seedAttendanceLogs($employee, $empData['employment_status']);

            // 6. Seed Audit Log entry
            AuditLog::firstOrCreate(
                [
                    'module'   => 'employee',
                    'model_id' => $employee->id,
                    'action'   => 'create',
                ],
                [
                    'user_id'     => $user->id,
                    'description' => "Initial 201 Employee Record created for {$fullName} ({$empNumber})",
                    'created_at'  => $empData['hire_date'],
                ]
            );

            if ($empData['employment_status'] === 'resigned') {
                AuditLog::firstOrCreate(
                    [
                        'module'   => 'employee',
                        'model_id' => $employee->id,
                        'action'   => 'status_change',
                    ],
                    [
                        'user_id'     => 1,
                        'description' => "Employment status changed to RESIGNED for {$fullName}",
                        'created_at'  => '2026-05-15',
                    ]
                );
            }

            if ($empData['employment_status'] === 'terminated') {
                AuditLog::firstOrCreate(
                    [
                        'module'   => 'employee',
                        'model_id' => $employee->id,
                        'action'   => 'status_change',
                    ],
                    [
                        'user_id'     => 1,
                        'description' => "Employment status changed to TERMINATED for {$fullName}",
                        'created_at'  => '2026-06-30',
                    ]
                );
            }

            $summary[] = [
                $empNumber,
                $fullName,
                $empData['job_title'],
                Department::find($empData['department_id'])?->department_name ?? 'N/A',
                $empData['employment_status'],
            ];
        }

        $this->command->info('✅ Employee 201 records seeded successfully!');
        $this->command->table(
            ['Employee ID', 'Name', 'Job Title', 'Department', 'Status'],
            $summary
        );
    }

    /**
     * Map new schema employment_status to legacy employment_type string
     */
    private function mapEmploymentType(string $status): string
    {
        return match($status) {
            'regular'       => 'regular',
            'probationary'  => 'probationary',
            'contractual'   => 'contractual',
            'project_based' => 'contractual',
            'ojt'           => 'ojt',
            'resigned'      => 'regular',
            'terminated'    => 'regular',
            default         => 'regular',
        };
    }

    /**
     * Seed attendance logs based on employment status
     */
    private function seedAttendanceLogs(Employee $employee, string $status): void
    {
        $today     = now()->toDateString();
        $yesterday = now()->subDay()->toDateString();

        if (in_array($status, ['regular', 'probationary', 'contractual', 'project_based'])) {
            AttendanceLog::updateOrCreate(
                ['employee_id' => $employee->id, 'date' => $today],
                [
                    'time_in'      => '08:00:00',
                    'time_out'     => '17:00:00',
                    'status'       => 'present',
                    'late_minutes' => 0,
                    'hours_worked' => 8.0,
                    'remarks'      => 'On time / Regular shift',
                ]
            );
            AttendanceLog::updateOrCreate(
                ['employee_id' => $employee->id, 'date' => $yesterday],
                [
                    'time_in'      => '07:55:00',
                    'time_out'     => '17:05:00',
                    'status'       => 'present',
                    'late_minutes' => 0,
                    'hours_worked' => 8.17,
                    'remarks'      => 'On time',
                ]
            );
        } elseif ($status === 'ojt') {
            AttendanceLog::updateOrCreate(
                ['employee_id' => $employee->id, 'date' => $today],
                [
                    'time_in'      => '08:30:00',
                    'time_out'     => '17:00:00',
                    'status'       => 'late',
                    'late_minutes' => 30,
                    'hours_worked' => 7.5,
                    'remarks'      => 'OJT trainee — late by 30 mins',
                ]
            );
        } elseif (in_array($status, ['resigned', 'terminated'])) {
            AttendanceLog::updateOrCreate(
                ['employee_id' => $employee->id, 'date' => $today],
                [
                    'time_in'      => null,
                    'time_out'     => null,
                    'status'       => 'absent',
                    'late_minutes' => 0,
                    'hours_worked' => 0.0,
                    'remarks'      => 'Separated / Offboarded',
                ]
            );
        }
    }

    /**
     * Generate physical sample test files for employee 201 file storage
     */
    private function seedSampleDocumentFiles(Employee $employee, string $empNumber): void
    {
        $folder = "employee_documents/{$empNumber}";

        $sampleFiles = [
            [
                'type'     => 'resume',
                'filename' => "Resume_{$empNumber}.pdf",
                'content'  => "%PDF-1.4 ARTMS Sample Resume Document for Employee {$empNumber}",
                'status'   => 'verified',
                'remarks'  => 'Verified original candidate CV',
            ],
            [
                'type'     => 'birth_cert',
                'filename' => "PSA_BirthCertificate_{$empNumber}.pdf",
                'content'  => "%PDF-1.4 PSA Birth Certificate Copy for Employee {$empNumber}",
                'status'   => 'verified',
                'remarks'  => 'PSA Copy verified',
            ],
            [
                'type'     => 'sss_card',
                'filename' => "SSS_E1_Form_{$empNumber}.pdf",
                'content'  => "%PDF-1.4 SSS E1 Member Record for Employee {$empNumber}",
                'status'   => 'submitted',
                'remarks'  => 'Submitted for verification',
            ],
            [
                'type'     => 'nbi_clearance',
                'filename' => "NBI_Clearance_{$empNumber}.pdf",
                'content'  => "%PDF-1.4 NBI Clearance Document for Employee {$empNumber}",
                'status'   => 'verified',
                'remarks'  => 'Valid clearance verified',
            ],
            [
                'type'     => 'medical_cert',
                'filename' => "Medical_FitToWork_{$empNumber}.pdf",
                'content'  => "%PDF-1.4 Fit to Work Certificate for Employee {$empNumber}",
                'status'   => 'verified',
                'remarks'  => 'Fit to Work verified by clinic',
            ],
        ];

        foreach ($sampleFiles as $fileInfo) {
            $filePath = "{$folder}/{$fileInfo['filename']}";
            Storage::disk('public')->put($filePath, $fileInfo['content']);

            EmployeeDocument::updateOrCreate(
                [
                    'employee_id'   => $employee->id,
                    'document_type' => $fileInfo['type'],
                ],
                [
                    'file_path'     => $filePath,
                    'original_name' => $fileInfo['filename'],
                    'status'        => $fileInfo['status'],
                    'remarks'       => $fileInfo['remarks'],
                    'submitted_at'  => now(),
                    'verified_at'   => $fileInfo['status'] === 'verified' ? now() : null,
                ]
            );
        }
    }
}
