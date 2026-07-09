<?php

namespace App\Repositories;

use App\Models\Fee;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;

class FeeRepository
{
    /**
     * Returns fees filtered by any combination of school_year, semester, school_level, and category, ordered by year (desc), semester, level, category, then name.
     */
    public function filteredOrdered(array $filters): Collection
    {
        $query = Fee::orderBy('school_year', 'desc')
            ->orderBy('semester')
            ->orderBy('school_level')
            ->orderBy('category')
            ->orderBy('name');

        foreach (['school_year', 'semester', 'school_level', 'category'] as $field) {
            if (! empty($filters[$field])) {
                $query->where($field, $filters[$field]);
            }
        }

        return $query->get();
    }

    /**
     * Returns the distinct school years that have at least one fee record, sorted newest first.
     */
    public function distinctSchoolYearsDesc(): SupportCollection
    {
        return Fee::distinct()->pluck('school_year')->sort()->reverse()->values();
    }

    /**
     * Returns true if a fee with the given code already exists for the same school year, semester, and school level.
     * Pass `$excludeId` when editing an existing fee to avoid a false duplicate match against itself.
     */
    public function codeExistsForPeriod(
        string $code,
        string $schoolYear,
        string $semester,
        string $schoolLevel,
        ?int $excludeId = null,
    ): bool {
        $query = Fee::where('code', $code)
            ->where('school_year', $schoolYear)
            ->where('semester', $semester)
            ->where('school_level', $schoolLevel);

        if ($excludeId !== null) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }

    /**
     * Returns true if this fee is referenced by any assessment line items — used to prevent deletion of in-use fees.
     */
    public function hasLineItems(Fee $fee): bool
    {
        return $fee->lineItems()->exists();
    }

    /**
     * Returns all fees for the given school year, regardless of active status or level.
     */
    public function forSchoolYear(string $schoolYear): Collection
    {
        return Fee::where('school_year', $schoolYear)->get();
    }

    /**
     * Returns active fees that apply to the given school level and year, including fees marked for "all" levels.
     * Level-specific fees are ordered before "all" fees so more specific rates take priority.
     */
    public function applicableActive(string $schoolLevel, string $schoolYear): Collection
    {
        return Fee::where('is_active', true)
            ->where('school_year', $schoolYear)
            ->where(function ($q) use ($schoolLevel) {
                $q->where('school_level', 'all')->orWhere('school_level', $schoolLevel);
            })
            ->orderByRaw('CASE WHEN school_level = ? THEN 0 ELSE 1 END', [$schoolLevel])
            ->get();
    }

    /**
     * Returns the most recent school year that has at least one active fee, or null if none exist.
     * Used as a fallback when no fees are found for the requested year.
     */
    public function maxActiveSchoolYear(): ?string
    {
        return Fee::where('is_active', true)->max('school_year');
    }

    /**
     * Creates and returns a new fee record.
     */
    public function create(array $data): Fee
    {
        return Fee::create($data);
    }

    /**
     * Updates the given fee record with the supplied data.
     */
    public function update(Fee $fee, array $data): void
    {
        $fee->update($data);
    }

    /**
     * Deletes the given fee record.
     */
    public function delete(Fee $fee): void
    {
        $fee->delete();
    }
}
