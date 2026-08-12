<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InterviewRecording extends Model
{
    use HasFactory;

    protected $fillable = [
        'interview_id',
        'egress_id',
        'participant_identity',
        'participant_role',
        'file_path',
        'file_url',
        'duration_seconds',
        'status',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'duration_seconds' => 'integer',
    ];

    public function interview(): BelongsTo
    {
        return $this->belongsTo(Interview::class);
    }
}
