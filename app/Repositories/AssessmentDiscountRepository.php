<?php

namespace App\Repositories;

use App\Models\AssessmentDiscount;

class AssessmentDiscountRepository
{
    /**
     * Creates and returns a new assessment discount record linking a discount type to a student or applicant assessment.
     */
    public function create(array $data): AssessmentDiscount
    {
        return AssessmentDiscount::create($data);
    }
}
