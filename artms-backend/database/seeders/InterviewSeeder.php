<?php

namespace Database\Seeders;

use App\Models\Applicant;
use App\Models\Interview;
use App\Models\User;
use Illuminate\Database\Seeder;

class InterviewSeeder extends Seeder
{
    public function run(): void
    {
        $hrAdmin = User::where('email', 'hradmin@artms.com')->first();

        // Grab applicants that are in applicable statuses
        $applicants = Applicant::whereIn('status', [
            'new', 'screening', 'interview_scheduled', 'interview_completed',
        ])->with('jobPosting')->get();

        // If none found, grab any applicants
        if ($applicants->isEmpty()) {
            $applicants = Applicant::with('jobPosting')->limit(10)->get();
        }

        if ($applicants->isEmpty()) {
            $this->command->warn('No applicants found. Seed applicants first via JobPostingSeeder.');
            return;
        }

        $records = [];

        // ── Interview 1 — Initial Screening (Scheduled, upcoming) ────────────
        if ($applicants->count() >= 1) {
            $a = $applicants[0];
            $records[] = Interview::create([
                'applicant_id'       => $a->id,
                'job_posting_id'     => $a->job_posting_id,
                'interview_stage'    => 'initial_screening',
                'interview_type'     => 'online',
                'scheduled_at'       => now()->addDays(2)->setTime(10, 0),
                'meeting_link'       => 'https://meet.google.com/artms-init-001',
                'location'           => null,
                'interviewer_id'     => $hrAdmin->id,
                'status'             => 'scheduled',
                'notes'              => 'Initial HR screening round. Verify candidate background and basic qualifications.',
                'contact_email'      => $a->email,
                'contact_number'     => $a->phone,
                'invitation_sent'    => false,
                'reminder_sent'      => false,
                'hr_decision'        => 'pending',
            ]);
            $a->update(['status' => 'interview_scheduled']);
        }

        // ── Interview 2 — Initial Screening (Confirmed) ──────────────────────
        if ($applicants->count() >= 2) {
            $a = $applicants[1];
            $records[] = Interview::create([
                'applicant_id'          => $a->id,
                'job_posting_id'        => $a->job_posting_id,
                'interview_stage'       => 'initial_screening',
                'interview_type'        => 'in_person',
                'scheduled_at'          => now()->addDays(3)->setTime(14, 0),
                'meeting_link'          => null,
                'location'              => 'HR Office — Room 201, 2nd Floor',
                'interviewer_id'        => $hrAdmin->id,
                'status'                => 'confirmed',
                'applicant_confirmed'   => true,
                'applicant_confirmed_at'=> now()->subDay(),
                'notes'                 => 'In-person initial screening. Bring government-issued ID.',
                'contact_email'         => $a->email,
                'contact_number'        => $a->phone,
                'invitation_sent'       => true,
                'reminder_sent'         => false,
                'hr_decision'           => 'pending',
            ]);
            $a->update(['status' => 'interview_scheduled']);
        }

        // ── Interview 3 — Technical Interview (Completed with evaluation) ────
        if ($applicants->count() >= 3) {
            $a = $applicants[2];
            $records[] = Interview::create([
                'applicant_id'          => $a->id,
                'job_posting_id'        => $a->job_posting_id,
                'interview_stage'       => 'technical_interview',
                'interview_type'        => 'online',
                'scheduled_at'          => now()->subDays(5)->setTime(9, 0),
                'meeting_link'          => 'https://meet.google.com/artms-tech-002',
                'location'              => null,
                'interviewer_id'        => $hrAdmin->id,
                'status'                => 'done',
                'applicant_confirmed'   => true,
                'applicant_confirmed_at'=> now()->subDays(6),
                'notes'                 => 'Technical round covering backend development skills and system design.',
                'contact_email'         => $a->email,
                'contact_number'        => $a->phone,
                'invitation_sent'       => true,
                'reminder_sent'         => true,
                'rating_score'          => 82.00,
                'evaluation_notes'      => 'Strong communication skills. Good technical background. Recommend for HR Interview.',
                'rubric_scores'         => json_encode([
                    ['label' => 'Communication',    'score' => 9, 'max' => 10],
                    ['label' => 'Technical Skills', 'score' => 8, 'max' => 10],
                    ['label' => 'Culture Fit',      'score' => 8, 'max' => 10],
                    ['label' => 'Problem Solving',  'score' => 7, 'max' => 10],
                ]),
                'hr_decision'           => 'pass',
                'ai_summary'            => 'Candidate demonstrated excellent communication. Recommended to proceed.',
                'ai_recommendation'     => 'Proceed to HR Interview.',
            ]);
            $a->update(['status' => 'interview_completed']);
        }

        // ── Interview 4 — HR Interview (Scheduled) ───────────────────────────
        if ($applicants->count() >= 4) {
            $a = $applicants[3];
            $records[] = Interview::create([
                'applicant_id'    => $a->id,
                'job_posting_id'  => $a->job_posting_id,
                'interview_stage' => 'hr_interview',
                'interview_type'  => 'in_person',
                'scheduled_at'    => now()->addDays(7)->setTime(11, 0),
                'meeting_link'    => null,
                'location'        => 'Conference Room A, 3rd Floor',
                'interviewer_id'  => $hrAdmin->id,
                'status'          => 'scheduled',
                'notes'           => 'HR culture and behavioral interview. STAR method questions prepared.',
                'contact_email'   => $a->email,
                'contact_number'  => $a->phone,
                'invitation_sent' => true,
                'reminder_sent'   => false,
                'hr_decision'     => 'pending',
            ]);
            $a->update(['status' => 'interview_scheduled']);
        }

        // ── Interview 5 — Final Interview (Scheduled) ────────────────────────
        if ($applicants->count() >= 5) {
            $a = $applicants[4];
            $records[] = Interview::create([
                'applicant_id'    => $a->id,
                'job_posting_id'  => $a->job_posting_id,
                'interview_stage' => 'final_interview',
                'interview_type'  => 'in_person',
                'scheduled_at'    => now()->addDays(10)->setTime(15, 0),
                'meeting_link'    => 'https://meet.google.com/artms-final-003',
                'location'        => null,
                'interviewer_id'  => $hrAdmin->id,
                'status'          => 'scheduled',
                'notes'           => 'Final executive interview. COO and Department Head will be present.',
                'contact_email'   => $a->email,
                'contact_number'  => $a->phone,
                'invitation_sent' => true,
                'reminder_sent'   => false,
                'hr_decision'     => 'pending',
            ]);
            $a->update(['status' => 'interview_scheduled']);
        }

        // ── Interview 6 — AI Screening (Completed with report) ───────────────
        if ($applicants->count() >= 6) {
            $a = $applicants[5];
            $records[] = Interview::create([
                'applicant_id'          => $a->id,
                'job_posting_id'        => $a->job_posting_id,
                'interview_stage'       => 'initial_screening',
                'interview_type'        => 'online',
                'scheduled_at'          => now()->subDays(3)->setTime(9, 0),
                'meeting_link'          => null,
                'location'              => null,
                'interviewer_id'        => null,
                'status'                => 'done',
                'applicant_confirmed'   => true,
                'applicant_confirmed_at'=> now()->subDays(3),
                'notes'                 => 'AI voice screening interview conducted via ARTMS LiveKit integration.',
                'contact_email'         => $a->email,
                'contact_number'        => $a->phone,
                'invitation_sent'       => true,
                'reminder_sent'         => true,
                'rating_score'          => 75.50,
                'evaluation_notes'      => 'AI screening completed. Candidate showed moderate communication skills.',
                'hr_decision'           => 'pass',
                'ai_summary'            => 'Candidate demonstrated adequate communication. Recommend for human interview.',
                'ai_recommendation'     => 'Proceed to Initial Screening with HR.',
            ]);
            $a->update(['status' => 'screening']);
        }

        // ── Interview 7 — No Show ────────────────────────────────────────────
        if ($applicants->count() >= 7) {
            $a = $applicants[6] ?? $applicants->last();
            $records[] = Interview::create([
                'applicant_id'    => $a->id,
                'job_posting_id'  => $a->job_posting_id,
                'interview_stage' => 'initial_screening',
                'interview_type'  => 'in_person',
                'scheduled_at'    => now()->subDays(2)->setTime(9, 0),
                'meeting_link'    => null,
                'location'        => 'HR Office — Room 101',
                'interviewer_id'  => $hrAdmin->id,
                'status'          => 'no_show',
                'notes'           => 'Candidate did not show up. No prior notice given.',
                'contact_email'   => $a->email,
                'contact_number'  => $a->phone,
                'invitation_sent' => true,
                'reminder_sent'   => true,
                'hr_decision'     => 'fail',
            ]);
        }

        // ── Summary ──────────────────────────────────────────────────────────
        $this->command->info('✅ Interview records seeded successfully.');
        $this->command->table(
            ['Stage', 'Type', 'Status', 'Applicant', 'Date'],
            collect($records)->map(fn($i) => [
                $i->interview_stage,
                $i->interview_type,
                $i->status,
                optional($i->applicant)->first_name ?? 'N/A',
                $i->scheduled_at->format('M d, Y H:i'),
            ])->toArray()
        );
    }
}
