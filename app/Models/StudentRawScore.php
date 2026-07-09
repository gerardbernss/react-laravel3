<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentRawScore extends Model
{
    protected $fillable = [
        'grade_component_id',
        'student_enrollment_subject_id',
        'raw_score',
    ];

    protected $casts = [
        'raw_score' => 'float',
    ];

    /**
     * Get the grade component this score was recorded against.
     */
    public function gradeComponent(): BelongsTo
    {
        return $this->belongsTo(GradeComponent::class);
    }

    /**
     * Get the student enrollment subject entry this score belongs to.
     */
    public function enrollmentSubject(): BelongsTo
    {
        return $this->belongsTo(StudentEnrollmentSubject::class, 'student_enrollment_subject_id');
    }

    /**
     * Compute the raw score as a percentage of the component's highest possible score, or null if the score is missing.
     */
    public function getPercentageAttribute(): ?float
    {
        if ($this->raw_score === null || $this->gradeComponent->hps == 0) {
            return null;
        }

        return ($this->raw_score / $this->gradeComponent->hps) * 100;
    }
}
