<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Interview extends Model
{
    use HasFactory;

    protected $fillable = [
        'applicant_id',
        'job_posting_id',
        'interview_stage',
        'scheduled_at',
        'location',
        'meeting_link',
        'interview_type',
        'status',
        'applicant_confirmed',
        'applicant_confirmed_at',
        'interviewer_id',
        'rating_score',
        'evaluation_notes',
        'rubric_scores',
        'ai_summary',
        'ai_recommendation',
        'hr_decision',
        'invitation_sent',
        'reminder_sent',
    ];

    protected $casts = [
        'scheduled_at'          => 'datetime',
        'applicant_confirmed_at' => 'datetime',
        'rubric_scores'         => 'array',
        'applicant_confirmed'   => 'boolean',
        'invitation_sent'       => 'boolean',
        'reminder_sent'         => 'boolean',
        'rating_score'          => 'decimal:2',
    ];

    public function applicant()
    {
        return $this->belongsTo(Applicant::class);
    }

    public function jobPosting()
    {
        return $this->belongsTo(JobPosting::class);
    }

    public function interviewer()
    {
        return $this->belongsTo(User::class, 'interviewer_id');
    }
}
