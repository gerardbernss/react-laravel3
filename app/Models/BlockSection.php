<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BlockSection extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'grade_level',
        'strand',
        'school_year',
        'semester',
        'adviser',
        'room',
        'capacity',
        'current_enrollment',
        'schedule',
        'is_active',
    ];

    protected $casts = [
        'capacity' => 'integer',
        'current_enrollment' => 'integer',
        'is_active' => 'boolean',
    ];

    /**
     * Get the subjects assigned to this section (via block_section_subject pivot).
     */
    public function subjects()
    {
        return $this->belongsToMany(Subject::class, 'block_section_subject')
            ->withTimestamps();
    }

    /**
     * Get all student enrollments in this section.
     */
    public function enrollments()
    {
        return $this->hasMany(StudentEnrollment::class);
    }

    /**
     * Get all subject schedules assigned to this section.
     */
    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }

    /**
     * Scope to active sections only.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to sections for a specific grade level.
     */
    public function scopeByGradeLevel($query, $gradeLevel)
    {
        return $query->where('grade_level', $gradeLevel);
    }

    /**
     * Scope to sections for a specific school year.
     */
    public function scopeBySchoolYear($query, $schoolYear)
    {
        return $query->where('school_year', $schoolYear);
    }

    /**
     * Scope to sections for a strand or sections with no strand restriction.
     */
    public function scopeByStrand($query, $strand)
    {
        return $query->where(function ($q) use ($strand) {
            $q->where('strand', $strand)
              ->orWhereNull('strand');
        });
    }

    /**
     * Scope to active sections that still have open enrollment slots.
     */
    public function scopeAvailable($query)
    {
        return $query->where('is_active', true)
            ->whereColumn('current_enrollment', '<', 'capacity');
    }

    /**
     * Return true if the section has not yet reached its enrollment capacity.
     */
    public function hasAvailableSlots(): bool
    {
        return $this->current_enrollment < $this->capacity;
    }

    /**
     * Return the number of remaining open enrollment slots.
     */
    public function availableSlots(): int
    {
        return $this->capacity - $this->current_enrollment;
    }

    /**
     * Increment the current enrollment count by one.
     */
    public function incrementEnrollment(): void
    {
        $this->increment('current_enrollment');
    }

    /**
     * Decrement the current enrollment count by one, guarding against going below zero.
     */
    public function decrementEnrollment(): void
    {
        if ($this->current_enrollment > 0) {
            $this->decrement('current_enrollment');
        }
    }
}
