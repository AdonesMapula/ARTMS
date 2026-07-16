<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Applicant extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'application_id',
        'job_posting_id',
        'first_name',
        'last_name',
        'middle_name',
        'email',
        'phone',
        'date_of_birth',
        'address',
        'gender',
        'civil_status',
        'nationality',
        'resume_path',
        'resume_original_name',
        'informed_consent',
        'status',
        'is_shortlisted',
        'overall_score',
        'ranking',
    ];

    protected $casts = [
        'date_of_birth'   => 'date',
        'informed_consent' => 'boolean',
        'is_shortlisted'  => 'boolean',
        'overall_score'   => 'decimal:2',
    ];

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->middle_name} {$this->last_name}");
    }

    public function jobPosting()
    {
        return $this->belongsTo(JobPosting::class);
    }

    public function documents()
    {
        return $this->hasMany(ApplicantDocument::class);
    }

    public function aiEvaluation()
    {
        return $this->hasOne(AiEvaluation::class);
    }

    public function interviews()
    {
        return $this->hasMany(Interview::class);
    }

    public function notes()
    {
        return $this->hasMany(ApplicantNote::class);
    }
}
