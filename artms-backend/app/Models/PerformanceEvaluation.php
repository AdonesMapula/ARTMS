<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PerformanceEvaluation extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'evaluated_by',
        'evaluation_period',
        'score',
        'rating',
        'criteria_scores',
        'strengths',
        'areas_for_improvement',
        'remarks',
        'promotion_recommended',
    ];

    protected $casts = [
        'criteria_scores'      => 'array',
        'score'                => 'decimal:2',
        'promotion_recommended' => 'boolean',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function evaluator()
    {
        return $this->belongsTo(User::class, 'evaluated_by');
    }
}
