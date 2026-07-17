<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class JobPosting extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'job_library_id',
        'department_id',
        'requested_by',
        'manpower_request_id',
        'vacancies_count',
        'posting_date',
        'closing_date',
        'status',
        'approval_status',
        'approved_by',
        'approved_at',
        'approval_remarks',
        'is_published',
        'location',
        'description',
    ];

    protected $casts = [
        'posting_date' => 'date',
        'closing_date' => 'date',
        'approved_at'  => 'datetime',
        'is_published' => 'boolean',
    ];

    public function jobLibrary()
    {
        return $this->belongsTo(JobLibrary::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function manpowerRequest()
    {
        return $this->belongsTo(ManpowerRequest::class);
    }

    public function applicants()
    {
        return $this->hasMany(Applicant::class);
    }

    public function interviews()
    {
        return $this->hasMany(Interview::class);
    }

    public function isPublished(): bool
    {
        return $this->is_published && $this->status === 'published';
    }
}
