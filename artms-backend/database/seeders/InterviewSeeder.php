<?php

namespace Database\Seeders;

use App\Models\Applicant;
use App\Models\Interview;
use App\Models\JobPosting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Mail;

class InterviewSeeder extends Seeder
{
    public function run(): void
    {
        $hrAdmin = User::where('email', 'hradmin@artms.com')->first();

        // Grab applicants that are in ai_screening or screening_passed
        $applicants = Applicant::whereIn('status', [
            'applied', 'ai_screening', 'screening_passed', 'screening_failed',
        ])->with('jobPosting')->get();

        if ($applicants->isEmpty()) {
            $this->command->warn('No applicants found. Seed applicants first.');
            return;
        }

        $records = [];

        // ── Interview 1 — Scheduled (upcoming) ──────────────────────────────
        if ($applicants->count() >= 1) {
            $a = $applicants[0];
            $records[] = Interview::create([
                'applicant_id'    => $a->id,
                'job_posting_id'  => $a->job_posting_id,
                'interview_stage' => 'interview_1',
                'interview_type'  => 'online',
                'scheduled_at'    => now()->addDays(2)->setTime(10, 0),
                'meeting_link'    => 'https://meet.google.com/artms-demo-001',
                'interviewer_id'  => $hrAdmin->id,
                'status'          => 'scheduled',
                'invitation_sent' => false,
                'reminder_sent'   => false,
            ]);

            // Update applicant status
            $a->update(['status' => 'interview_1_scheduled']);
        }

        // ── Interview 1 — Confirmed ──────────────────────────────────────────
        if ($applicants->count() >= 2) {
            $a = $applicants[1];
            $records[] = Interview::create([
                'applicant_id'       => $a->id,
                'job_posting_id'     => $a->job_posting_id,
                'interview_stage'    => 'interview_1',
                'interview_type'     => 'in_person',
                'scheduled_at'       => now()->addDays(3)->setTime(14, 0),
                'location'           => 'HR Office — Room 201, 2nd Floor',
                'interviewer_id'     => $hrAdmin->id,
                'status'             => 'confirmed',
                'applicant_confirmed'=> true,
                'applicant_confirmed_at' => now()->subDay(),
                'invitation_sent'    => true,
                'reminder_sent'      => false,
            ]);

            $a->update(['status' => 'interview_1_scheduled']);
        }

        // ── Interview 1 — Done with evaluation ──────────────────────────────
        if ($applicants->count() >= 3) {
            $a = $applicants[2];
            $records[] = Interview::create([
                'applicant_id'     => $a->id,
                'job_posting_id'   => $a->job_posting_id,
                'interview_stage'  => 'interview_1',
                'interview_type'   => 'online',
                'scheduled_at'     => now()->subDays(5)->setTime(9, 0),
                'meeting_link'     => 'https://meet.google.com/artms-demo-002',
                'interviewer_id'   => $hrAdmin->id,
                'status'           => 'done',
                'applicant_confirmed' => true,
                'invitation_sent'  => true,
                'reminder_sent'    => true,
                'rating_score'     => 82.00,
                'evaluation_notes' => 'Strong communication skills. Good technical background. Recommend for Interview 2.',
                'rubric_scores'    => [
                    ['label' => 'Communication',    'score' => 9, 'max' => 10],
                    ['label' => 'Technical Skills', 'score' => 8, 'max' => 10],
                    ['label' => 'Culture Fit',      'score' => 8, 'max' => 10],
                    ['label' => 'Problem Solving',  'score' => 7, 'max' => 10],
                ],
                'hr_decision'      => 'pass',
                'ai_summary'       => 'Applicant demonstrated excellent communication and a strong grasp of technical requirements. Cultural alignment is evident. Recommended to proceed to the next round.',
                'ai_recommendation' => 'Proceed to Interview 2.',
            ]);

            $a->update(['status' => 'interview_1_done']);
        }

        // ── Interview 2 — Scheduled ──────────────────────────────────────────
        if ($applicants->count() >= 4) {
            $a = $applicants[3];
            $records[] = Interview::create([
                'applicant_id'    => $a->id,
                'job_posting_id'  => $a->job_posting_id,
                'interview_stage' => 'interview_2',
                'interview_type'  => 'in_person',
                'scheduled_at'    => now()->addDays(7)->setTime(11, 0),
                'location'        => 'Conference Room A, 3rd Floor',
                'interviewer_id'  => $hrAdmin->id,
                'status'          => 'scheduled',
                'invitation_sent' => true,
                'reminder_sent'   => false,
            ]);

            $a->update(['status' => 'interview_2_scheduled']);
        }

        // ── Final Interview — Scheduled ──────────────────────────────────────
        if ($applicants->count() >= 5) {
            $a = $applicants[4];
            $records[] = Interview::create([
                'applicant_id'    => $a->id,
                'job_posting_id'  => $a->job_posting_id,
                'interview_stage' => 'final',
                'interview_type'  => 'online',
                'scheduled_at'    => now()->addDays(10)->setTime(15, 0),
                'meeting_link'    => 'https://meet.google.com/artms-demo-final',
                'interviewer_id'  => $hrAdmin->id,
                'status'          => 'scheduled',
                'invitation_sent' => true,
                'reminder_sent'   => false,
            ]);

            $a->update(['status' => 'interview_2_scheduled']);
        }

        // ── Interview 1 — No Show ────────────────────────────────────────────
        if ($applicants->count() >= 6) {
            $a = $applicants[5] ?? $applicants->first();
            // Create a fresh interview record for a no-show
            Interview::create([
                'applicant_id'    => $a->id,
                'job_posting_id'  => $a->job_posting_id,
                'interview_stage' => 'interview_1',
                'interview_type'  => 'phone',
                'scheduled_at'    => now()->subDays(2)->setTime(9, 0),
                'interviewer_id'  => $hrAdmin->id,
                'status'          => 'no_show',
                'invitation_sent' => true,
                'reminder_sent'   => true,
                'hr_decision'     => 'fail',
            ]);
        }

        // ── Summary ──────────────────────────────────────────────────────────
        $this->command->info('Interview records seeded successfully.');
        $this->command->table(
            ['Stage', 'Type', 'Status', 'Applicant', 'Date'],
            collect($records)->map(fn($i) => [
                $i->interview_stage,
                $i->interview_type,
                $i->status,
                optional($i->applicant)->first_name . ' ' . optional($i->applicant)->last_name,
                $i->scheduled_at->format('M d, Y H:i'),
            ])->toArray()
        );

        // ── Test email (send invitation for the scheduled interview) ─────────
        $this->command->info("\nSending test invitation email for interview ID: {$records[0]->id}");
        $testInterview = $records[0]->load('applicant');

        try {
            Mail::send('emails.interview_invitation', [
                'applicant' => $testInterview->applicant,
                'interview' => $testInterview,
            ], function ($mail) use ($testInterview) {
                $mail->to($testInterview->applicant->email)
                     ->subject('Interview Invitation — ARTMS');
            });
            $testInterview->update(['invitation_sent' => true]);
            $this->command->info('✅ Invitation email sent to: ' . $testInterview->applicant->email);
        } catch (\Exception $e) {
            $this->command->warn('⚠️  Email failed: ' . $e->getMessage());
        }
    }
}
