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
     * Relationships
     */
    public function subjects()
    {
        return $this->belongsToMany(Subject::class, 'block_section_subject')
            ->withTimestamps();
    }

    public function students()
    {
        return $this->hasMany(Student::class);
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByGradeLevel($query, $gradeLevel)
    {
        return $query->where('grade_level', $gradeLevel);
    }

    public function scopeBySchoolYear($query, $schoolYear)
    {
        return $query->where('school_year', $schoolYear);
    }

    public function scopeByStrand($query, $strand)
    {
        return $query->where(function ($q) use ($strand) {
            $q->where('strand', $strand)
              ->orWhereNull('strand');
        });
    }

    public function scopeAvailable($query)
    {
        return $query->where('is_active', true)
            ->whereColumn('current_enrollment', '<', 'capacity');
    }

    /**
     * Helpers
     */
    public function hasAvailableSlots(): bool
    {
        return $this->current_enrollment < $this->capacity;
    }

    public function availableSlots(): int
    {
        return $this->capacity - $this->current_enrollment;
    }

    public function incrementEnrollment(): void
    {
        $this->increment('current_enrollment');
    }

    public function decrementEnrollment(): void
    {
        if ($this->current_enrollment > 0) {
            $this->decrement('current_enrollment');
        }
    }
}
