<?php

namespace App\Repositories;

use App\Models\SemesterPeriod;
use Illuminate\Database\Eloquent\Collection;

class SemesterPeriodRepository
{
    /**
     * Returns all semester periods sorted by their start month in ascending order.
     */
    public function allOrderedByStartMonth(): Collection
    {
        return SemesterPeriod::orderBy('start_month')->get();
    }
}
