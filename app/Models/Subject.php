<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Subject extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'description',
        'units',
        'type',
        'grade_level',
        'strand',
        'semester',
        'user_id',
        'is_active',
    ];

    protected $casts = [
        'units' => 'integer',
        'is_active' => 'boolean',
    ];

    /**
     * Get the block sections this subject is assigned to (via block_section_subject pivot).
     */
    public function blockSections()
    {
        return $this->belongsToMany(BlockSection::class, 'block_section_subject')
            ->withTimestamps();
    }

    /**
     * Get the faculty member assigned to teach this subject.
     */
    public function faculty()
    {
        return $this->belongsTo(\App\Models\User::class, 'user_id');
    }

    /**
     * Get all schedules for this subject across all sections.
     */
    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class);
    }

    /**
     * Get the subject's default schedule — the one not tied to any specific block section.
     */
    public function defaultSchedule(): HasOne
    {
        return $this->hasOne(Schedule::class)->whereNull('block_section_id');
    }

    /**
     * Find the schedule entry for this subject in a specific block section, or null if none exists.
     */
    public function scheduleFor(int $blockSectionId): ?Schedule
    {
        return $this->schedules()->where('block_section_id', $blockSectionId)->first();
    }

    /**
     * Scope to active subjects only.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to subjects for a specific grade level.
     */
    public function scopeByGradeLevel($query, $gradeLevel)
    {
        return $query->where('grade_level', $gradeLevel);
    }

    /**
     * Scope to subjects for a specific semester.
     */
    public function scopeBySemester($query, $semester)
    {
        return $query->where('semester', $semester);
    }

    /**
     * Scope to subjects of a specific type (e.g. core, elective).
     */
    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope to subjects for a strand or subjects with no strand restriction (shared across strands).
     */
    public function scopeByStrand($query, $strand)
    {
        return $query->where(function ($q) use ($strand) {
            $q->where('strand', $strand)
              ->orWhereNull('strand');
        });
    }
}
