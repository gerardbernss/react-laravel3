<?php

namespace App\Services\Admin;

use App\Models\SemesterPeriod;

class SemesterPeriodService
{
    public function update(SemesterPeriod $semesterPeriod, array $data): void
    {
        $semesterPeriod->update($data);
    }
}
