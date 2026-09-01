<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\JobLibrary;
use App\Models\JobPosting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class JobPostingSeeder extends Seeder
{
    public function run(): void
    {
        // ── Clean out old job postings & library entries first ──────────────
        Schema::disableForeignKeyConstraints();
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('TRUNCATE TABLE job_postings, job_library RESTART IDENTITY CASCADE;');
        } else {
            JobPosting::truncate();
            JobLibrary::truncate();
        }
        Schema::enableForeignKeyConstraints();

        $hrAdmin = User::where('email', 'hradmin@artms.com')->first() ?? User::first();
        $coo     = User::where('email', 'coo@artms.com')->first() ?? User::first();

        $hrDept  = Department::where('department_name', 'Human Resources')->first();
        $itDept  = Department::where('department_name', 'Information Technology')->first();
        $finDept = Department::where('department_name', 'Finance')->first();
        $opsDept = Department::where('department_name', 'Operations')->first();
        $mktDept = Department::where('department_name', 'Marketing')->first();
        $admDept = Department::where('department_name', 'Administration')->first();

        $jobs = [
            // ── 1. Software Engineer (IT) ───────────────────────────────────
            [
                'department'      => $itDept,
                'job_title'       => 'Software Engineer',
                'job_description' => 'Design, develop, test, and maintain web applications and internal systems. Collaborate with cross-functional teams to deliver scalable software solutions.',
                'qualifications'  => "Bachelor's Degree in Computer Science, Information Technology, or related field. At least 2 years of experience in software development. Proficient in PHP, JavaScript, and relational databases.",
                'responsibilities'=> "Write clean, maintainable code following best practices. Participate in code reviews and technical discussions. Debug and resolve software defects.",
                'job_category'    => 'Technology',
                'employment_type' => 'full_time',
                'salary_min'      => 35000,
                'salary_max'      => 55000,
                'vacancies'       => 2,
                'location'        => 'Cebu City, Philippines',
                'approval_status' => 'approved',
            ],
            // ── 2. IT Support Technician (IT) ──────────────────────────────
            [
                'department'      => $itDept,
                'job_title'       => 'IT Support Technician',
                'job_description' => 'Provide technical support and troubleshooting for hardware, software, and network issues across the organization.',
                'qualifications'  => "Bachelor's Degree in Information Technology or related field. At least 1 year of experience in IT helpdesk. Knowledge of Windows OS, networking, and hardware setup.",
                'responsibilities'=> "Respond to and resolve IT helpdesk tickets. Set up and configure workstations, printers, and peripherals. Maintain IT hardware inventory.",
                'job_category'    => 'Technology',
                'employment_type' => 'full_time',
                'salary_min'      => 20000,
                'salary_max'      => 30000,
                'vacancies'       => 1,
                'location'        => 'Cebu City, Philippines',
                'approval_status' => 'approved',
            ],
            // ── 3. Full Stack Web Developer (IT) ───────────────────────────
            [
                'department'      => $itDept,
                'job_title'       => 'Full Stack Web Developer',
                'job_description' => 'Build and scale end-to-end web applications utilizing modern frontend frameworks and robust backend microservices.',
                'qualifications'  => "Bachelor's Degree in CS/IT. 3+ years experience with React.js, Node.js or Laravel, and PostgreSQL/MySQL. Strong understanding of REST/GraphQL APIs.",
                'responsibilities'=> "Develop user interfaces and server-side logic. Optimize applications for maximum speed and scalability. Implement security and data protection measures.",
                'job_category'    => 'Technology',
                'employment_type' => 'full_time',
                'salary_min'      => 45000,
                'salary_max'      => 70000,
                'vacancies'       => 2,
                'location'        => 'Cebu City, Philippines',
                'approval_status' => 'approved',
            ],
            // ── 4. UI/UX Designer (IT) ─────────────────────────────────────
            [
                'department'      => $itDept,
                'job_title'       => 'UI/UX Designer',
                'job_description' => 'Create intuitive, accessible, and aesthetically engaging user interfaces for internal enterprise tools and client-facing web portals.',
                'qualifications'  => "Degree in Design, Multimedia Arts, or CS. Proficiency with Figma, Adobe XD, and user research methodologies. Portfolio of completed product designs.",
                'responsibilities'=> "Conduct user research and usability testing. Create wireframes, user journeys, and high-fidelity interactive prototypes. Maintain design system tokens.",
                'job_category'    => 'Creative & Design',
                'employment_type' => 'full_time',
                'salary_min'      => 30000,
                'salary_max'      => 48000,
                'vacancies'       => 1,
                'location'        => 'Cebu City, Philippines',
                'approval_status' => 'pending',
            ],
            // ── 5. Cybersecurity Specialist (IT) ───────────────────────────
            [
                'department'      => $itDept,
                'job_title'       => 'Cybersecurity Specialist',
                'job_description' => 'Safeguard corporate networks, servers, and sensitive data against unauthorized access, vulnerability exploits, and cyber threats.',
                'qualifications'  => "Bachelor's Degree in Cybersecurity or IT. CompTIA Security+ or CEH certification is a plus. Knowledge of firewall management and vulnerability assessment.",
                'responsibilities'=> "Monitor network traffic for unusual activities. Perform vulnerability scans and security audits. Maintain incident response protocols.",
                'job_category'    => 'Technology',
                'employment_type' => 'full_time',
                'salary_min'      => 40000,
                'salary_max'      => 65000,
                'vacancies'       => 1,
                'location'        => 'Cebu City, Philippines',
                'approval_status' => 'revised',
            ],
            // ── 6. HR Assistant (HR) ───────────────────────────────────────
            [
                'department'      => $hrDept,
                'job_title'       => 'HR Assistant',
                'job_description' => 'Support the Human Resources team in day-to-day HR operations including recruitment, onboarding, 201 file management, and engagement.',
                'qualifications'  => "Bachelor's Degree in Human Resources, Psychology, or related field. Fresh graduates welcome. Strong organizational and interpersonal communication skills.",
                'responsibilities'=> "Assist in candidate sourcing and interview scheduling. Maintain 201 records and digital HR files. Coordinate onboarding orientation for new hires.",
                'job_category'    => 'Human Resources',
                'employment_type' => 'full_time',
                'salary_min'      => 18000,
                'salary_max'      => 25000,
                'vacancies'       => 1,
                'location'        => 'Cebu City, Philippines',
                'approval_status' => 'approved',
            ],
            // ── 7. Training & Development Specialist (HR) ──────────────────
            [
                'department'      => $hrDept,
                'job_title'       => 'Training and Development Specialist',
                'job_description' => 'Design, implement, and evaluate organizational training modules to build employee competencies and foster career development.',
                'qualifications'  => "Bachelor's Degree in HR, Education, or Psychology. At least 2 years of experience in corporate learning & development. Excellent presentation skills.",
                'responsibilities'=> "Conduct training needs assessments. Design workshops and digital learning modules. Track learning metrics and evaluation feedback.",
                'job_category'    => 'Human Resources',
                'employment_type' => 'full_time',
                'salary_min'      => 28000,
                'salary_max'      => 40000,
                'vacancies'       => 1,
                'location'        => 'Cebu City, Philippines',
                'approval_status' => 'approved',
            ],
            // ── 8. Talent Acquisition Lead (HR) ────────────────────────────
            [
                'department'      => $hrDept,
                'job_title'       => 'Talent Acquisition Lead',
                'job_description' => 'Lead full-cycle recruitment strategies to attract top-tier talent for technical, administrative, and management positions.',
                'qualifications'  => "Bachelor's Degree in HR or Business. 4+ years of end-to-end recruitment experience. Proven track record in talent sourcing and employer branding.",
                'responsibilities'=> "Manage recruitment pipelines and recruitment metrics. Partner with department heads on workforce planning. Lead campus and online hiring drives.",
                'job_category'    => 'Human Resources',
                'employment_type' => 'full_time',
                'salary_min'      => 38000,
                'salary_max'      => 58000,
                'vacancies'       => 1,
                'location'        => 'Cebu City, Philippines',
                'approval_status' => 'pending',
            ],
            // ── 9. Compensation & Benefits Officer (HR) ────────────────────
            [
                'department'      => $hrDept,
                'job_title'       => 'Compensation & Benefits Officer',
                'job_description' => 'Administer employee benefits programs, statutory contributions (SSS, PhilHealth, Pag-IBIG), and market salary benchmarking.',
                'qualifications'  => "Bachelor's Degree in HR, Finance, or Business. 2+ years experience in total rewards and benefits administration. Proficient in Philippine labor laws.",
                'responsibilities'=> "Process statutory benefit claims and company health insurance. Conduct annual salary benchmarking surveys. Assist in payroll deduction reconciliation.",
                'job_category'    => 'Human Resources',
                'employment_type' => 'full_time',
                'salary_min'      => 26000,
                'salary_max'      => 38000,
                'vacancies'       => 1,
                'location'        => 'Cebu City, Philippines',
                'approval_status' => 'rejected',
            ],
            // ── 10. Financial Analyst (Finance) ────────────────────────────
            [
                'department'      => $finDept,
                'job_title'       => 'Financial Analyst',
                'job_description' => 'Analyze financial data, prepare budget forecasts, and deliver actionable fiscal insights to support executive decision-making.',
                'qualifications'  => "Bachelor's Degree in Accountancy or Finance. CPA license preferred. 2+ years of relevant experience. Advanced proficiency in Excel financial modeling.",
                'responsibilities'=> "Prepare variance analysis and monthly executive financial summaries. Assist in annual budget preparations. Support external audit compliance.",
                'job_category'    => 'Finance',
                'employment_type' => 'full_time',
                'salary_min'      => 30000,
                'salary_max'      => 45000,
                'vacancies'       => 1,
                'location'        => 'Cebu City, Philippines',
                'approval_status' => 'approved',
            ],
            // ── 11. Senior Accountant (Finance) ────────────────────────────
            [
                'department'      => $finDept,
                'job_title'       => 'Senior Accountant',
                'job_description' => 'Manage general ledger accounting, tax filings (BIR compliance), reconciliation, and financial statement consolidation.',
                'qualifications'  => "Certified Public Accountant (CPA). At least 3 years of general accounting experience. In-depth knowledge of Philippine tax laws and IFRS/PFRS.",
                'responsibilities'=> "Review journal entries and balance sheet reconciliations. Prepare statutory tax returns and compliance schedules. Supervise accounting associates.",
                'job_category'    => 'Finance',
                'employment_type' => 'full_time',
                'salary_min'      => 40000,
                'salary_max'      => 60000,
                'vacancies'       => 1,
                'location'        => 'Cebu City, Philippines',
                'approval_status' => 'approved',
            ],
            // ── 12. Operations Supervisor (Operations) ─────────────────────
            [
                'department'      => $opsDept,
                'job_title'       => 'Operations Supervisor',
                'job_description' => 'Oversee daily operational workflows, manage shift schedules, and ensure organizational service delivery standards are met.',
                'qualifications'  => "Bachelor's Degree in Business Management, Industrial Engineering, or related field. 3+ years in operations management with supervisory experience.",
                'responsibilities'=> "Supervise on-ground operations staff. Track daily performance metrics and SLAs. Drive continuous process improvement initiatives.",
                'job_category'    => 'Operations',
                'employment_type' => 'full_time',
                'salary_min'      => 35000,
                'salary_max'      => 50000,
                'vacancies'       => 1,
                'location'        => 'Cebu City, Philippines',
                'approval_status' => 'approved',
            ],
            // ── 13. Logistics & Inventory Officer (Operations) ─────────────
            [
                'department'      => $opsDept,
                'job_title'       => 'Logistics & Inventory Officer',
                'job_description' => 'Coordinate supply chain logistics, inventory warehousing, stock reconciliations, and dispatch distribution.',
                'qualifications'  => "Bachelor's Degree in Supply Chain, Logistics, or Business Administration. 2+ years of warehouse/inventory experience. Knowledge of ERP systems.",
                'responsibilities'=> "Monitor stock levels and reorder points. Coordinate freight dispatch and vendor deliveries. Conduct periodic physical inventory counts.",
                'job_category'    => 'Logistics',
                'employment_type' => 'full_time',
                'salary_min'      => 24000,
                'salary_max'      => 35000,
                'vacancies'       => 1,
                'location'        => 'Cebu City, Philippines',
                'approval_status' => 'pending',
            ],
            // ── 14. Digital Marketing Specialist (Marketing) ───────────────
            [
                'department'      => $mktDept,
                'job_title'       => 'Digital Marketing Specialist',
                'job_description' => 'Plan and execute omni-channel digital marketing campaigns across social media, SEO, email, and digital advertising channels.',
                'qualifications'  => "Bachelor's Degree in Marketing, Communications, or related field. 2+ years experience in digital campaigns, Meta Ads Manager, and Google Analytics.",
                'responsibilities'=> "Create high-converting social media content schedules. Manage paid ad budgets and calculate ROAS. Generate weekly marketing lead reports.",
                'job_category'    => 'Marketing',
                'employment_type' => 'full_time',
                'salary_min'      => 25000,
                'salary_max'      => 38000,
                'vacancies'       => 2,
                'location'        => 'Cebu City, Philippines',
                'approval_status' => 'approved',
            ],
            // ── 15. Administrative Assistant (Administration) ──────────────
            [
                'department'      => $admDept,
                'job_title'       => 'Administrative Assistant',
                'job_description' => 'Provide clerical, documentation, and office coordination support to ensure efficient daily workplace operations.',
                'qualifications'  => "Bachelor's Degree in Business Administration, Office Management, or related field. Proficient in MS 365, Google Workspace, and office filing.",
                'responsibilities'=> "Manage executive appointments and office correspondence. Order and track office supplies. Coordinate visitor reception and meeting logistics.",
                'job_category'    => 'Administration',
                'employment_type' => 'full_time',
                'salary_min'      => 18000,
                'salary_max'      => 24000,
                'vacancies'       => 2,
                'location'        => 'Cebu City, Philippines',
                'approval_status' => 'approved',
            ],
        ];

        $summary = [];

        foreach ($jobs as $idx => $job) {
            $dept = $job['department'];
            $appStatus = $job['approval_status'];
            $salaryType = ($job['salary_min'] !== null && $job['salary_max'] !== null) ? 'range' : 'exact';

            // Create unique job library template entry
            $lib = JobLibrary::create([
                'job_title'        => $job['job_title'],
                'job_description'  => $job['job_description'],
                'qualifications'   => [
                    [
                        'id' => uniqid(),
                        'title' => 'Core Qualifications',
                        'details' => [
                            ['id' => uniqid(), 'value' => $job['qualifications']]
                        ]
                    ]
                ],
                'responsibilities' => [
                    [
                        'id' => uniqid(),
                        'title' => 'Key Responsibilities',
                        'details' => [
                            ['id' => uniqid(), 'value' => $job['responsibilities']]
                        ]
                    ]
                ],
                'job_category'     => $job['job_category'],
                'employment_type'  => $job['employment_type'],
                'salary_type'      => $salaryType,
                'salary_min'       => $job['salary_min'],
                'salary_max'       => $job['salary_max'],
                'approval_status'  => $appStatus,
                'approved_by'      => $appStatus === 'approved' ? $coo?->id : null,
                'approved_at'      => $appStatus === 'approved' ? now()->subDays(rand(3, 15)) : null,
                'approval_remarks' => $appStatus === 'revised' ? 'Please review the required certifications and adjust salary bracket.' : null,
                'created_by'       => $hrAdmin?->id ?? 1,
                'is_active'        => true,
            ]);

            // Create corresponding published job posting if approved
            if ($appStatus === 'approved') {
                JobPosting::create([
                    'job_library_id'       => $lib->id,
                    'department_id'        => $dept?->id ?? 1,
                    'requested_by'         => $hrAdmin?->id ?? 1,
                    'vacancies_count'      => $job['vacancies'],
                    'posting_date'         => now()->subDays(rand(1, 10))->toDateString(),
                    'closing_date'         => now()->addDays(rand(14, 45))->toDateString(),
                    'status'               => 'published',
                    'approval_status'      => 'approved',
                    'approved_by'          => $coo?->id,
                    'approved_at'          => now()->subDays(rand(1, 5)),
                    'is_published'         => true,
                    'location'             => $job['location'],
                    'description'          => $job['job_description'],
                    'qualifications'       => $lib->qualifications,
                    'responsibilities'     => $lib->responsibilities,
                    'is_modified_from_prf' => false,
                ]);
            }

            $summary[] = [
                'JL-' . str_pad($lib->id, 3, '0', STR_PAD_LEFT),
                $job['job_title'],
                $dept?->department_name ?? 'General',
                ucfirst($appStatus),
                $job['vacancies'],
            ];
        }

        // Flush application cache to ensure fresh data
        Cache::flush();

        $this->command->info('Job Library and Job Postings re-seeded successfully.');
        $this->command->table(
            ['Template ID', 'Job Title', 'Department', 'Status', 'Vacancies'],
            $summary
        );
    }
}
