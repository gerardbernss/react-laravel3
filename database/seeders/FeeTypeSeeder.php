<?php

namespace Database\Seeders;

use App\Models\FeeType;
use Illuminate\Database\Seeder;

class FeeTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $feeTypes = [
            // Tuition Fees
            [
                'name' => 'Tuition Fee',
                'code' => 'TF',
                'category' => 'tuition',
                'is_per_unit' => true,
                'is_required' => true,
                'applies_to' => 'all',
                'description' => 'Basic tuition fee per unit',
            ],

            // Miscellaneous Fees
            [
                'name' => 'Registration Fee',
                'code' => 'REG',
                'category' => 'miscellaneous',
                'is_per_unit' => false,
                'is_required' => true,
                'applies_to' => 'all',
                'description' => 'One-time registration fee per semester',
            ],
            [
                'name' => 'Library Fee',
                'code' => 'LIB',
                'category' => 'miscellaneous',
                'is_per_unit' => false,
                'is_required' => true,
                'applies_to' => 'all',
                'description' => 'Library access and resources fee',
            ],
            [
                'name' => 'Student Activity Fee',
                'code' => 'SAF',
                'category' => 'miscellaneous',
                'is_per_unit' => false,
                'is_required' => true,
                'applies_to' => 'all',
                'description' => 'Student council and activities fee',
            ],
            [
                'name' => 'Medical/Dental Fee',
                'code' => 'MED',
                'category' => 'miscellaneous',
                'is_per_unit' => false,
                'is_required' => true,
                'applies_to' => 'all',
                'description' => 'School clinic and health services fee',
            ],
            [
                'name' => 'ID Fee',
                'code' => 'ID',
                'category' => 'miscellaneous',
                'is_per_unit' => false,
                'is_required' => true,
                'applies_to' => 'all',
                'description' => 'Student ID card fee',
            ],
            [
                'name' => 'Athletic Fee',
                'code' => 'ATH',
                'category' => 'miscellaneous',
                'is_per_unit' => false,
                'is_required' => true,
                'applies_to' => 'all',
                'description' => 'Sports and athletic facilities fee',
            ],
            [
                'name' => 'Guidance Fee',
                'code' => 'GUID',
                'category' => 'miscellaneous',
                'is_per_unit' => false,
                'is_required' => true,
                'applies_to' => 'all',
                'description' => 'Guidance and counseling services fee',
            ],
            [
                'name' => 'Cultural Fee',
                'code' => 'CUL',
                'category' => 'miscellaneous',
                'is_per_unit' => false,
                'is_required' => false,
                'applies_to' => 'all',
                'description' => 'Cultural activities and events fee',
            ],

            // Laboratory Fees
            [
                'name' => 'Computer Laboratory Fee',
                'code' => 'COMLAB',
                'category' => 'laboratory',
                'is_per_unit' => false,
                'is_required' => true,
                'applies_to' => 'SHS',
                'description' => 'Computer laboratory access fee',
            ],
            [
                'name' => 'Science Laboratory Fee',
                'code' => 'SCILAB',
                'category' => 'laboratory',
                'is_per_unit' => false,
                'is_required' => true,
                'applies_to' => 'SHS',
                'description' => 'Science laboratory fee for practical classes',
            ],

            // Special Fees
            [
                'name' => 'Energy Fee',
                'code' => 'ENERGY',
                'category' => 'special',
                'is_per_unit' => false,
                'is_required' => true,
                'applies_to' => 'all',
                'description' => 'Air conditioning and electricity fee',
            ],
            [
                'name' => 'Development Fee',
                'code' => 'DEV',
                'category' => 'special',
                'is_per_unit' => false,
                'is_required' => true,
                'applies_to' => 'all',
                'description' => 'School development and improvement fee',
            ],
            [
                'name' => 'Insurance Fee',
                'code' => 'INS',
                'category' => 'special',
                'is_per_unit' => false,
                'is_required' => true,
                'applies_to' => 'all',
                'description' => 'Student accident insurance',
            ],
        ];

        foreach ($feeTypes as $feeType) {
            FeeType::firstOrCreate(
                ['code' => $feeType['code']],
                $feeType
            );
        }

        $this->command->info('✅ Fee Types seeded successfully!');
    }
}
