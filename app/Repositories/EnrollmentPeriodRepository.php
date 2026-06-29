<?php

namespace App\Repositories;

use App\Models\EnrollmentPeriod;
use Illuminate\Database\Eloquent\Collection;

class EnrollmentPeriodRepository
{
    public function allOrdered(): Collection
    {
        return EnrollmentPeriod::orderByDesc('school_year')->orderBy('semester')->get();
    }

    public function activePeriodExists(string $schoolYear, string $semester, string $type): bool
    {
        return EnrollmentPeriod::where('school_year', $schoolYear)
            ->where('semester', $semester)
            ->where('type', $type)
            ->where('is_open', true)
            ->where(fn ($q) => $q->whereNull('close_date')->orWhereDate('close_date', '>=', today()))
            ->exists();
    }

    public function activeOpenPeriodExistsForType(string $type, ?int $excludeId = null): bool
    {
        return EnrollmentPeriod::where('type', $type)
            ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
            ->where('is_open', true)
            ->where(fn ($q) => $q->whereNull('close_date')->orWhereDate('close_date', '>=', today()))
            ->exists();
    }

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

    public function openForStudents(): ?EnrollmentPeriod
    {
        return EnrollmentPeriod::where('type', 'student')
            ->where('is_open', true)
            ->where(fn ($q) => $q->whereNull('close_date')->orWhereDate('close_date', '>=', today()))
            ->first();
    }

    public function create(array $data): EnrollmentPeriod
    {
        return EnrollmentPeriod::create($data);
    }

    public function update(EnrollmentPeriod $period, array $data): void
    {
        $period->update($data);
    }

    public function delete(EnrollmentPeriod $period): void
    {
        $period->delete();
    }

    public function currentOfType(string $type): ?EnrollmentPeriod
    {
        return EnrollmentPeriod::where('type', $type)
            ->where('is_open', true)
            ->where(fn ($q) => $q->whereNull('start_date')->orWhereDate('start_date', '<=', today()))
            ->where(fn ($q) => $q->whereNull('close_date')->orWhereDate('close_date', '>=', today()))
            ->first()
            ?? EnrollmentPeriod::where('type', $type)->latest()->first();
    }

    public function hasOpenApplicantPeriod(): bool
    {
        return EnrollmentPeriod::where('type', 'applicant')
            ->where('is_open', true)
            ->where(fn ($q) => $q->whereNull('start_date')->orWhereDate('start_date', '<=', today()))
            ->where(fn ($q) => $q->whereNull('close_date')->orWhereDate('close_date', '>=', today()))
            ->exists();
    }

    public function isOpenFor(string $schoolYear, string $semester, string $type = 'student'): bool
    {
        $period = EnrollmentPeriod::where('school_year', $schoolYear)
            ->where('semester', $semester)
            ->where('type', $type)
            ->first();

        return $period?->isCurrentlyOpen() ?? false;
    }

    public function previousStudentPeriod(int $excludeId): ?EnrollmentPeriod
    {
        return EnrollmentPeriod::where('type', 'student')
            ->where('id', '!=', $excludeId)
            ->latest()
            ->first();
    }

}
