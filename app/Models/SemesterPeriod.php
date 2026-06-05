<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SemesterPeriod extends Model
{
    protected $fillable = ['name', 'start_month', 'end_month', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Returns the active SemesterPeriod whose month range contains today.
     * When today falls in a gap (e.g. June–July between semesters), falls back
     * to the period whose end_month is closest before the current month.
     */
    public static function getCurrent(): ?self
    {
        $month = (int) now()->format('n');

        // Exact match first
        $exact = static::where('is_active', true)
            ->where('start_month', '<=', $month)
            ->where('end_month', '>=', $month)
            ->first();

        if ($exact) return $exact;

        // Fall back to the most recently ended period
        return static::where('is_active', true)
            ->where('end_month', '<', $month)
            ->orderByDesc('end_month')
            ->first()
            ?? static::where('is_active', true)->orderByDesc('end_month')->first();
    }

    /**
     * Returns the semester name of the currently active period, or null.
     */
    public static function getCurrentSemester(): ?string
    {
        return static::getCurrent()?->name;
    }

}
