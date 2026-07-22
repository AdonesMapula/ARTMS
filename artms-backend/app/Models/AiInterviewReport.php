<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AiInterviewReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'interview_id',
        'overall_score',
        'communication_score',
        'confidence_score',
        'strengths',
        'weaknesses',
        'hiring_recommendation',
        'raw_ai_response',
        'model_used',
        'generated_by',
        'generated_at',
    ];

    protected $casts = [
        'strengths'       => 'array',
        'weaknesses'      => 'array',
        'raw_ai_response' => 'array',
        'generated_at'    => 'datetime',
        'overall_score'   => 'integer',
        'communication_score' => 'integer',
        'confidence_score'    => 'integer',
    ];

    // ── Relationships ─────────────────────────────────────────────────────

    public function interview(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Interview::class);
    }

    public function generatedBy(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }
}
