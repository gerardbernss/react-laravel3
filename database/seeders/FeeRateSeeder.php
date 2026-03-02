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

        // Define rates by fee code for different categories
        $rates = [
            // Tuition (per unit)
            'TF' => [
                'LES' => 800.00,
                'JHS' => 1000.00,
                'SHS' => 1200.00,
            ],

            // Miscellaneous Fees (fixed)
            'REG' => [
                'LES' => 500.00,
                'JHS' => 600.00,
                'SHS' => 700.00,
            ],
            'LIB' => [
                'LES' => 300.00,
                'JHS' => 400.00,
                'SHS' => 500.00,
            ],
            'SAF' => [
                'LES' => 200.00,
                'JHS' => 250.00,
                'SHS' => 300.00,
            ],
            'MED' => [
                'LES' => 400.00,
                'JHS' => 450.00,
                'SHS' => 500.00,
            ],
            'ID' => [
                'all' => 150.00,
            ],
            'ATH' => [
                'LES' => 200.00,
                'JHS' => 250.00,
                'SHS' => 300.00,
            ],
            'GUID' => [
                'all' => 300.00,
            ],
            'CUL' => [
                'all' => 200.00,
            ],

            // Laboratory Fees
            'COMLAB' => [
                'SHS' => 1500.00,
            ],
            'SCILAB' => [
                'SHS' => 1200.00,
            ],

            // Special Fees
            'ENERGY' => [
                'LES' => 1000.00,
                'JHS' => 1200.00,
                'SHS' => 1500.00,
            ],
            'DEV' => [
                'all' => 500.00,
            ],
            'INS' => [
                'all' => 300.00,
            ],
        ];

        foreach ($rates as $feeCode => $categoryRates) {
            $feeType = FeeType::where('code', $feeCode)->first();

            if (!$feeType) {
                continue;
            }

            foreach ($categoryRates as $category => $amount) {
                FeeRate::firstOrCreate(
                    [
                        'fee_type_id' => $feeType->id,
                        'school_year' => $schoolYear,
                        'semester' => 'Yearly',
                        'student_category' => $category,
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
