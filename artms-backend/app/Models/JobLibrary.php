<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class JobLibrary extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'job_library';

    protected $fillable = [
        'job_title',
        'job_description',
        'qualifications',
        'responsibilities',
        'job_category',
        'employment_type',
        'salary_min',
        'salary_max',
        'approval_status',
        'approved_by',
        'approved_at',
        'approval_remarks',
        'created_by',
        'is_active',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'is_active'   => 'boolean',
        'salary_min'  => 'decimal:2',
        'salary_max'  => 'decimal:2',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function jobPostings()
    {
        return $this->hasMany(JobPosting::class);
    }

    public function isApproved(): bool
    {
        return $this->approval_status === 'approved';
    }
}
