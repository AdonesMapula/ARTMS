<?php

namespace App\Mail;

use App\Models\Applicant;
use App\Models\Interview;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class InterviewInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $applicant;
    public $interview;
    public $stageLabel;

    /**
     * Create a new message instance.
     */
    public function __construct(Applicant $applicant, Interview $interview, string $stageLabel = 'Interview')
    {
        $this->applicant = $applicant;
        $this->interview = $interview;
        $this->stageLabel = $stageLabel;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        $fromAddress = config('mail.from.address', 'artms.emailer@gmail.com');
        $fromName = config('mail.from.name', config('app.name', 'ARTMS'));

        return $this->from($fromAddress, $fromName)
                    ->subject("{$this->stageLabel} Invitation — ARTMS")
                    ->view('emails.interview_invitation', [
                        'applicant' => $this->applicant,
                        'interview' => $this->interview,
                        'stageLabel' => $this->stageLabel,
                    ]);
    }
}
