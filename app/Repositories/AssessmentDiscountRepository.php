<?php

namespace App\Repositories;

use App\Models\AssessmentDiscount;

class AssessmentDiscountRepository
{
    public function create(array $data): AssessmentDiscount
    {
        return AssessmentDiscount::create($data);
    }
}
