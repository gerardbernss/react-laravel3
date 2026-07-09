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
     * Get the student enrollment this attendance record belongs to.
     */
    public function studentEnrollment(): BelongsTo
    {
        return $this->belongsTo(StudentEnrollment::class);
    }

    /**
     * Get the subject this attendance record is for.
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    /**
     * Scope to records for a specific date.
     */
    public function scopeForDate($query, string $date)
    {
        return $query->where('date', $date);
    }

    /**
     * Scope to records for a specific subject.
     */
    public function scopeForSubject($query, int $subjectId)
    {
        return $query->where('subject_id', $subjectId);
    }

    /**
     * Scope to present records.
     */
    public function scopePresent($query)
    {
        return $query->where('status', self::STATUS_PRESENT);
    }

    /**
     * Scope to absent records.
     */
    public function scopeAbsent($query)
    {
        return $query->where('status', self::STATUS_ABSENT);
    }

    /**
     * Scope to late records.
     */
    public function scopeLate($query)
    {
        return $query->where('status', self::STATUS_LATE);
    }

    /**
     * Scope to excused records.
     */
    public function scopeExcused($query)
    {
        return $query->where('status', self::STATUS_EXCUSED);
    }
}
