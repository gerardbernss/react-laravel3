<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentEnrollmentSubject extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_enrollment_id',
        'subject_id',
        'units',
        'grade',
        'grade_status',
        'schedule',
        'room',
        'teacher',
    ];

    protected $casts = [
        'units' => 'decimal:1',
        'grade' => 'decimal:2',
    ];

    /**
     * Grade status constants
     */
    const STATUS_PASSED = 'Passed';
    const STATUS_FAILED = 'Failed';
    const STATUS_INCOMPLETE = 'INC';
    const STATUS_DROPPED = 'DRP';
    const STATUS_WITHDRAWN = 'W';

    /**
     * Relationships
     */
    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(StudentEnrollment::class, 'student_enrollment_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    /**
     * Scopes
     */
    public function scopePassed($query)
    {
        return $query->where('grade_status', self::STATUS_PASSED);
    }

    public function scopeFailed($query)
    {
        return $query->where('grade_status', self::STATUS_FAILED);
    }

    public function scopeDropped($query)
    {
        return $query->where('grade_status', self::STATUS_DROPPED);
    }

    public function scopeWithGrades($query)
    {
        return $query->whereNotNull('grade');
    }

    /**
     * Check if subject was passed
     */
    public function isPassed(): bool
    {
        return $this->grade_status === self::STATUS_PASSED;
    }

    /**
     * Check if subject was failed
     */
    public function isFailed(): bool
    {
        return $this->grade_status === self::STATUS_FAILED;
    }

    /**
     * Check if subject was dropped
     */
    public function isDropped(): bool
    {
        return $this->grade_status === self::STATUS_DROPPED;
    }

    /**
     * Check if subject is incomplete
     */
    public function isIncomplete(): bool
    {
        return $this->grade_status === self::STATUS_INCOMPLETE;
    }

    /**
     * Set grade and automatically determine status
     */
    public function setGrade(float $grade): void
    {
        $this->grade = $grade;

        // K-12 percentage grading: 75 and above is passing
        if ($grade >= 75) {
            $this->grade_status = self::STATUS_PASSED;
        } else {
            $this->grade_status = self::STATUS_FAILED;
        }

        $this->save();
    }

    /**
     * Mark as dropped
     */
    public function markAsDropped(): void
    {
        $this->update([
            'grade' => null,
            'grade_status' => self::STATUS_DROPPED,
        ]);
    }

    /**
     * Mark as incomplete
     */
    public function markAsIncomplete(): void
    {
        $this->update([
            'grade' => null,
            'grade_status' => self::STATUS_INCOMPLETE,
        ]);
    }

    /**
     * Get grade display (formatted)
     */
    public function getGradeDisplayAttribute(): string
    {
        if ($this->grade_status === self::STATUS_DROPPED) {
            return 'DRP';
        }

        if ($this->grade_status === self::STATUS_INCOMPLETE) {
            return 'INC';
        }

        if ($this->grade_status === self::STATUS_WITHDRAWN) {
            return 'W';
        }

        if ($this->grade === null) {
            return '-';
        }

        return number_format($this->grade, 2);
    }
}
