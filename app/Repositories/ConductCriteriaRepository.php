<?php

namespace App\Repositories;

use App\Models\ConductCategory;
use App\Models\ConductCriteria;

class ConductCriteriaRepository
{
    public function hasGrades(ConductCriteria $criteria): bool
    {
        return $criteria->grades()->exists();
    }

    public function create(ConductCategory $category, array $data): ConductCriteria
    {
        return $category->criteria()->create($data);
    }

    public function delete(ConductCriteria $criteria): void
    {
        $criteria->delete();
    }
}
