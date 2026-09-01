<?php

namespace Database\Seeders;

use App\Models\AiEvaluation;
use App\Models\Applicant;
use App\Models\JobPosting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ApplicantSeeder extends Seeder
{
    public function run(): void
    {
        // Truncate applicants and ai_evaluations cleanly
        Schema::disableForeignKeyConstraints();
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('TRUNCATE TABLE ai_evaluations, applicants RESTART IDENTITY CASCADE;');
        } else {
            AiEvaluation::truncate();
            Applicant::truncate();
        }
        Schema::enableForeignKeyConstraints();

        $postings = JobPosting::with('jobLibrary', 'department')->where('status', 'published')->get();

        if ($postings->isEmpty()) {
            $postings = JobPosting::with('jobLibrary', 'department')->get();
        }

        if ($postings->isEmpty()) {
            if (isset($this->command)) {
                $this->command->warn('No job postings found. Run JobPostingSeeder first.');
            }
            return;
        }

        // Map postings by title keywords for accurate role assignment
        $findPosting = function (string $keyword) use ($postings) {
            foreach ($postings as $p) {
                $title = strtolower($p->jobLibrary?->job_title ?? $p->title ?? '');
                if (str_contains($title, strtolower($keyword))) {
                    return $p;
                }
            }
            return $postings->first();
        };

        $softwareEngPosting   = $findPosting('Software Engineer');
        $itSupportPosting     = $findPosting('IT Support');
        $hrOfficerPosting     = $findPosting('HR') ?? $findPosting('Human');
        $accountantPosting    = $findPosting('Account') ?? $findPosting('Finance');
        $marketingPosting     = $findPosting('Marketing');
        $graphicDesignPosting = $findPosting('Design') ?? $findPosting('Graphic') ?? $postings->skip(1)->first() ?? $postings->first();
        $adminAssistantPosting= $findPosting('Admin') ?? $findPosting('Assistant') ?? $postings->last();

        // 10 Detailed Real-World Candidates with complete fields & AI rankings
        $candidates = [
            [
                'posting'         => $softwareEngPosting,
                'first_name'      => 'Juan',
                'middle_name'     => 'Carlos',
                'last_name'       => 'Dela Cruz',
                'email'           => 'juan.delacruz@gmail.com',
                'phone'           => '+63 917 812 3456',
                'date_of_birth'   => '1996-05-14',
                'gender'          => 'Male',
                'civil_status'    => 'Single',
                'nationality'     => 'Filipino',
                'address'         => 'Cebu Business Park, Cebu City, Philippines',
                'status'          => 'ready_for_interview',
                'is_shortlisted'  => true,
                'ai_score'        => 96.50,
                'confidence_level'=> 98.00,
                'fit_label'       => 'high',
                'qualification_match' => 97.00,
                'skills_matched'  => ['PHP', 'Laravel', 'React.js', 'MySQL', 'RESTful APIs', 'Git', 'Docker'],
                'skills_missing'  => ['Kubernetes'],
                'score_breakdown' => ['skills' => 98, 'experience' => 96, 'education' => 95, 'technical_fit' => 97],
                'ai_summary'      => 'Outstanding full-stack candidate with 5+ years building scalable Laravel & React architectures. Excellent code quality and system design experience.',
                'ai_feedback'     => 'Exceptional alignment with Senior/Mid Software Engineer requisitions.',
            ],
            [
                'posting'         => $softwareEngPosting,
                'first_name'      => 'Samantha',
                'middle_name'     => 'Rose',
                'last_name'       => 'Tan',
                'email'           => 'samantha.tan@outlook.com',
                'phone'           => '+63 918 554 9012',
                'date_of_birth'   => '1998-09-22',
                'gender'          => 'Female',
                'civil_status'    => 'Single',
                'nationality'     => 'Filipino',
                'address'         => 'IT Park, Lahug, Cebu City, Philippines',
                'status'          => 'interview_1',
                'is_shortlisted'  => true,
                'ai_score'        => 93.00,
                'confidence_level'=> 95.00,
                'fit_label'       => 'high',
                'qualification_match' => 94.00,
                'skills_matched'  => ['JavaScript', 'TypeScript', 'React', 'Node.js', 'TailwindCSS', 'PostgreSQL'],
                'skills_missing'  => ['PHP'],
                'score_breakdown' => ['skills' => 94, 'experience' => 92, 'education' => 93, 'technical_fit' => 93],
                'ai_summary'      => 'Highly capable frontend and full-stack engineer. Proficient in modern JavaScript frameworks and responsive component architectures.',
                'ai_feedback'     => 'Strong candidate for modern web applications and UI engineering.',
            ],
            [
                'posting'         => $hrOfficerPosting,
                'first_name'      => 'Maria',
                'middle_name'     => 'Elena',
                'last_name'       => 'Santos',
                'email'           => 'maria.santos@yahoo.com',
                'phone'           => '+63 920 334 5678',
                'date_of_birth'   => '1995-11-03',
                'gender'          => 'Female',
                'civil_status'    => 'Married',
                'nationality'     => 'Filipino',
                'address'         => 'Banilad, Mandaue City, Cebu, Philippines',
                'status'          => 'screening_passed',
                'is_shortlisted'  => true,
                'ai_score'        => 91.50,
                'confidence_level'=> 94.00,
                'fit_label'       => 'high',
                'qualification_match' => 92.00,
                'skills_matched'  => ['Talent Acquisition', 'Onboarding', 'Labor Relations', 'DOLE Compliance', 'HRIS Management'],
                'skills_missing'  => ['Workday'],
                'score_breakdown' => ['skills' => 92, 'experience' => 93, 'education' => 90, 'technical_fit' => 91],
                'ai_summary'      => 'Experienced HR practitioner with 6 years in corporate recruitment, employee relations, and compliance management.',
                'ai_feedback'     => 'Top recommendation for HR Officer / Recruitment Specialist role.',
            ],
            [
                'posting'         => $accountantPosting,
                'first_name'      => 'Carlo',
                'middle_name'     => 'Gabriel',
                'last_name'       => 'Reyes',
                'email'           => 'carlo.reyes@gmail.com',
                'phone'           => '+63 915 221 4455',
                'date_of_birth'   => '1994-03-18',
                'gender'          => 'Male',
                'civil_status'    => 'Single',
                'nationality'     => 'Filipino',
                'address'         => 'Poblacion, Lapu-Lapu City, Cebu, Philippines',
                'status'          => 'interview_2',
                'is_shortlisted'  => true,
                'ai_score'        => 89.00,
                'confidence_level'=> 92.00,
                'fit_label'       => 'high',
                'qualification_match' => 90.00,
                'skills_matched'  => ['Financial Reporting', 'General Ledger', 'Tax Compliance (BIR)', 'QuickBooks', 'SAP ERP'],
                'skills_missing'  => ['Oracle Financials'],
                'score_breakdown' => ['skills' => 90, 'experience' => 89, 'education' => 88, 'technical_fit' => 89],
                'ai_summary'      => 'Certified Public Accountant (CPA) with 5 years in corporate accounting, audits, and financial forecasting.',
                'ai_feedback'     => 'Exceeds core financial reporting and accounting requirements.',
            ],
            [
                'posting'         => $marketingPosting,
                'first_name'      => 'Ana',
                'middle_name'     => 'Patricia',
                'last_name'       => 'Lim',
                'email'           => 'ana.lim@gmail.com',
                'phone'           => '+63 922 887 1234',
                'date_of_birth'   => '1997-07-29',
                'gender'          => 'Female',
                'civil_status'    => 'Single',
                'nationality'     => 'Filipino',
                'address'         => 'Tabunok, Talisay City, Cebu, Philippines',
                'status'          => 'screening_passed',
                'is_shortlisted'  => true,
                'ai_score'        => 86.50,
                'confidence_level'=> 90.00,
                'fit_label'       => 'high',
                'qualification_match' => 88.00,
                'skills_matched'  => ['Digital Marketing', 'SEO / SEM', 'Google Analytics', 'Social Media Ads', 'Content Strategy'],
                'skills_missing'  => ['HubSpot Automation'],
                'score_breakdown' => ['skills' => 88, 'experience' => 86, 'education' => 86, 'technical_fit' => 86],
                'ai_summary'      => 'Creative marketing specialist with proven ROI across Google and Meta advertising campaigns.',
                'ai_feedback'     => 'Strong fit for growth marketing and digital brand presence.',
            ],
            [
                'posting'         => $itSupportPosting,
                'first_name'      => 'Miguel',
                'middle_name'     => 'Antonio',
                'last_name'       => 'Flores',
                'email'           => 'miguel.flores@yahoo.com',
                'phone'           => '+63 916 443 2198',
                'date_of_birth'   => '1999-12-11',
                'gender'          => 'Male',
                'civil_status'    => 'Single',
                'nationality'     => 'Filipino',
                'address'         => 'Linao, Minglanilla, Cebu, Philippines',
                'status'          => 'ai_screening',
                'is_shortlisted'  => false,
                'ai_score'        => 83.00,
                'confidence_level'=> 88.00,
                'fit_label'       => 'high',
                'qualification_match' => 84.00,
                'skills_matched'  => ['Hardware Troubleshooting', 'Windows Server', 'LAN/WAN Networking', 'Office 365 Admin'],
                'skills_missing'  => ['Cisco CCNA'],
                'score_breakdown' => ['skills' => 84, 'experience' => 82, 'education' => 83, 'technical_fit' => 83],
                'ai_summary'      => 'Solid IT technician with strong diagnostic skills and customer service orientation.',
                'ai_feedback'     => 'Well-suited for internal helpdesk and hardware maintenance.',
            ],
            [
                'posting'         => $graphicDesignPosting,
                'first_name'      => 'Katrina',
                'middle_name'     => 'Mae',
                'last_name'       => 'Villanueva',
                'email'           => 'katrina.villanueva@gmail.com',
                'phone'           => '+63 927 990 4321',
                'date_of_birth'   => '1998-04-15',
                'gender'          => 'Female',
                'civil_status'    => 'Single',
                'nationality'     => 'Filipino',
                'address'         => 'Guadalupe, Cebu City, Philippines',
                'status'          => 'applied',
                'is_shortlisted'  => false,
                'ai_score'        => 79.50,
                'confidence_level'=> 85.00,
                'fit_label'       => 'medium',
                'qualification_match' => 80.00,
                'skills_matched'  => ['Adobe Photoshop', 'Adobe Illustrator', 'Figma', 'Brand Identity', 'Typography'],
                'skills_missing'  => ['Motion Graphics', 'After Effects'],
                'score_breakdown' => ['skills' => 81, 'experience' => 78, 'education' => 80, 'technical_fit' => 79],
                'ai_summary'      => 'Talented visual designer with an impressive vector and branding portfolio.',
                'ai_feedback'     => 'Good design fundamentals; would benefit from basic motion design skills.',
            ],
            [
                'posting'         => $adminAssistantPosting,
                'first_name'      => 'Joshua',
                'middle_name'     => 'David',
                'last_name'       => 'Navarro',
                'email'           => 'joshua.navarro@gmail.com',
                'phone'           => '+63 919 123 7890',
                'date_of_birth'   => '2000-01-20',
                'gender'          => 'Male',
                'civil_status'    => 'Single',
                'nationality'     => 'Filipino',
                'address'         => 'Basak, San Nicolas, Cebu City, Philippines',
                'status'          => 'applied',
                'is_shortlisted'  => false,
                'ai_score'        => 74.00,
                'confidence_level'=> 82.00,
                'fit_label'       => 'medium',
                'qualification_match' => 75.00,
                'skills_matched'  => ['Microsoft Excel', 'Data Entry', 'Calendar Management', 'Document Archiving'],
                'skills_missing'  => ['Executive Briefing Preparation'],
                'score_breakdown' => ['skills' => 76, 'experience' => 72, 'education' => 75, 'technical_fit' => 73],
                'ai_summary'      => 'Organized administrative professional with good clerical speed and attention to detail.',
                'ai_feedback'     => 'Meets standard administrative requirements for entry-to-mid operations.',
            ],
            [
                'posting'         => $itSupportPosting,
                'first_name'      => 'Mark',
                'middle_name'     => 'Vincent',
                'last_name'       => 'Bautista',
                'email'           => 'mark.bautista@gmail.com',
                'phone'           => '+63 933 654 3210',
                'date_of_birth'   => '2001-08-10',
                'gender'          => 'Male',
                'civil_status'    => 'Single',
                'nationality'     => 'Filipino',
                'address'         => 'Mambaling, Cebu City, Philippines',
                'status'          => 'applied',
                'is_shortlisted'  => false,
                'ai_score'        => 68.50,
                'confidence_level'=> 80.00,
                'fit_label'       => 'medium',
                'qualification_match' => 70.00,
                'skills_matched'  => ['PC Assembly', 'Windows Installation', 'Printer Setup'],
                'skills_missing'  => ['Active Directory', 'Network Routing'],
                'score_breakdown' => ['skills' => 69, 'experience' => 67, 'education' => 70, 'technical_fit' => 68],
                'ai_summary'      => 'Junior technician with foundational hardware setup skills, seeking entry-level IT support.',
                'ai_feedback'     => 'Potential for growth; requires on-the-job network mentoring.',
            ],
            [
                'posting'         => $softwareEngPosting,
                'first_name'      => 'Bea',
                'middle_name'     => 'Nicole',
                'last_name'       => 'Gonzales',
                'email'           => 'bea.gonzales@outlook.com',
                'phone'           => '+63 917 778 9900',
                'date_of_birth'   => '2002-02-14',
                'gender'          => 'Female',
                'civil_status'    => 'Single',
                'nationality'     => 'Filipino',
                'address'         => 'Consolacion, Cebu, Philippines',
                'status'          => 'applied',
                'is_shortlisted'  => false,
                'ai_score'        => 58.00,
                'confidence_level'=> 78.00,
                'fit_label'       => 'low',
                'qualification_match' => 60.00,
                'skills_matched'  => ['HTML5', 'CSS3', 'Basic JavaScript'],
                'skills_missing'  => ['React', 'Backend Frameworks', 'Relational Databases', 'Git Version Control'],
                'score_breakdown' => ['skills' => 56, 'experience' => 55, 'education' => 65, 'technical_fit' => 56],
                'ai_summary'      => 'Recent graduate with entry-level web fundamentals. Lacks backend and framework experience required for this role.',
                'ai_feedback'     => 'Recommend building complete full-stack portfolio projects before senior application.',
            ],
        ];

        $outputRows = [];
        $index = 1;

        foreach ($candidates as $c) {
            $posting = $c['posting'] ?? $postings->first();
            $postingId = $posting->id;
            $appId = 'APP-' . now()->format('Y') . '-' . str_pad($index, 5, '0', STR_PAD_LEFT);

            $applicant = Applicant::create([
                'job_posting_id'       => $postingId,
                'application_id'       => $appId,
                'first_name'           => $c['first_name'],
                'middle_name'          => $c['middle_name'],
                'last_name'            => $c['last_name'],
                'email'                => $c['email'],
                'phone'                => $c['phone'],
                'date_of_birth'        => $c['date_of_birth'],
                'gender'               => $c['gender'],
                'civil_status'         => $c['civil_status'],
                'nationality'          => $c['nationality'],
                'address'              => $c['address'],
                'resume_path'          => 'resumes/' . strtolower($c['first_name'] . '_' . $c['last_name']) . '_resume.pdf',
                'resume_original_name' => $c['first_name'] . '_' . $c['last_name'] . '_Resume.pdf',
                'informed_consent'     => true,
                'status'               => $c['status'],
                'is_shortlisted'       => $c['is_shortlisted'],
                'overall_score'        => $c['ai_score'],
                'ranking'              => $index,
            ]);

            // Create corresponding AI Evaluation record for AI ranking system
            AiEvaluation::create([
                'applicant_id'        => $applicant->id,
                'ai_score'            => $c['ai_score'],
                'confidence_level'    => $c['confidence_level'],
                'fit_label'           => $c['fit_label'],
                'qualification_match' => $c['qualification_match'],
                'skills_matched'      => $c['skills_matched'],
                'skills_missing'      => $c['skills_missing'],
                'score_breakdown'     => $c['score_breakdown'],
                'ai_summary'          => $c['ai_summary'],
                'ai_feedback'         => $c['ai_feedback'],
                'hr_decision'         => $c['ai_score'] >= 80 ? 'qualified' : 'pending',
                'reviewed_at'         => now(),
            ]);

            $posName = $posting->jobLibrary?->job_title ?? $posting->title ?? 'Position #' . $postingId;
            $outputRows[] = [
                $appId,
                $c['first_name'] . ' ' . $c['last_name'],
                $posName,
                $c['ai_score'] . '%',
                strtoupper($c['fit_label']),
                $c['status'],
            ];

            $index++;
        }

        if (isset($this->command)) {
            $this->command->info("✅ Successfully seeded exactly 10 applicants with complete AI evaluations and rankings!");
            $this->command->table(
                ['Application ID', 'Candidate Name', 'Applied Position', 'AI Score', 'Fit Level', 'Status'],
                $outputRows
            );
        }
    }
}
