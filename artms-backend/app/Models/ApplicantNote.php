<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApplicantNote extends Model
{
    use HasFactory;

    protected $fillable = ['applicant_id', 'created_by', 'note'];

    public function applicant()
    {
        return $this->belongsTo(Applicant::class);
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
