<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InterviewTranscript extends Model
{
    use HasFactory;

    protected $fillable = [
        'interview_id',
        'speaker_identity',
        'speaker_role',
        'text',
        'segment_offset',
        'spoken_at',
    ];

    protected $casts = [
        'spoken_at'      => 'datetime',
        'segment_offset' => 'integer',
    ];

    // ── Relationships ─────────────────────────────────────────────────────

    public function interview(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Interview::class);
    }
}
