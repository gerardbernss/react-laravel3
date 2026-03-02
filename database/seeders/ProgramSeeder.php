<?php

namespace Database\Seeders;

use App\Models\Program;
use Illuminate\Database\Seeder;

class ProgramSeeder extends Seeder
{
    public function run(): void
    {
        $programs = [
            [
                'code' => 'ABM',
                'description' => 'Accountancy, Business, and Management',
                'school' => 'Senior High School',
                'vocational' => false,
                'is_active' => true,
                'max_load' => 32,
            ],
            [
                'code' => 'STEM',
                'description' => 'Science, Technology, Engineering, and Mathematics',
                'school' => 'Senior High School',
                'vocational' => false,
                'is_active' => true,
                'max_load' => 32,
            ],
            [
                'code' => 'HUMSS',
                'description' => 'Humanities and Social Sciences',
                'school' => 'Senior High School',
                'vocational' => false,
                'is_active' => true,
                'max_load' => 30,
            ],
            [
                'code' => 'GAS',
                'description' => 'General Academics',
                'school' => 'Senior High School',
                'vocational' => false,
                'is_active' => true,
                'max_load' => 30,
            ],
            [
                'code' => 'JHS',
                'description' => 'Junior High School',
                'school' => 'Junior High School',
                'vocational' => false,
                'is_active' => true,
                'max_load' => 40,
            ],
            [
                'code' => 'LES',
                'description' => 'Laboratory Elementary School',
                'school' => 'Laboratory Elementary School',
                'vocational' => false,
                'is_active' => true,
                'max_load' => 45,
            ],
            [
                'code' => 'KINDER',
                'description' => 'Kinder',
                'school' => 'Laboratory Elementary School',
                'vocational' => false,
                'is_active' => true,
                'max_load' => 25,
            ],
        ];

        foreach ($programs as $program) {
            Program::updateOrCreate(
                ['code' => $program['code']],
                $program
            );
        }
    }
}
