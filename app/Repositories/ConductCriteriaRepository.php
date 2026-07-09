<?php

namespace App\Repositories;

use App\Models\ConductCategory;
use App\Models\ConductCriteria;

class ConductCriteriaRepository
{
    /**
     * Returns true if any conduct grades have been recorded for this criterion — used to prevent deletion of criteria with existing grade history.
     */
    public function hasGrades(ConductCriteria $criteria): bool
    {
        return $criteria->grades()->exists();
    }

    /**
     * Creates and returns a new conduct criterion under the given category.
     */
    public function create(ConductCategory $category, array $data): ConductCriteria
    {
        return $category->criteria()->create($data);
    }

    /**
     * Deletes the given conduct criterion record.
     */
    public function delete(ConductCriteria $criteria): void
    {
        $criteria->delete();
    }
}
