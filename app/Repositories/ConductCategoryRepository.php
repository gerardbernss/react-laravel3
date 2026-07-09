<?php

namespace App\Repositories;

use App\Models\ConductCategory;
use Illuminate\Database\Eloquent\Collection;

class ConductCategoryRepository
{
    /**
     * Returns all conduct categories with their criteria eager-loaded, sorted by display order then name.
     */
    public function allWithCriteria(): Collection
    {
        return ConductCategory::with('criteria')
            ->orderBy('order')
            ->orderBy('name')
            ->get();
    }

    /**
     * Returns true if any criterion in this category has been graded — used to prevent deletion of categories with existing grade history.
     */
    public function hasGradedCriteria(ConductCategory $category): bool
    {
        return $category->criteria()->whereHas('grades')->exists();
    }

    /**
     * Returns only active conduct categories with their criteria eager-loaded, sorted by display order then name.
     */
    public function activeCategoriesWithCriteria(): Collection
    {
        return ConductCategory::with('criteria')
            ->where('is_active', true)
            ->orderBy('order')
            ->orderBy('name')
            ->get();
    }

    /**
     * Creates and returns a new conduct category record.
     */
    public function create(array $data): ConductCategory
    {
        return ConductCategory::create($data);
    }

    /**
     * Updates the given conduct category with the supplied data.
     */
    public function update(ConductCategory $category, array $data): void
    {
        $category->update($data);
    }

    /**
     * Deletes the given conduct category record.
     */
    public function delete(ConductCategory $category): void
    {
        $category->delete();
    }
}
