<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payroll extends Model
{
    use HasFactory;

    protected $table = 'payroll';

    protected $fillable = [
        'employee_id',
        'basic_salary',
        'allowance',
        'overtime_pay',
        'deduction',
        'tax',
        'sss',
        'philhealth',
        'pagibig',
        'net_salary',
        'pay_date',
        'pay_period',
        'status',
        'processed_by',
    ];

    protected $casts = [
        'pay_date'     => 'date',
        'basic_salary' => 'decimal:2',
        'allowance'    => 'decimal:2',
        'overtime_pay' => 'decimal:2',
        'deduction'    => 'decimal:2',
        'tax'          => 'decimal:2',
        'sss'          => 'decimal:2',
        'philhealth'   => 'decimal:2',
        'pagibig'      => 'decimal:2',
        'net_salary'   => 'decimal:2',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function processor()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}
