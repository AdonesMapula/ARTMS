<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\JobLibrary;
use App\Models\ManpowerRequest;
use App\Models\User;
use Illuminate\Database\Seeder;

class ManpowerRequestSeeder extends Seeder
{
    public function run(): void
    {
        $hrDept   = Department::where('department_name', 'Human Resources')->first();
        $itDept   = Department::where('department_name', 'Information Technology')->first();
        $finDept  = Department::where('department_name', 'Finance')->first();
        $opsDept  = Department::where('department_name', 'Operations')->first();
        $mktDept  = Department::where('department_name', 'Marketing')->first();
        $admDept  = Department::where('department_name', 'Administration')->first();

        $hrAdmin   = User::where('email', 'hradmin@artms.com')->first();
        $deptHead  = User::where('email', 'depthead@artms.com')->first();
        $coo       = User::where('email', 'coo@artms.com')->first();

        $requests = [
            // ── Approved ──────────────────────────────────────────────────────
            [
                'department_id'    => $itDept?->id,
                'requested_by'     => $deptHead?->id,
                'job_library_id'   => null,
                'position_needed'  => 'Software Engineer',
                'headcount'        => 2,
                'justification'    => 'We need two additional software engineers to support the upcoming ERP integration project scheduled for Q3.',
                'needed_by'        => now()->addMonths(2)->toDateString(),
                'urgency'          => 'high',
                'status'           => 'approved',
                'approved_by'      => $coo?->id,
                'approved_at'      => now()->subDays(5),
                'approval_remarks' => 'Approved. Please coordinate with HR for job posting.',
            ],
            [
                'department_id'    => $hrDept?->id,
                'requested_by'     => $hrAdmin?->id,
                'job_library_id'   => null,
                'position_needed'  => 'HR Assistant',
                'headcount'        => 1,
                'justification'    => 'The HR team is understaffed. An additional assistant is needed to handle onboarding and records management.',
                'needed_by'        => now()->addMonth()->toDateString(),
                'urgency'          => 'medium',
                'status'           => 'approved',
                'approved_by'      => $coo?->id,
                'approved_at'      => now()->subDays(10),
                'approval_remarks' => 'Approved. Proceed with recruitment.',
            ],

            // ── Pending ───────────────────────────────────────────────────────
            [
                'department_id'    => $finDept?->id,
                'requested_by'     => $hrAdmin?->id,
                'job_library_id'   => null,
                'position_needed'  => 'Financial Analyst',
                'headcount'        => 1,
                'justification'    => 'Increased workload during year-end audit requires an additional financial analyst for data analysis and reporting.',
                'needed_by'        => now()->addWeeks(6)->toDateString(),
                'urgency'          => 'high',
                'status'           => 'pending',
                'approved_by'      => null,
                'approved_at'      => null,
                'approval_remarks' => null,
            ],
            [
                'department_id'    => $opsDept?->id,
                'requested_by'     => $deptHead?->id,
                'job_library_id'   => null,
                'position_needed'  => 'Operations Supervisor',
                'headcount'        => 1,
                'justification'    => 'The current supervisor is being promoted. A replacement is needed to maintain daily operations continuity.',
                'needed_by'        => now()->addWeeks(3)->toDateString(),
                'urgency'          => 'critical',
                'status'           => 'pending',
                'approved_by'      => null,
                'approved_at'      => null,
                'approval_remarks' => null,
            ],
            [
                'department_id'    => $mktDept?->id,
                'requested_by'     => $hrAdmin?->id,
                'job_library_id'   => null,
                'position_needed'  => 'Digital Marketing Specialist',
                'headcount'        => 2,
                'justification'    => 'Expanding digital presence requires two specialists to manage social media, SEO, and paid advertising campaigns.',
                'needed_by'        => now()->addMonths(2)->toDateString(),
                'urgency'          => 'medium',
                'status'           => 'pending',
                'approved_by'      => null,
                'approved_at'      => null,
                'approval_remarks' => null,
            ],

            // ── Rejected ──────────────────────────────────────────────────────
            [
                'department_id'    => $admDept?->id,
                'requested_by'     => $hrAdmin?->id,
                'job_library_id'   => null,
                'position_needed'  => 'Administrative Clerk',
                'headcount'        => 3,
                'justification'    => 'Need additional clerks to handle filing and documentation backlog.',
                'needed_by'        => now()->addWeeks(4)->toDateString(),
                'urgency'          => 'low',
                'status'           => 'rejected',
                'approved_by'      => $coo?->id,
                'approved_at'      => now()->subDays(3),
                'approval_remarks' => 'Rejected. Headcount of 3 exceeds current budget allocation. Resubmit for 1 position only.',
            ],

            // ── Fulfilled ─────────────────────────────────────────────────────
            [
                'department_id'    => $itDept?->id,
                'requested_by'     => $deptHead?->id,
                'job_library_id'   => null,
                'position_needed'  => 'IT Support Technician',
                'headcount'        => 1,
                'justification'    => 'Needed a technician to maintain hardware infrastructure and provide helpdesk support.',
                'needed_by'        => now()->subMonth()->toDateString(),
                'urgency'          => 'medium',
                'status'           => 'fulfilled',
                'approved_by'      => $coo?->id,
                'approved_at'      => now()->subMonths(2),
                'approval_remarks' => 'Approved and position has been filled.',
            ],
        ];

        foreach ($requests as $data) {
            ManpowerRequest::create($data);
        }

        $this->command->info('Manpower requests seeded successfully.');
        $this->command->table(
            ['Position', 'Department', 'Headcount', 'Urgency', 'Status'],
            collect($requests)->map(fn($r) => [
                $r['position_needed'],
                Department::find($r['department_id'])?->department_name ?? 'N/A',
                $r['headcount'],
                $r['urgency'],
                $r['status'],
            ])->toArray()
        );
    }
}
