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

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(StudentEnrollment::class, 'student_enrollment_id');
    }

    public function criteria(): BelongsTo
    {
        return $this->belongsTo(ConductCriteria::class, 'conduct_criteria_id');
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
