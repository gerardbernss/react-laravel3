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

    /**
     * Creates a new conduct category, defaulting it to active.
     */
    public function create(array $data): ConductCategory
    {
        return $this->conductCategoryRepository->create($data + ['is_active' => true]);
    }

    /**
     * Updates a conduct category with the given data.
     */
    public function update(ConductCategory $category, array $data): void
    {
        $this->conductCategoryRepository->update($category, $data);
    }

    /**
     * Deletes a conduct category, but blocks deletion if any of its criteria already have student grades recorded.
     * Returns false if blocked, true on success.
     */
    public function delete(ConductCategory $category): bool
    {
        if ($this->conductCategoryRepository->hasGradedCriteria($category)) {
            return false;
        }

        $this->conductCategoryRepository->delete($category);

        return true;
    }

    /**
     * Adds a new conduct criterion to the given category.
     */
    public function addCriteria(ConductCategory $category, array $data): ConductCriteria
    {
        return $this->conductCriteriaRepository->create($category, $data);
    }

    /**
     * Deletes a conduct criterion, but blocks deletion if student grades have already been recorded against it.
     * Returns false if blocked, true on success.
     */
    public function deleteCriteria(ConductCriteria $criteria): bool
    {
        if ($this->conductCriteriaRepository->hasGrades($criteria)) {
            return false;
        }

        $this->conductCriteriaRepository->delete($criteria);

        return true;
    }
}
