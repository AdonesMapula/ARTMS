<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\JobLibrary;
use App\Models\JobPosting;
use App\Models\User;
use Illuminate\Database\Seeder;

class JobPostingSeeder extends Seeder
{
    public function run(): void
    {
        $hrAdmin = User::where('email', 'hradmin@artms.com')->first();
        $coo     = User::where('email', 'coo@artms.com')->first();

        $hrDept  = Department::where('department_name', 'Human Resources')->first();
        $itDept  = Department::where('department_name', 'Information Technology')->first();
        $finDept = Department::where('department_name', 'Finance')->first();
        $opsDept = Department::where('department_name', 'Operations')->first();
        $mktDept = Department::where('department_name', 'Marketing')->first();
        $admDept = Department::where('department_name', 'Administration')->first();

        $jobs = [
            // ── IT ────────────────────────────────────────────────────────────
            [
                'department'      => $itDept,
                'job_title'       => 'Software Engineer',
                'job_description' => 'Design, develop, test, and maintain web applications and internal systems. Collaborate with cross-functional teams to deliver scalable software solutions.',
                'qualifications'  => "Bachelor's Degree in Computer Science, Information Technology, or related field. At least 2 years of experience in software development. Proficient in PHP, JavaScript, or Python. Experience with REST APIs and relational databases.",
                'responsibilities'=> "Write clean, maintainable code following best practices. Participate in code reviews and technical discussions. Debug and resolve software defects. Contribute to system architecture and design decisions.",
                'job_category'    => 'Technology',
                'employment_type' => 'full_time',
                'salary_min'      => 35000,
                'salary_max'      => 55000,
                'vacancies'       => 2,
                'location'        => 'Cebu City, Philippines',
            ],
            [
                'department'      => $itDept,
                'job_title'       => 'IT Support Technician',
                'job_description' => 'Provide technical support and troubleshooting for hardware, software, and network issues across the organization.',
                'qualifications'  => "Bachelor's Degree in Information Technology or related field. At least 1 year of experience in IT support or helpdesk. Knowledge of Windows OS, networking fundamentals, and basic hardware repair.",
                'responsibilities'=> "Respond to and resolve IT helpdesk tickets. Set up and configure workstations, printers, and peripherals. Maintain IT inventory and documentation. Assist in network maintenance and monitoring.",
                'job_category'    => 'Technology',
                'employment_type' => 'full_time',
                'salary_min'      => 20000,
                'salary_max'      => 30000,
                'vacancies'       => 1,
                'location'        => 'Cebu City, Philippines',
            ],

            // ── HR ────────────────────────────────────────────────────────────
            [
                'department'      => $hrDept,
                'job_title'       => 'HR Assistant',
                'job_description' => 'Support the Human Resources department in day-to-day HR operations including recruitment, onboarding, records management, and employee engagement activities.',
                'qualifications'  => "Bachelor's Degree in Human Resources, Psychology, or any related field. Fresh graduates are welcome to apply. Strong organizational and communication skills. Proficiency in MS Office applications.",
                'responsibilities'=> "Assist in end-to-end recruitment process including posting, screening, and scheduling. Maintain accurate employee records and 201 files. Coordinate onboarding activities for new hires. Support HR events and employee engagement initiatives.",
                'job_category'    => 'Human Resources',
                'employment_type' => 'full_time',
                'salary_min'      => 18000,
                'salary_max'      => 25000,
                'vacancies'       => 1,
                'location'        => 'Cebu City, Philippines',
            ],
            [
                'department'      => $hrDept,
                'job_title'       => 'Training and Development Specialist',
                'job_description' => 'Design, implement, and evaluate training programs to build employee skills and support organizational growth.',
                'qualifications'  => "Bachelor's Degree in Human Resources, Education, Psychology, or related field. At least 2 years of experience in training and development. Excellent presentation and facilitation skills.",
                'responsibilities'=> "Conduct training needs analysis across departments. Design and deliver training modules and workshops. Evaluate training effectiveness through assessments. Maintain training records and reports.",
                'job_category'    => 'Human Resources',
                'employment_type' => 'full_time',
                'salary_min'      => 28000,
                'salary_max'      => 40000,
                'vacancies'       => 1,
                'location'        => 'Cebu City, Philippines',
            ],

            // ── Finance ───────────────────────────────────────────────────────
            [
                'department'      => $finDept,
                'job_title'       => 'Financial Analyst',
                'job_description' => 'Analyze financial data, prepare reports, and provide insights to support strategic decision-making across the organization.',
                'qualifications'  => "Bachelor's Degree in Accountancy, Finance, or related field. CPA license is an advantage. At least 2 years of relevant experience in financial analysis or accounting. Advanced proficiency in MS Excel.",
                'responsibilities'=> "Prepare monthly, quarterly, and annual financial reports. Analyze variances and budget performance. Support year-end audit activities. Develop financial models and forecasts.",
                'job_category'    => 'Finance',
                'employment_type' => 'full_time',
                'salary_min'      => 30000,
                'salary_max'      => 45000,
                'vacancies'       => 1,
                'location'        => 'Cebu City, Philippines',
            ],

            // ── Operations ────────────────────────────────────────────────────
            [
                'department'      => $opsDept,
                'job_title'       => 'Operations Supervisor',
                'job_description' => 'Oversee daily operational activities, manage a team of frontline staff, and ensure service delivery standards are consistently met.',
                'qualifications'  => "Bachelor's Degree in Business Administration, Management, or related field. At least 3 years of supervisory experience. Strong leadership, problem-solving, and people management skills.",
                'responsibilities'=> "Lead and supervise a team of operations staff. Monitor key performance indicators and service metrics. Implement process improvements to enhance efficiency. Coordinate with other departments for smooth operations.",
                'job_category'    => 'Operations',
                'employment_type' => 'full_time',
                'salary_min'      => 35000,
                'salary_max'      => 50000,
                'vacancies'       => 1,
                'location'        => 'Cebu City, Philippines',
            ],
            [
                'department'      => $opsDept,
                'job_title'       => 'Administrative Assistant',
                'job_description' => 'Provide administrative and clerical support to the Operations team to ensure smooth and efficient day-to-day activities.',
                'qualifications'  => "Bachelor's Degree in Business Administration or any related course. Fresh graduates are welcome. Proficient in MS Office. Strong attention to detail and organizational skills.",
                'responsibilities'=> "Manage schedules, correspondence, and filing systems. Coordinate meetings and prepare meeting materials. Handle incoming calls and emails. Assist in procurement and supply management.",
                'job_category'    => 'Administration',
                'employment_type' => 'full_time',
                'salary_min'      => 16000,
                'salary_max'      => 22000,
                'vacancies'       => 2,
                'location'        => 'Cebu City, Philippines',
            ],

            // ── Marketing ─────────────────────────────────────────────────────
            [
                'department'      => $mktDept,
                'job_title'       => 'Digital Marketing Specialist',
                'job_description' => 'Plan and execute digital marketing campaigns across social media, email, SEO, and paid advertising channels to grow brand awareness and generate leads.',
                'qualifications'  => "Bachelor's Degree in Marketing, Communications, or related field. At least 2 years of experience in digital marketing. Proficient in social media platforms, Google Ads, and analytics tools. Experience with Canva or Adobe Creative Suite is a plus.",
                'responsibilities'=> "Manage social media accounts and content calendar. Create and optimize paid ad campaigns. Monitor and report on campaign performance. Coordinate with the design team for marketing materials.",
                'job_category'    => 'Marketing',
                'employment_type' => 'full_time',
                'salary_min'      => 25000,
                'salary_max'      => 38000,
                'vacancies'       => 2,
                'location'        => 'Cebu City, Philippines',
            ],

            // ── OJT ───────────────────────────────────────────────────────────
            [
                'department'      => $admDept,
                'job_title'       => 'OJT Intern — Business Administration',
                'job_description' => 'Gain hands-on experience in business administration, documentation, and office operations while supporting the Administrative team.',
                'qualifications'  => 'Currently enrolled in a Bachelor\'s Degree in Business Administration or related course. Must be endorsed by the school for OJT/internship. Willing to work on-site.',
                'responsibilities'=> "Assist in filing, encoding, and document preparation. Support daily administrative tasks. Attend team meetings and take minutes. Complete assigned tasks from supervisors.",
                'job_category'    => 'Internship',
                'employment_type' => 'ojt',
                'salary_min'      => null,
                'salary_max'      => null,
                'vacancies'       => 3,
                'location'        => 'Cebu City, Philippines',
            ],
        ];

        $summary = [];

        foreach ($jobs as $job) {
            $dept = $job['department'];

            // Create job library entry (approved)
            $lib = JobLibrary::create([
                'job_title'        => $job['job_title'],
                'job_description'  => $job['job_description'],
                'qualifications'   => $job['qualifications'],
                'responsibilities' => $job['responsibilities'],
                'job_category'     => $job['job_category'],
                'employment_type'  => $job['employment_type'],
                'salary_min'       => $job['salary_min'],
                'salary_max'       => $job['salary_max'],
                'approval_status'  => 'approved',
                'approved_by'      => $coo?->id,
                'approved_at'      => now()->subDays(rand(5, 20)),
                'created_by'       => $hrAdmin->id,
                'is_active'        => true,
            ]);

            // Create published job posting
            JobPosting::create([
                'job_library_id'   => $lib->id,
                'department_id'    => $dept?->id,
                'requested_by'     => $hrAdmin->id,
                'vacancies_count'  => $job['vacancies'],
                'posting_date'     => now()->subDays(rand(1, 10))->toDateString(),
                'closing_date'     => now()->addDays(rand(14, 45))->toDateString(),
                'status'           => 'published',
                'approval_status'  => 'approved',
                'approved_by'      => $coo?->id,
                'approved_at'      => now()->subDays(rand(1, 5)),
                'is_published'     => true,
                'location'         => $job['location'],
                'description'      => $job['job_description'],
            ]);

            $summary[] = [
                $job['job_title'],
                $dept?->department_name ?? 'N/A',
                $job['employment_type'],
                $job['vacancies'],
            ];
        }

        $this->command->info('Job postings seeded successfully.');
        $this->command->table(
            ['Position', 'Department', 'Type', 'Vacancies'],
            $summary
        );
    }
}
