<?php

namespace Database\Seeders;

use App\Models\Applicant;
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
            FeeTypeSeeder::class,
            FeeRateSeeder::class,
            DiscountTypeSeeder::class,
            SubjectSeeder::class,
            BlockSectionSeeder::class,
            ExaminationRoomSeeder::class,
            ExamScheduleSeeder::class,
        ]);
        Applicant::factory(10)->create();
        $this->command->info('✅ 10 Applicants created successfully!');
    }
}
