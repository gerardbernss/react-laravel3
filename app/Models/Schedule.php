<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Schedule extends Model
{
    protected $table = 'subject_schedules';

    protected $fillable = [
        'subject_id',
        'block_section_id',
        'days',
        'time',
        'room',
        'code',
        'teacher_id',
    ];

    protected $appends = ['display'];

    /**
     * Get the subject this schedule entry belongs to.
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    /**
     * Get the block section this schedule entry is scoped to, or null for a default schedule.
     */
    public function blockSection(): BelongsTo
    {
        return $this->belongsTo(BlockSection::class);
    }

    /**
     * Get the teacher assigned to this schedule entry, or null if unassigned (falls back to the subject's own faculty).
     */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    /**
     * Returns a human-readable string like "MWF 07:30-08:30".
     */
    public function getDisplayAttribute(): string
    {
        return "{$this->days} {$this->time}";
    }
}
