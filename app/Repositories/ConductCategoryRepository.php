<?php

namespace App\Repositories;

use App\Models\ConductCategory;
use Illuminate\Database\Eloquent\Collection;

class ConductCategoryRepository
{
    public function allWithCriteria(): Collection
    {
        return ConductCategory::with('criteria')
            ->orderBy('order')
            ->orderBy('name')
            ->get();
    }

    public function hasGradedCriteria(ConductCategory $category): bool
    {
        return $category->criteria()->whereHas('grades')->exists();
    }

    public function activeCategoriesWithCriteria(): Collection
    {
        return ConductCategory::with('criteria')
            ->where('is_active', true)
            ->orderBy('order')
            ->orderBy('name')
            ->get();
    }

    public function create(array $data): ConductCategory
    {
        return ConductCategory::create($data);
    }

    public function update(ConductCategory $category, array $data): void
    {
        $category->update($data);
    }

    public function delete(ConductCategory $category): void
    {
        $category->delete();
    }
}
