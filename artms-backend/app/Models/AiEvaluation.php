<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AiEvaluation extends Model
{
    use HasFactory;

    protected $fillable = [
        'applicant_id',
        'ai_score',
        'confidence_level',
        'fit_label',
        'qualification_match',
        'skills_matched',
        'skills_missing',
        'score_breakdown',
        'ai_summary',
        'ai_feedback',
        'hr_interpretation',
        'hr_decision',
        'reviewed_by',
        'reviewed_at',
    ];

    protected $casts = [
        'skills_matched'   => 'array',
        'skills_missing'   => 'array',
        'score_breakdown'  => 'array',
        'reviewed_at'      => 'datetime',
        'ai_score'         => 'decimal:2',
        'confidence_level' => 'decimal:2',
        'qualification_match' => 'decimal:2',
    ];

    public function applicant()
    {
        return $this->belongsTo(Applicant::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
