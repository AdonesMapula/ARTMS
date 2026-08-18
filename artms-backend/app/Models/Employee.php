<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        // New schema columns
        'employee_id',
        'user_id',
        'first_name',
        'middle_name',
        'last_name',
        'email',
        'phone',
        'department_id',
        'job_title',
        'employment_status',
        'hire_date',
        'birth_date',
        'gender',
        'address',
        'emergency_contact_name',
        'emergency_contact_phone',
        'basic_salary',
        'avatar',
        'documents_status',
        // Legacy columns (kept for backward compatibility)
        'position',
        'salary',
        'date_hired',
        'contact_number',
        'emergency_contact_number',
        'employment_type',
        'date_terminated',
        'termination_reason',
        'clearance_processed',
    ];

    protected $casts = [
        'hire_date'           => 'date',
        'birth_date'          => 'date',
        'date_hired'          => 'date',
        'date_terminated'     => 'date',
        'basic_salary'        => 'decimal:2',
        'salary'              => 'decimal:2',
        'clearance_processed' => 'boolean',
    ];

    public function getAvatarAttribute($value): ?string
    {
        if (!$value) return null;
        if (str_starts_with($value, 'http://')) {
            return 'https://' . substr($value, 7);
        }
        return $value;
    }

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

    /**
     * Generate standard employee number format: EMP-XXXX
     * as defined in DATABASE_SCHEMA.md (e.g., EMP-001)
     */
    public function generateEmployeeNumber(): string
    {
        $paddedId = str_pad($this->id, 4, '0', STR_PAD_LEFT);
        return "EMP-{$paddedId}";
    }

    /**
     * Seed default 201 file document checklist for new employee
     */
    public function seedDefaultDocuments(): void
    {
        $defaultTypes = [
            'birth_cert'    => 'Birth Certificate',
            'sss_card'      => 'SSS Number / Card / E-1 Form',
            'tin'           => 'Tax Identification Number (TIN)',
            'resume'        => 'Updated Resume / Curriculum Vitae',
            'nbi_clearance' => 'NBI Clearance',
            'medical_cert'  => 'Medical Clearance / Fit to Work Certificate',
            'philhealth'    => 'PhilHealth MDR / ID',
            'pagibig'       => 'Pag-IBIG MID / Member Record',
            'diploma'       => 'Diploma / Transcript of Records',
            'photo'         => '2x2 Professional ID Photo',
        ];

        foreach ($defaultTypes as $type => $remarks) {
            $this->documents()->firstOrCreate(
                ['document_type' => $type],
                [
                    'status'      => 'required',
                    'remarks'     => $remarks,
                    'file_path'   => null,
                    'original_name' => null,
                ]
            );
        }
    }
}
