<?php

namespace Database\Seeders;

use App\Models\SemesterPeriod;
use Illuminate\Database\Seeder;

class SemesterPeriodSeeder extends Seeder
{
    public function run(): void
    {
        $periods = [
            ['name' => 'First Semester',  'start_month' => 8, 'end_month' => 12],
            ['name' => 'Second Semester', 'start_month' => 1, 'end_month' => 5],
        ];

        foreach ($periods as $period) {
            SemesterPeriod::firstOrCreate(['name' => $period['name']], $period);
        }
    }
}
