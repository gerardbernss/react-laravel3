<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentWithdrawal extends Model
{
    protected $fillable = [
        'applicant_id',
        'student_id',
        'assessment_id',
        'withdrawal_type',
        'refund_amount',
        'reason',
        'processed_by',
    ];

    protected $casts = [
        'refund_amount' => 'decimal:2',
    ];

    public function applicant()
    {
        return $this->belongsTo(Applicant::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function assessment()
    {
        return $this->belongsTo(StudentAssessment::class, 'assessment_id');
    }

    public function processedBy()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}
