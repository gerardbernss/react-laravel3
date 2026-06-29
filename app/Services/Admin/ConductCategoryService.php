<?php

namespace App\Services\Admin;

use App\Models\ConductCategory;
use App\Models\ConductCriteria;
use App\Repositories\ConductCategoryRepository;
use App\Repositories\ConductCriteriaRepository;

class ConductCategoryService
{
    public function __construct(
        private ConductCategoryRepository $conductCategoryRepository,
        private ConductCriteriaRepository $conductCriteriaRepository,
    ) {
    }

    public function create(array $data): ConductCategory
    {
        return $this->conductCategoryRepository->create($data + ['is_active' => true]);
    }

    public function update(ConductCategory $category, array $data): void
    {
        $this->conductCategoryRepository->update($category, $data);
    }

    public function delete(ConductCategory $category): bool
    {
        if ($this->conductCategoryRepository->hasGradedCriteria($category)) {
            return false;
        }

        $this->conductCategoryRepository->delete($category);

        return true;
    }

    public function addCriteria(ConductCategory $category, array $data): ConductCriteria
    {
        return $this->conductCriteriaRepository->create($category, $data);
    }

    public function deleteCriteria(ConductCriteria $criteria): bool
    {
        if ($this->conductCriteriaRepository->hasGrades($criteria)) {
            return false;
        }

        $this->conductCriteriaRepository->delete($criteria);

        return true;
    }
}
