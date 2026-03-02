<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class StudentEnrollment extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'block_section_id',
        'school_year',
        'semester',
        'year_level',
        'student_category',
        'enrollment_date',
        'status',
        'gwa',
        'total_units',
        'units_earned',
        'remarks',
    ];

    protected $casts = [
        'enrollment_date' => 'date',
        'gwa' => 'decimal:2',
        'total_units' => 'integer',
        'units_earned' => 'integer',
    ];

    /**
     * Status constants
     */
    const STATUS_ENROLLED = 'Enrolled';
    const STATUS_COMPLETED = 'Completed';
    const STATUS_DROPPED = 'Dropped';
    const STATUS_INCOMPLETE = 'Incomplete';

    /**
     * Relationships
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function blockSection(): BelongsTo
    {
        return $this->belongsTo(BlockSection::class);
    }

    public function enrollmentSubjects(): HasMany
    {
        return $this->hasMany(StudentEnrollmentSubject::class);
    }

    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'student_enrollment_subjects')
            ->withPivot(['units', 'grade', 'grade_status', 'schedule', 'room', 'teacher'])
            ->withTimestamps();
    }

    /**
     * Scopes
     */
    public function scopeForSchoolYear($query, string $schoolYear)
    {
        return $query->where('school_year', $schoolYear);
    }

    public function scopeForSemester($query, string $semester)
    {
        return $query->where('semester', $semester);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ENROLLED);
    }

    public function scopeForCategory($query, string $category)
    {
        return $query->where('student_category', $category);
    }

    /**
     * Calculate the General Weighted Average
     */
    public function calculateGWA(): ?float
    {
        $subjects = $this->enrollmentSubjects()
            ->whereNotNull('grade')
            ->whereIn('grade_status', ['Passed', 'Failed'])
            ->get();

        if ($subjects->isEmpty()) {
            return null;
        }

        $totalWeightedGrade = 0;
        $totalUnits = 0;

        foreach ($subjects as $subject) {
            $totalWeightedGrade += $subject->grade * $subject->units;
            $totalUnits += $subject->units;
        }

        if ($totalUnits === 0) {
            return null;
        }

        $gwa = $totalWeightedGrade / $totalUnits;
        $this->update(['gwa' => round($gwa, 2)]);

        return round($gwa, 2);
    }

    /**
     * Get total units for this enrollment
     */
    public function getTotalUnits(): int
    {
        $total = $this->enrollmentSubjects()->sum('units');
        $this->update(['total_units' => $total]);

        return (int) $total;
    }

    /**
     * Get units earned (passed subjects)
     */
    public function getUnitsEarned(): int
    {
        $earned = $this->enrollmentSubjects()
            ->where('grade_status', 'Passed')
            ->sum('units');

        $this->update(['units_earned' => $earned]);

        return (int) $earned;
    }

    /**
     * Check if enrollment is complete
     */
    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    /**
     * Mark enrollment as completed
     */
    public function markAsCompleted(): void
    {
        $this->calculateGWA();
        $this->getTotalUnits();
        $this->getUnitsEarned();
        $this->update(['status' => self::STATUS_COMPLETED]);
    }

    /**
     * Get formatted semester display
     */
    public function getSemesterDisplayAttribute(): string
    {
        return "{$this->semester} Semester, {$this->school_year}";
    }
}
