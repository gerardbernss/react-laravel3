<?php

namespace Database\Seeders;

use App\Models\Fee;
use Illuminate\Database\Seeder;

class FeeSeeder extends Seeder
{
    public function run(): void
    {
        $schoolYear = '2024-2025';

        $fees = [
            // ── Tuition Fee (per unit, per school level) ──────────────────────
            [
                'name'         => 'Tuition Fee',
                'code'         => 'TF-LES',
                'category'     => 'tuition',
                'is_per_unit'  => true,
                'is_required'  => true,
                'school_level' => 'LES',
                'school_year'  => $schoolYear,
                'semester'     => 'Yearly',
                'amount'       => 600.00,
                'description'  => 'Tuition fee for Laboratory Elementary School students.',
            ],
            [
                'name'         => 'Tuition Fee',
                'code'         => 'TF-JHS',
                'category'     => 'tuition',
                'is_per_unit'  => true,
                'is_required'  => true,
                'school_level' => 'JHS',
                'school_year'  => $schoolYear,
                'semester'     => 'Yearly',
                'amount'       => 800.00,
                'description'  => 'Tuition fee for Junior High School students.',
            ],
            [
                'name'         => 'Tuition Fee',
                'code'         => 'TF-SHS',
                'category'     => 'tuition',
                'is_per_unit'  => true,
                'is_required'  => true,
                'school_level' => 'SHS',
                'school_year'  => $schoolYear,
                'semester'     => '1st Semester',
                'amount'       => 1000.00,
                'description'  => 'Tuition fee for Senior High School students (1st Semester).',
            ],
            [
                'name'         => 'Tuition Fee',
                'code'         => 'TF-SHS-2',
                'category'     => 'tuition',
                'is_per_unit'  => true,
                'is_required'  => true,
                'school_level' => 'SHS',
                'school_year'  => $schoolYear,
                'semester'     => '2nd Semester',
                'amount'       => 1000.00,
                'description'  => 'Tuition fee for Senior High School students (2nd Semester).',
            ],

            // ── Miscellaneous Fees (flat, all levels, yearly) ─────────────────
            [
                'name'         => 'Library Fee',
                'code'         => 'LIB',
                'category'     => 'miscellaneous',
                'is_per_unit'  => false,
                'is_required'  => true,
                'school_level' => 'all',
                'school_year'  => $schoolYear,
                'semester'     => 'Yearly',
                'amount'       => 500.00,
                'description'  => 'Access to library resources and materials.',
            ],
            [
                'name'         => 'IT Fee',
                'code'         => 'IT',
                'category'     => 'miscellaneous',
                'is_per_unit'  => false,
                'is_required'  => true,
                'school_level' => 'all',
                'school_year'  => $schoolYear,
                'semester'     => 'Yearly',
                'amount'       => 800.00,
                'description'  => 'Information technology infrastructure and computer lab maintenance.',
            ],
            [
                'name'         => 'Laboratory Fee',
                'code'         => 'LAB',
                'category'     => 'laboratory',
                'is_per_unit'  => false,
                'is_required'  => true,
                'school_level' => 'all',
                'school_year'  => $schoolYear,
                'semester'     => 'Yearly',
                'amount'       => 1000.00,
                'description'  => 'Science and laboratory equipment usage.',
            ],
            [
                'name'         => 'Publication Fee',
                'code'         => 'PUB',
                'category'     => 'miscellaneous',
                'is_per_unit'  => false,
                'is_required'  => true,
                'school_level' => 'all',
                'school_year'  => $schoolYear,
                'semester'     => 'Yearly',
                'amount'       => 300.00,
                'description'  => 'School publication and student handbook.',
            ],
            [
                'name'         => 'Athletic Fee',
                'code'         => 'ATH',
                'category'     => 'miscellaneous',
                'is_per_unit'  => false,
                'is_required'  => true,
                'school_level' => 'all',
                'school_year'  => $schoolYear,
                'semester'     => 'Yearly',
                'amount'       => 400.00,
                'description'  => 'Sports programs, equipment, and intramural activities.',
            ],
        ];

        foreach ($fees as $fee) {
            Fee::firstOrCreate(
                [
                    'code'         => $fee['code'],
                    'school_year'  => $fee['school_year'],
                    'semester'     => $fee['semester'],
                    'school_level' => $fee['school_level'],
                ],
                array_merge($fee, ['is_active' => true])
            );
        }
    }
}
