<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class CandidateNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $title;
    public string $messageText;
    public ?string $publicLink;
    public string $category;

    /**
     * Create a new message instance for external applicants/candidates.
     */
    public function __construct(string $title, string $messageText, ?string $publicLink = null, string $category = 'application')
    {
        $this->title       = $title;
        $this->messageText = $messageText;
        $this->publicLink  = $publicLink;
        $this->category    = $category;
    }

    /**
     * Build the message.
     */
    public function build(): self
    {
        return $this->subject('ARTMS Recruitment: ' . $this->title)
                    ->view('emails.candidate_notification');
    }
}
