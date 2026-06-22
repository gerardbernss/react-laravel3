<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Query\Builder as QueryBuilder;

class EnrollmentPeriod extends Model
{
    protected $fillable = [
        'school_year',
        'semester',
        'type',
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
     * True if any enrollment period is currently active (open + within date range).
     */
    public static function hasOpenPeriod(): bool
    {
        return static::where('is_open', true)
            ->where(function ($q) {
                $q->whereNull('start_date')->orWhereDate('start_date', '<=', today());
            })
            ->where(function ($q) {
                $q->whereNull('close_date')->orWhereDate('close_date', '>=', today());
            })
            ->exists();
    }

    /**
     * Returns the currently active enrollment period (any type).
     * Prefers an open period whose date window contains today;
     * falls back to the most recently created period so callers
     * always get a school year / semester to work with.
     */
    public static function current(): ?self
    {
        return static::query()
            ->where('is_open', true)
            ->where(fn ($q) => $q->whereNull('start_date')->orWhereDate('start_date', '<=', today()))
            ->where(fn ($q) => $q->whereNull('close_date')->orWhereDate('close_date', '>=', today()))
            ->first()
            ?? static::query()->latest()->first();
    }

    /**
     * Like current(), but scoped to a single period type — so a "student"
     * lookup never resolves to an "applicant"/"application" period that
     * happens to be open at the same time (they often have a different
     * semester, e.g. "Full Year" vs "First Semester").
     */
    public static function currentOfType(string $type): ?self
    {
        return static::query()
            ->where('type', $type)
            ->where('is_open', true)
            ->where(fn ($q) => $q->whereNull('start_date')->orWhereDate('start_date', '<=', today()))
            ->where(fn ($q) => $q->whereNull('close_date')->orWhereDate('close_date', '>=', today()))
            ->first()
            ?? static::query()->where('type', $type)->latest()->first();
    }

    public static function hasOpenStudentPeriod(): bool
    {
        return static::where('type', 'student')
            ->where('is_open', true)
            ->where(fn ($q) => $q->whereNull('start_date')->orWhereDate('start_date', '<=', today()))
            ->where(fn ($q) => $q->whereNull('close_date')->orWhereDate('close_date', '>=', today()))
            ->exists();
    }

    public static function hasOpenApplicantPeriod(): bool
    {
        return static::where('type', 'applicant')
            ->where('is_open', true)
            ->where(fn ($q) => $q->whereNull('start_date')->orWhereDate('start_date', '<=', today()))
            ->where(fn ($q) => $q->whereNull('close_date')->orWhereDate('close_date', '>=', today()))
            ->exists();
    }

    public static function hasOpenApplicationPeriod(): bool
    {
        return static::where('type', 'application')
            ->where('is_open', true)
            ->where(fn ($q) => $q->whereNull('start_date')->orWhereDate('start_date', '<=', today()))
            ->where(fn ($q) => $q->whereNull('close_date')->orWhereDate('close_date', '>=', today()))
            ->exists();
    }

    /**
     * Quick static check used by controllers.
     */
    public static function isOpenFor(string $schoolYear, string $semester, string $type = 'student'): bool
    {
        $period = static::where('school_year', $schoolYear)
            ->where('semester', $semester)
            ->where('type', $type)
            ->first();

        return $period?->isCurrentlyOpen() ?? false;
    }

    /**
     * Scope a query to this period's school year and semester.
     *
     * A "Full Year" period covers every semester, so applicant/student
     * records (which only ever carry an actual semester like "First
     * Semester") are matched on school year alone in that case.
     */
    public function applyTo(Builder|QueryBuilder $query, string $schoolYearColumn = 'school_year', string $semesterColumn = 'semester'): Builder|QueryBuilder
    {
        return $query
            ->where($schoolYearColumn, $this->school_year)
            ->when($this->semester !== 'Full Year', fn (Builder|QueryBuilder $q) => $q->where($semesterColumn, $this->semester));
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
