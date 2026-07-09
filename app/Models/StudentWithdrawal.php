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

    /**
     * Get the applicant record associated with this withdrawal.
     */
    public function applicant()
    {
        return $this->belongsTo(Applicant::class);
    }

    /**
     * Get the student who was withdrawn.
     */
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * Get the assessment at the time of withdrawal (used to compute any refund).
     */
    public function assessment()
    {
        return $this->belongsTo(StudentAssessment::class, 'assessment_id');
    }

    /**
     * Get the admin user who processed the withdrawal.
     */
    public function processedBy()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}
