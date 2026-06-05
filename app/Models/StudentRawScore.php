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

    public function gradeComponent(): BelongsTo
    {
        return $this->belongsTo(GradeComponent::class);
    }

    public function enrollmentSubject(): BelongsTo
    {
        return $this->belongsTo(StudentEnrollmentSubject::class, 'student_enrollment_subject_id');
    }

    public function getPercentageAttribute(): ?float
    {
        if ($this->raw_score === null || $this->gradeComponent->hps == 0) {
            return null;
        }

        return ($this->raw_score / $this->gradeComponent->hps) * 100;
    }
}
