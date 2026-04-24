<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            SemesterPeriodSeeder::class,
            FeeTypeSeeder::class,
            FeeRateSeeder::class,
            DiscountTypeSeeder::class,
            SubjectSeeder::class,
            BlockSectionSeeder::class,
            ExaminationRoomSeeder::class,
            ExamScheduleSeeder::class,
            StudentSeeder::class,
        ]);

    }
}
