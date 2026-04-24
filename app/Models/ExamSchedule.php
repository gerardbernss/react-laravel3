<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'exam_type',
        'exam_date',
        'start_time',
        'end_time',
        'examination_room_id',
        'capacity',
        'description',
        'instructions',
        'is_active',
    ];

    protected $casts = [
        'exam_date' => 'date',
        'is_active' => 'boolean',
    ];

    /**
     * Get the examination room for this schedule.
     */
    public function examinationRoom(): BelongsTo
    {
        return $this->belongsTo(ExaminationRoom::class);
    }

    /**
     * Get the applicant assignments for this schedule.
     */
    public function applicantAssignments(): HasMany
    {
        return $this->hasMany(ApplicantExamAssignment::class);
    }

    /**
     * Scope for active schedules only.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for upcoming schedules.
     */
    public function scopeUpcoming($query)
    {
        return $query->where('exam_date', '>=', now()->toDateString());
    }

    /**
     * Get the effective capacity from the room.
     */
    public function getEffectiveCapacityAttribute(): int
    {
        return $this->examinationRoom?->capacity ?? 30;
    }

    /**
     * Get the number of assigned applicants.
     */
    public function getAssignedCountAttribute(): int
    {
        return $this->applicantAssignments()->whereNotIn('status', ['cancelled'])->count();
    }

    /**
     * Get available slots.
     */
    public function getAvailableSlotsAttribute(): int
    {
        return max(0, $this->effective_capacity - $this->assigned_count);
    }

    /**
     * Check if the schedule is full.
     */
    public function getIsFullAttribute(): bool
    {
        return $this->available_slots <= 0;
    }
}
