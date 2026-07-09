<?php

namespace App\Repositories;

use App\Models\EnrollmentPeriod;
use Illuminate\Database\Eloquent\Collection;

class EnrollmentPeriodRepository
{
    /**
     * Returns all enrollment periods ordered by school year descending then semester.
     */
    public function allOrdered(): Collection
    {
        return EnrollmentPeriod::orderByDesc('school_year')->orderBy('semester')->get();
    }

    /**
     * Returns true if an open enrollment period exists for the given school year, semester, and type that has not yet passed its close date.
     */
    public function activePeriodExists(string $schoolYear, string $semester, string $type): bool
    {
        return EnrollmentPeriod::where('school_year', $schoolYear)
            ->where('semester', $semester)
            ->where('type', $type)
            ->where('is_open', true)
            ->where(fn ($q) => $q->whereNull('close_date')->orWhereDate('close_date', '>=', today()))
            ->exists();
    }

    /**
     * Returns true if any open, non-expired period of the given type exists — optionally excluding a specific period ID (used during updates to avoid self-conflict).
     */
    public function activeOpenPeriodExistsForType(string $type, ?int $excludeId = null): bool
    {
        return EnrollmentPeriod::where('type', $type)
            ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
            ->where('is_open', true)
            ->where(fn ($q) => $q->whereNull('close_date')->orWhereDate('close_date', '>=', today()))
            ->exists();
    }

    /**
     * Returns the currently active enrollment period if one is open and within its date range, otherwise falls back to the most recently created period.
     */
    public function currentOrLatest(): ?EnrollmentPeriod
    {
        return EnrollmentPeriod::where('is_open', true)
            ->where(function ($q) {
                $q->whereNull('start_date')->orWhereDate('start_date', '<=', today());
            })
            ->where(function ($q) {
                $q->whereNull('close_date')->orWhereDate('close_date', '>=', today());
            })
            ->first()
            ?? EnrollmentPeriod::latest()->first();
    }

    /**
     * Returns the currently open student enrollment period, or null if none is active.
     */
    public function openForStudents(): ?EnrollmentPeriod
    {
        return EnrollmentPeriod::where('type', 'student')
            ->where('is_open', true)
            ->where(fn ($q) => $q->whereNull('close_date')->orWhereDate('close_date', '>=', today()))
            ->first();
    }

    /**
     * Creates and returns a new enrollment period record.
     */
    public function create(array $data): EnrollmentPeriod
    {
        return EnrollmentPeriod::create($data);
    }

    /**
     * Updates the given enrollment period with the supplied data.
     */
    public function update(EnrollmentPeriod $period, array $data): void
    {
        $period->update($data);
    }

    /**
     * Deletes the given enrollment period record.
     */
    public function delete(EnrollmentPeriod $period): void
    {
        $period->delete();
    }

    /**
     * Returns the currently active period of the given type if one is open and within its date window, otherwise falls back to the most recently created period of that type.
     */
    public function currentOfType(string $type): ?EnrollmentPeriod
    {
        return EnrollmentPeriod::where('type', $type)
            ->where('is_open', true)
            ->where(fn ($q) => $q->whereNull('start_date')->orWhereDate('start_date', '<=', today()))
            ->where(fn ($q) => $q->whereNull('close_date')->orWhereDate('close_date', '>=', today()))
            ->first()
            ?? EnrollmentPeriod::where('type', $type)->latest()->first();
    }

    /**
     * Returns true if an applicant enrollment period is currently open and within its date window.
     */
    public function hasOpenApplicantPeriod(): bool
    {
        return EnrollmentPeriod::where('type', 'applicant')
            ->where('is_open', true)
            ->where(fn ($q) => $q->whereNull('start_date')->orWhereDate('start_date', '<=', today()))
            ->where(fn ($q) => $q->whereNull('close_date')->orWhereDate('close_date', '>=', today()))
            ->exists();
    }

    /**
     * Returns true if the enrollment period for the given school year, semester, and type is currently open — delegates the open-window check to the model.
     */
    public function isOpenFor(string $schoolYear, string $semester, string $type = 'student'): bool
    {
        $period = EnrollmentPeriod::where('school_year', $schoolYear)
            ->where('semester', $semester)
            ->where('type', $type)
            ->first();

        return $period?->isCurrentlyOpen() ?? false;
    }

    /**
     * Returns the most recently created student enrollment period other than the one specified — used to find the prior period when closing the current one.
     */
    public function previousStudentPeriod(int $excludeId): ?EnrollmentPeriod
    {
        return EnrollmentPeriod::where('type', 'student')
            ->where('id', '!=', $excludeId)
            ->latest()
            ->first();
    }

}
