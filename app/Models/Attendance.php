<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_enrollment_id',
        'subject_id',
        'date',
        'status',
        'remarks', // instructor/teacher note
        'reason',  // student-supplied explanation
    ];

    protected $casts = [
        'date' => 'date',
    ];

    /**
     * Status constants
     */
    const STATUS_PRESENT = 'Present';
    const STATUS_ABSENT = 'Absent';
    const STATUS_LATE = 'Late';
    const STATUS_EXCUSED = 'Excused';

    /**
     * Relationships
     */
    public function studentEnrollment(): BelongsTo
    {
        return $this->belongsTo(StudentEnrollment::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    /**
     * Scopes
     */
    public function scopeForDate($query, string $date)
    {
        return $query->where('date', $date);
    }

    public function scopeForSubject($query, int $subjectId)
    {
        return $query->where('subject_id', $subjectId);
    }

    public function scopePresent($query)
    {
        return $query->where('status', self::STATUS_PRESENT);
    }

    public function scopeAbsent($query)
    {
        return $query->where('status', self::STATUS_ABSENT);
    }

    public function scopeLate($query)
    {
        return $query->where('status', self::STATUS_LATE);
    }

    public function scopeExcused($query)
    {
        return $query->where('status', self::STATUS_EXCUSED);
    }
}
