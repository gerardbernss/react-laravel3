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
     */
    public static function getCurrent(): ?self
    {
        $month = (int) now()->format('n');

        return static::where('is_active', true)
            ->where('start_month', '<=', $month)
            ->where('end_month', '>=', $month)
            ->first();
    }

    /**
     * Returns the semester name of the currently active period, or null.
     */
    public static function getCurrentSemester(): ?string
    {
        return static::getCurrent()?->name;
    }

    /**
     * Returns the school year based on the current date.
     * Month >= 8 (Aug–Dec): {year}-{year+1}
     * Month < 8  (Jan–Jul): {year-1}-{year}
     */
    public static function getCurrentSchoolYear(): string
    {
        $year  = (int) now()->format('Y');
        $month = (int) now()->format('n');
        $startYear = $month >= 8 ? $year : $year - 1;

        return "{$startYear}-" . ($startYear + 1);
    }
}
