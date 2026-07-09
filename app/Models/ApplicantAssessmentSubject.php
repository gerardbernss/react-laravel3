<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApplicantAssessmentSubject extends Model
{
    protected $fillable = [
        'applicant_assessment_id',
        'subject_id',
        'units',
    ];

    protected $casts = [
        'units' => 'float',
    ];

    /**
     * Get the applicant assessment this subject line belongs to.
     */
    public function assessment()
    {
        return $this->belongsTo(ApplicantAssessment::class, 'applicant_assessment_id');
    }

    /**
     * Get the subject included in this assessment.
     */
    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }
}
