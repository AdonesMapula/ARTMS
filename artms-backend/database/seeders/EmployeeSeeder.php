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
use Illuminate\Support\Str;

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

        $sampleEmployees = [
            [
                'name'                  => 'Taylor Reyes',
                'email'                 => 'taylor.reyes@artms.com',
                'position'              => 'Senior Operations Lead',
                'department_id'         => $deptMap['Operations'] ?? $defaultDeptId,
                'salary'                => 65000.00,
                'employment_type'       => 'regular',
                'employment_status'     => 'active',
                'date_hired'            => '2023-01-15',
                'contact_number'        => '09171234567',
                'address'               => 'Makati City, Metro Manila',
                'emergency_contact_name'=> 'Carlos Reyes (Father)',
                'emergency_contact_number' => '09181234567',
            ],
            [
                'name'                  => 'Morgan Lee',
                'email'                 => 'morgan.lee@artms.com',
                'position'              => 'HR Generalist',
                'department_id'         => $deptMap['Human Resources'] ?? $defaultDeptId,
                'salary'                => 45000.00,
                'employment_type'       => 'regular',
                'employment_status'     => 'active',
                'date_hired'            => '2022-03-03',
                'contact_number'        => '09209876543',
                'address'               => 'Quezon City, Metro Manila',
                'emergency_contact_name'=> 'Sarah Lee (Spouse)',
                'emergency_contact_number' => '09219876543',
            ],
            [
                'name'                  => 'Casey Tan',
                'email'                 => 'casey.tan@artms.com',
                'position'              => 'IT Service Desk Specialist',
                'department_id'         => $deptMap['Information Technology'] ?? $defaultDeptId,
                'salary'                => 38000.00,
                'employment_type'       => 'probationary',
                'employment_status'     => 'active',
                'date_hired'            => '2026-07-01',
                'contact_number'        => '09351112222',
                'address'               => 'BGC, Taguig City',
                'emergency_contact_name'=> 'Helen Tan (Mother)',
                'emergency_contact_number' => '09353334444',
            ],
            [
                'name'                  => 'Jordan Cruz',
                'email'                 => 'jordan.cruz@artms.com',
                'position'              => 'Senior Accountant',
                'department_id'         => $deptMap['Finance'] ?? $defaultDeptId,
                'salary'                => 58000.00,
                'employment_type'       => 'regular',
                'employment_status'     => 'active',
                'date_hired'            => '2021-09-20',
                'contact_number'        => '09455556666',
                'address'               => 'Mandaluyong City',
                'emergency_contact_name'=> 'Maria Cruz (Spouse)',
                'emergency_contact_number' => '09457778888',
            ],
            [
                'name'                  => 'Riley Santos',
                'email'                 => 'riley.santos@artms.com',
                'position'              => 'Business Operations Analyst',
                'department_id'         => $deptMap['Operations'] ?? $defaultDeptId,
                'salary'                => 50000.00,
                'employment_type'       => 'regular',
                'employment_status'     => 'on_leave',
                'date_hired'            => '2020-06-05',
                'contact_number'        => '09569990000',
                'address'               => 'Pasig City, Metro Manila',
                'emergency_contact_name'=> 'Elena Santos (Sister)',
                'emergency_contact_number' => '09561112222',
            ],
            [
                'name'                  => 'Avery Gomez',
                'email'                 => 'avery.gomez@artms.com',
                'position'              => 'Content Specialist',
                'department_id'         => $deptMap['Marketing'] ?? $defaultDeptId,
                'salary'                => 42000.00,
                'employment_type'       => 'contractual',
                'employment_status'     => 'resigned',
                'date_hired'            => '2019-02-28',
                'date_terminated'       => '2026-05-15',
                'termination_reason'    => 'Personal reasons / Career progression',
                'contact_number'        => '09673334444',
                'address'               => 'Parañaque City',
                'emergency_contact_name'=> 'Luis Gomez (Brother)',
                'emergency_contact_number' => '09675556666',
            ],
        ];

        foreach ($sampleEmployees as $index => $empData) {
            // 1. Create or Find User
            $user = User::firstOrCreate(
                ['email' => $empData['email']],
                [
                    'name'          => $empData['name'],
                    'password'      => Hash::make('Employee@2026'),
                    'role'          => 'employee',
                    'department_id' => $empData['department_id'],
                    'is_active'     => $empData['employment_status'] === 'active' || $empData['employment_status'] === 'on_leave',
                ]
            );

            // 2. Create Employee Profile
            $employee = Employee::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'department_id'            => $empData['department_id'],
                    'position'                 => $empData['position'],
                    'salary'                   => $empData['salary'],
                    'employment_type'          => $empData['employment_type'],
                    'employment_status'        => $empData['employment_status'],
                    'date_hired'               => $empData['date_hired'],
                    'date_terminated'          => $empData['date_terminated'] ?? null,
                    'termination_reason'       => $empData['termination_reason'] ?? null,
                    'contact_number'           => $empData['contact_number'],
                    'address'                  => $empData['address'],
                    'emergency_contact_name'   => $empData['emergency_contact_name'],
                    'emergency_contact_number' => $empData['emergency_contact_number'],
                ]
            );

            // 3. Assign Employee Number
            $empNumber = $employee->generateEmployeeNumber();
            $user->update(['employee_id' => $empNumber]);

            // 4. Seed 201 Document Checklist & Sample Files
            $employee->seedDefaultDocuments();
            $this->seedSampleDocumentFiles($employee, $empNumber);

            // 5. Seed Audit Log History
            AuditLog::firstOrCreate(
                [
                    'module'   => 'employee',
                    'model_id' => $employee->id,
                    'action'   => 'create',
                ],
                [
                    'user_id'     => $user->id,
                    'description' => "Initial 201 Employee Record created for {$user->name} ({$empNumber})",
                    'created_at'  => $empData['date_hired'],
                ]
            );

            if ($empData['employment_status'] === 'resigned') {
                AuditLog::create([
                    'module'      => 'employee',
                    'model_id'    => $employee->id,
                    'action'      => 'status_change',
                    'user_id'     => 1,
                    'description' => "Employment status changed to RESIGNED for {$user->name}",
                    'old_values'  => ['employment_status' => 'active'],
                    'new_values'  => ['employment_status' => 'resigned', 'date_terminated' => '2026-05-15'],
                    'created_at'  => '2026-05-15',
                ]);
            }

            // 6. Seed Attendance Logs matching 201 Employee Record
            $this->seedAttendanceLogs($employee, $empData);
        }

        $this->command->info('Employee 201 records, sample files & attendance logs seeded successfully!');
    }

    /**
     * Seed matching attendance logs for employees
     */
    private function seedAttendanceLogs(Employee $employee, array $empData): void
    {
        $today     = now()->toDateString();
        $yesterday = now()->subDay()->toDateString();

        $status = $empData['employment_status'];

        if ($status === 'active') {
            AttendanceLog::updateOrCreate(
                ['employee_id' => $employee->id, 'date' => $today],
                [
                    'time_in'      => '08:00',
                    'time_out'     => '17:00',
                    'status'       => 'present',
                    'late_minutes' => 0,
                    'hours_worked' => 8.0,
                    'remarks'      => 'On time / Regular shift',
                ]
            );
            AttendanceLog::updateOrCreate(
                ['employee_id' => $employee->id, 'date' => $yesterday],
                [
                    'time_in'      => '07:55',
                    'time_out'     => '17:05',
                    'status'       => 'present',
                    'late_minutes' => 0,
                    'hours_worked' => 8.0,
                    'remarks'      => 'On time',
                ]
            );
        } else if ($status === 'on_leave') {
            AttendanceLog::updateOrCreate(
                ['employee_id' => $employee->id, 'date' => $today],
                [
                    'time_in'      => null,
                    'time_out'     => null,
                    'status'       => 'on_leave',
                    'late_minutes' => 0,
                    'hours_worked' => 0.0,
                    'remarks'      => 'Approved Leave of Absence',
                ]
            );
        } else if ($status === 'resigned' || $status === 'terminated') {
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

        // Sample document items to attach physical test files
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
