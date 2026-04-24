<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EnrollmentPeriod extends Model
{
    protected $fillable = [
        'school_year',
        'semester',
        'is_open',
        'start_date',
        'close_date',
        'opened_at',
        'closed_at',
        'notes',
    ];

    protected $casts = [
        'is_open'    => 'boolean',
        'start_date' => 'date',
        'close_date' => 'date',
        'opened_at'  => 'datetime',
        'closed_at'  => 'datetime',
    ];

    /**
     * True if manually open AND today is within the start–close date range.
     */
    public function isCurrentlyOpen(): bool
    {
        if (! $this->is_open) {
            return false;
        }

        $today = now()->startOfDay();

        if ($this->start_date && $today->lt($this->start_date)) {
            return false; // not yet started
        }

        if ($this->close_date && $today->gt($this->close_date)) {
            return false; // already expired
        }

        return true;
    }

    /**
     * Quick static check used by controllers.
     */
    public static function isOpenFor(string $schoolYear, string $semester): bool
    {
        $period = static::where('school_year', $schoolYear)
            ->where('semester', $semester)
            ->first();

        return $period?->isCurrentlyOpen() ?? false;
    }

    /**
     * Computed status label for frontend.
     * Returns 'open', 'upcoming', 'expired', or 'closed'.
     */
    public function getStatusAttribute(): string
    {
        if (! $this->is_open) {
            return 'closed';
        }

        $today = now()->startOfDay();

        if ($this->start_date && $today->lt($this->start_date)) {
            return 'upcoming';
        }

        if ($this->close_date && $today->gt($this->close_date)) {
            return 'expired';
        }

        return 'open';
    }
}
