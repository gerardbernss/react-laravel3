<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExaminationRoom extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'building',
        'capacity',
        'floor',
        'description',
        'facilities',
        'is_active',
    ];

    protected $casts = [
        'capacity' => 'integer',
        'is_active' => 'boolean',
    ];

    /**
     * Get the exam schedules for this room.
     */
    public function examSchedules(): HasMany
    {
        return $this->hasMany(ExamSchedule::class);
    }

    /**
     * Scope for active rooms only.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get the full location string.
     */
    public function getFullLocationAttribute(): string
    {
        $parts = array_filter([$this->name, $this->floor, $this->building]);
        return implode(', ', $parts);
    }
}
