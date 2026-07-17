<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ManpowerRequest extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'department_id',
        'requested_by',
        'job_library_id',
        'position_needed',
        'headcount',
        'justification',
        'needed_by',
        'urgency',
        'status',
        'approved_by',
        'approved_at',
        'approval_remarks',
        'fit_threshold_high',
        'fit_threshold_medium',
    ];

    protected $casts = [
        'needed_by'   => 'date',
        'approved_at' => 'datetime',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function jobLibrary()
    {
        return $this->belongsTo(JobLibrary::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function jobPostings()
    {
        return $this->hasMany(JobPosting::class, 'manpower_request_id');
    }
}
