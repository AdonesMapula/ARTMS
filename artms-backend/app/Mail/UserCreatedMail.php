<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class UserCreatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $temporaryPassword;
    public $setupUrl;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($user, $temporaryPassword, $setupUrl)
    {
        $this->user = $user;
        $this->temporaryPassword = $temporaryPassword;
        $this->setupUrl = $setupUrl;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->subject('Welcome to ARTMS - Account Setup Required')
                    ->view('emails.user-created');
    }
}
