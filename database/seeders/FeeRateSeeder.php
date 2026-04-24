<?php

namespace Database\Seeders;

use App\Models\FeeRate;
use App\Models\FeeType;
use Illuminate\Database\Seeder;

class FeeRateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $schoolYear = '2025-2026';

        // Define rates by fee code for different grade levels
        $rates = [
            // Tuition (per unit)
            'TF' => [
                'Grade 1'  => 800.00,
                'Grade 2'  => 800.00,
                'Grade 3'  => 800.00,
                'Grade 4'  => 800.00,
                'Grade 5'  => 800.00,
                'Grade 6'  => 800.00,
                'Grade 7'  => 1000.00,
                'Grade 8'  => 1000.00,
                'Grade 9'  => 1000.00,
                'Grade 10' => 1000.00,
                'Grade 11' => 1200.00,
                'Grade 12' => 1200.00,
            ],

            // Miscellaneous Fees (fixed)
            'REG' => [
                'Grade 1'  => 500.00,
                'Grade 2'  => 500.00,
                'Grade 3'  => 500.00,
                'Grade 4'  => 500.00,
                'Grade 5'  => 500.00,
                'Grade 6'  => 500.00,
                'Grade 7'  => 600.00,
                'Grade 8'  => 600.00,
                'Grade 9'  => 600.00,
                'Grade 10' => 600.00,
                'Grade 11' => 700.00,
                'Grade 12' => 700.00,
            ],
            'LIB' => [
                'Grade 1'  => 300.00,
                'Grade 2'  => 300.00,
                'Grade 3'  => 300.00,
                'Grade 4'  => 300.00,
                'Grade 5'  => 300.00,
                'Grade 6'  => 300.00,
                'Grade 7'  => 400.00,
                'Grade 8'  => 400.00,
                'Grade 9'  => 400.00,
                'Grade 10' => 400.00,
                'Grade 11' => 500.00,
                'Grade 12' => 500.00,
            ],
            'SAF' => [
                'Grade 1'  => 200.00,
                'Grade 2'  => 200.00,
                'Grade 3'  => 200.00,
                'Grade 4'  => 200.00,
                'Grade 5'  => 200.00,
                'Grade 6'  => 200.00,
                'Grade 7'  => 250.00,
                'Grade 8'  => 250.00,
                'Grade 9'  => 250.00,
                'Grade 10' => 250.00,
                'Grade 11' => 300.00,
                'Grade 12' => 300.00,
            ],
            'MED' => [
                'Grade 1'  => 400.00,
                'Grade 2'  => 400.00,
                'Grade 3'  => 400.00,
                'Grade 4'  => 400.00,
                'Grade 5'  => 400.00,
                'Grade 6'  => 400.00,
                'Grade 7'  => 450.00,
                'Grade 8'  => 450.00,
                'Grade 9'  => 450.00,
                'Grade 10' => 450.00,
                'Grade 11' => 500.00,
                'Grade 12' => 500.00,
            ],
            'ID' => [
                'all' => 150.00,
            ],
            'ATH' => [
                'Grade 1'  => 200.00,
                'Grade 2'  => 200.00,
                'Grade 3'  => 200.00,
                'Grade 4'  => 200.00,
                'Grade 5'  => 200.00,
                'Grade 6'  => 200.00,
                'Grade 7'  => 250.00,
                'Grade 8'  => 250.00,
                'Grade 9'  => 250.00,
                'Grade 10' => 250.00,
                'Grade 11' => 300.00,
                'Grade 12' => 300.00,
            ],
            'GUID' => [
                'all' => 300.00,
            ],
            'CUL' => [
                'all' => 200.00,
            ],

            // Laboratory Fees
            'COMLAB' => [
                'Grade 11' => 1500.00,
                'Grade 12' => 1500.00,
            ],
            'SCILAB' => [
                'Grade 11' => 1200.00,
                'Grade 12' => 1200.00,
            ],

            // Special Fees
            'ENERGY' => [
                'Grade 1'  => 1000.00,
                'Grade 2'  => 1000.00,
                'Grade 3'  => 1000.00,
                'Grade 4'  => 1000.00,
                'Grade 5'  => 1000.00,
                'Grade 6'  => 1000.00,
                'Grade 7'  => 1200.00,
                'Grade 8'  => 1200.00,
                'Grade 9'  => 1200.00,
                'Grade 10' => 1200.00,
                'Grade 11' => 1500.00,
                'Grade 12' => 1500.00,
            ],
            'DEV' => [
                'all' => 500.00,
            ],
            'INS' => [
                'all' => 300.00,
            ],
        ];

        foreach ($rates as $feeCode => $gradeLevelRates) {
            $feeType = FeeType::where('code', $feeCode)->first();

            if (!$feeType) {
                continue;
            }

            foreach ($gradeLevelRates as $gradeLevel => $amount) {
                FeeRate::firstOrCreate(
                    [
                        'fee_type_id' => $feeType->id,
                        'school_year' => $schoolYear,
                        'semester' => 'Yearly',
                        'grade_level' => $gradeLevel,
                    ],
                    [
                        'amount' => $amount,
                        'effective_date' => now()->format('Y-m-d'),
                        'is_active' => true,
                    ]
                );
            }
        }

        $this->command->info('✅ Fee Rates seeded successfully!');
    }
}
