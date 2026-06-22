<?php

namespace Database\Seeders;

use App\Models\DiscountType;
use Illuminate\Database\Seeder;

class DiscountTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $discountTypes = [
            [
                'name' => 'Sibling Discount',
                'code' => 'SIBLING',
                'discount_type' => 'percentage',
                'value' => 20.00,
                'applies_to' => 'tuition_only',
                'requires_verification' => true,
                'is_stackable' => false,
                'description' => '20% discount on tuition for students with siblings who are old/recurring students',
            ],
            [
                'name' => 'Academic Scholar - Full',
                'code' => 'SCHOLAR-FULL',
                'discount_type' => 'percentage',
                'value' => 100.00,
                'applies_to' => 'tuition_only',
                'requires_verification' => true,
                'is_stackable' => false,
                'description' => 'Full tuition scholarship for academic excellence',
            ],
            [
                'name' => 'Academic Scholar - Half',
                'code' => 'SCHOLAR-HALF',
                'discount_type' => 'percentage',
                'value' => 50.00,
                'applies_to' => 'tuition_only',
                'requires_verification' => true,
                'is_stackable' => false,
                'description' => '50% tuition scholarship for academic excellence',
            ],
            [
                'name' => 'Academic Scholar - Partial',
                'code' => 'SCHOLAR-25',
                'discount_type' => 'percentage',
                'value' => 25.00,
                'applies_to' => 'tuition_only',
                'requires_verification' => true,
                'is_stackable' => false,
                'description' => '25% tuition scholarship for academic excellence',
            ],
            [
                'name' => 'Early Bird Discount',
                'code' => 'EARLY-BIRD',
                'discount_type' => 'percentage',
                'value' => 5.00,
                'applies_to' => 'all_fees',
                'requires_verification' => false,
                'is_stackable' => true,
                'description' => '5% discount for early enrollment',
            ],
            [
                'name' => 'Employee Dependent Discount',
                'code' => 'EMPLOYEE-DEP',
                'discount_type' => 'percentage',
                'value' => 50.00,
                'applies_to' => 'tuition_only',
                'requires_verification' => true,
                'is_stackable' => false,
                'description' => '50% tuition discount for children of school employees',
            ],
            [
                'name' => 'PWD Discount',
                'code' => 'PWD',
                'discount_type' => 'percentage',
                'value' => 20.00,
                'applies_to' => 'all_fees',
                'requires_verification' => true,
                'is_stackable' => true,
                'description' => '20% discount for Persons with Disabilities',
            ],
            [
                'name' => 'Senior Citizen Dependent',
                'code' => 'SENIOR-DEP',
                'discount_type' => 'percentage',
                'value' => 15.00,
                'applies_to' => 'tuition_only',
                'requires_verification' => true,
                'is_stackable' => true,
                'description' => '15% discount for dependents of senior citizens',
            ],
            [
                'name' => 'Loyalty Discount',
                'code' => 'LOYALTY',
                'discount_type' => 'fixed_amount',
                'value' => 2000.00,
                'applies_to' => 'all_fees',
                'requires_verification' => true,
                'is_stackable' => true,
                'description' => '₱2,000 discount for students enrolled for 3+ consecutive years',
            ],
            [
                'name' => 'Cash Payment Discount',
                'code' => 'CASH',
                'discount_type' => 'percentage',
                'value' => 3.00,
                'applies_to' => 'all_fees',
                'requires_verification' => false,
                'is_stackable' => true,
                'description' => '3% discount for full cash payment',
            ],
        ];

        foreach ($discountTypes as $discount) {
            DiscountType::firstOrCreate(
                ['code' => $discount['code']],
                $discount
            );
        }

        $this->command->info('✅ Discount Types seeded successfully!');
    }
}
