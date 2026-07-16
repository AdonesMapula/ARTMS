<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'department_id',
        'position',
        'employment_status',
        'date_hired',
        'salary',
        'employment_type',
        'address',
        'contact_number',
        'emergency_contact_name',
        'emergency_contact_number',
        'date_terminated',
        'termination_reason',
        'clearance_processed',
    ];

    protected $casts = [
        'date_hired'          => 'date',
        'date_terminated'     => 'date',
        'salary'              => 'decimal:2',
        'clearance_processed' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function attendanceLogs()
    {
        return $this->hasMany(AttendanceLog::class);
    }

    public function leaveRequests()
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function payrolls()
    {
        return $this->hasMany(Payroll::class);
    }

    public function documents()
    {
        return $this->hasMany(EmployeeDocument::class);
    }

    public function performanceEvaluations()
    {
        return $this->hasMany(PerformanceEvaluation::class);
    }

    public function isActive(): bool
    {
        return $this->employment_status === 'active';
    }
}
