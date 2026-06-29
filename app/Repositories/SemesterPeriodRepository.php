<?php

namespace App\Repositories;

use App\Models\SemesterPeriod;
use Illuminate\Database\Eloquent\Collection;

class SemesterPeriodRepository
{
    public function allOrderedByStartMonth(): Collection
    {
        return SemesterPeriod::orderBy('start_month')->get();
    }
}
