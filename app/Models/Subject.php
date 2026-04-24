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
     * Relationships
     */
    public function blockSections()
    {
        return $this->belongsToMany(BlockSection::class, 'block_section_subject')
            ->withTimestamps();
    }

    public function faculty()
    {
        return $this->belongsTo(\App\Models\User::class, 'user_id');
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class);
    }

    public function defaultSchedule(): HasOne
    {
        return $this->hasOne(Schedule::class)->whereNull('block_section_id');
    }

    public function scheduleFor(int $blockSectionId): ?Schedule
    {
        return $this->schedules()->where('block_section_id', $blockSectionId)->first();
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

    public function scopeBySemester($query, $semester)
    {
        return $query->where('semester', $semester);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeByStrand($query, $strand)
    {
        return $query->where(function ($q) use ($strand) {
            $q->where('strand', $strand)
              ->orWhereNull('strand');
        });
    }
}
