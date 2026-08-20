<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InterviewBehavioralMetric extends Model
{
    use HasFactory;

    protected $fillable = [
        'interview_id',
        'aggregated_metrics',
        'speech_metrics',
        'affect_metrics',
        'is_mocked',
    ];

    protected $casts = [
        'aggregated_metrics' => 'array',
        'speech_metrics'     => 'array',
        'affect_metrics'     => 'array',
        'is_mocked'          => 'boolean',
    ];

    public function interview(): BelongsTo
    {
        return $this->belongsTo(Interview::class);
    }
}
