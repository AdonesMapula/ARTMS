<?php

namespace Database\Seeders;

use App\Models\Applicant;
use App\Models\JobPosting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class ApplicantSeeder extends Seeder
{
    public function run(): void
    {
        // Truncate cleanly
        if (\Illuminate\Support\Facades\DB::getDriverName() === 'pgsql') {
            \Illuminate\Support\Facades\DB::statement('TRUNCATE TABLE applicants CASCADE;');
        } else {
            Schema::disableForeignKeyConstraints();
            Applicant::truncate();
            Schema::enableForeignKeyConstraints();
        }

        $postings = JobPosting::with('jobLibrary')->get();

        if ($postings->isEmpty()) {
            $this->command->warn('No job postings found. Run JobPostingSeeder first.');
            return;
        }

        // 5 candidate pools - one per posting slot (cycling through postings)
        $candidates = [
            [
                'first_name'    => 'Juan',
                'last_name'     => 'Dela Cruz',
                'email'         => 'juan.delacruz@example.com',
                'phone'         => '09171000001',
                'address'       => 'Cebu City',
                'status'        => 'new',
                'source'        => 'online_portal',
                'years_exp'     => 3,
                'highest_edu'   => 'bachelor',
                'university'    => 'University of San Carlos',
                'cover_letter'  => 'I am eager to contribute my skills and grow within your organization.',
            ],
            [
                'first_name'    => 'Maria',
                'last_name'     => 'Santos',
                'email'         => 'maria.santos@example.com',
                'phone'         => '09172000002',
                'address'       => 'Mandaue City',
                'status'        => 'screening',
                'source'        => 'referral',
                'years_exp'     => 5,
                'highest_edu'   => 'bachelor',
                'university'    => 'Cebu Institute of Technology',
                'cover_letter'  => 'With 5 years of relevant experience, I am confident I can add immediate value to the team.',
            ],
            [
                'first_name'    => 'Carlo',
                'last_name'     => 'Reyes',
                'email'         => 'carlo.reyes@example.com',
                'phone'         => '09173000003',
                'address'       => 'Lapu-Lapu City',
                'status'        => 'interview_scheduled',
                'source'        => 'linkedin',
                'years_exp'     => 2,
                'highest_edu'   => 'bachelor',
                'university'    => 'Southwestern University',
                'cover_letter'  => 'I am a highly motivated professional looking for new opportunities to advance my career.',
            ],
            [
                'first_name'    => 'Ana',
                'last_name'     => 'Lim',
                'email'         => 'ana.lim@example.com',
                'phone'         => '09174000004',
                'address'       => 'Talisay City',
                'status'        => 'interview_completed',
                'source'        => 'jobstreet',
                'years_exp'     => 4,
                'highest_edu'   => 'master',
                'university'    => 'University of the Philippines',
                'cover_letter'  => 'My advanced degree and diverse background make me a strong candidate for this role.',
            ],
            [
                'first_name'    => 'Miguel',
                'last_name'     => 'Flores',
                'email'         => 'miguel.flores@example.com',
                'phone'         => '09175000005',
                'address'       => 'Minglanilla, Cebu',
                'status'        => 'new',
                'source'        => 'walk_in',
                'years_exp'     => 1,
                'highest_edu'   => 'bachelor',
                'university'    => 'Cebu Normal University',
                'cover_letter'  => 'As a recent graduate with a strong academic record, I am excited to start my professional journey.',
            ],
        ];

        $summary  = [];
        $inserted = 0;

        foreach ($postings as $posting) {
            $jobTitle = $posting->jobLibrary?->job_title ?? 'Unknown Position';

            foreach ($candidates as $idx => $c) {
                // Make email unique per posting
                $emailParts = explode('@', $c['email']);
                $uniqueEmail = $emailParts[0] . '+p' . $posting->id . '_' . ($idx + 1) . '@' . $emailParts[1];

                Applicant::create([
                    'job_posting_id'    => $posting->id,
                    'application_id'    => 'APP-' . now()->format('Y') . '-' . str_pad($inserted + 1, 5, '0', STR_PAD_LEFT),
                    'first_name'        => $c['first_name'],
                    'last_name'         => $c['last_name'],
                    'email'             => $uniqueEmail,
                    'phone'             => $c['phone'],
                    'address'           => $c['address'],
                    'status'            => $c['status'],
                    'is_shortlisted'    => in_array($c['status'], ['interview_scheduled', 'interview_completed']),
                ]);

                $inserted++;
            }

            $summary[] = [$jobTitle, $posting->id, 5];
        }

        $this->command->info("✅ Applicants seeded successfully! Total: {$inserted}");
        $this->command->table(
            ['Job Position', 'Posting ID', 'Applicants Added'],
            $summary
        );
    }
}
