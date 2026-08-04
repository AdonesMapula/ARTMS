<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SystemNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $title;
    public $messageText;
    public $actionUrl;
    public $category;

    /**
     * Create a new message instance.
     */
    public function __construct(string $title, string $messageText, ?string $actionUrl = null, string $category = 'alert')
    {
        $this->title = $title;
        $this->messageText = $messageText;
        $this->actionUrl = $actionUrl;
        $this->category = $category;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject('ARTMS Notification: ' . $this->title)
                    ->view('emails.system-notification');
    }
}
