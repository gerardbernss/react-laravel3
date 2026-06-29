<?php

namespace App\Repositories;

use App\Models\Fee;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;

class FeeRepository
{
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

    public function distinctSchoolYearsDesc(): SupportCollection
    {
        return Fee::distinct()->pluck('school_year')->sort()->reverse()->values();
    }

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

    public function hasLineItems(Fee $fee): bool
    {
        return $fee->lineItems()->exists();
    }

    public function forSchoolYear(string $schoolYear): Collection
    {
        return Fee::where('school_year', $schoolYear)->get();
    }

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

    public function maxActiveSchoolYear(): ?string
    {
        return Fee::where('is_active', true)->max('school_year');
    }

    public function create(array $data): Fee
    {
        return Fee::create($data);
    }

    public function update(Fee $fee, array $data): void
    {
        $fee->update($data);
    }

    public function delete(Fee $fee): void
    {
        $fee->delete();
    }
}
