<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConductGrade extends Model
{
    protected $fillable = [
        'student_enrollment_id',
        'conduct_criteria_id',
        'grading_quarter',
        'score',
        'recorded_by',
    ];

    protected $casts = [
        'score' => 'float',
    ];

    /**
     * Get the student enrollment this conduct grade belongs to.
     */
    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(StudentEnrollment::class, 'student_enrollment_id');
    }

    /**
     * Get the conduct criteria this grade was scored against.
     */
    public function criteria(): BelongsTo
    {
        return $this->belongsTo(ConductCriteria::class, 'conduct_criteria_id');
    }

    /**
     * Get the faculty user who recorded this conduct grade.
     */
    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
