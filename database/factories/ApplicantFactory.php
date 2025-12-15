<?php

namespace Database\Factories;

use App\Models\Applicant;
use Illuminate\Database\Eloquent\Factories\Factory;

class ApplicantFactory extends Factory
{
    protected $model = Applicant::class;

    public function definition(): array
    {
        return [
            // Application Information
            'application_date' => $this->faker->date(),
            'prio_no' => $this->faker->optional()->numerify('####'),
            'business_unit' => $this->faker->optional()->randomElement([
                'Laboratory Elementary School',
                'Laboratory High School',
                'Saint Louis University'
            ]),
            'campus_site' => $this->faker->randomElement([
                'Laboratory Elementary School',
                'Laboratory High School - JHS',
                'Laboratory High School - SHS'
            ]),
            'entry_class' => $this->faker->randomElement(['Freshman', 'Transferee', 'Shifter']),
            'stud_batch' => (string) $this->faker->year(),
            'semester' => $this->faker->randomElement(['1st Semester', '2nd Semester', 'Summer']),
            'schedule_pref' => $this->faker->optional()->randomElement(['AM Session', 'NN Session', 'PM Session']),
            'pchoice1' => $this->faker->optional()->randomElement(['ABM', 'HUMSS', 'STEM']),
            'pchoice2' => $this->faker->optional()->randomElement(['ABM', 'HUMSS', 'STEM']),
            'pchoice3' => $this->faker->optional()->randomElement(['ABM', 'HUMSS', 'STEM']),
            'curr_code' => $this->faker->numerify('##########'),
            'year_level' => $this->faker->randomElement(['11', '12']),

            // Personal Information
            'lrn' => $this->faker->unique()->numerify('############'),
            'first_name' => $this->faker->firstName(),
            'middle_name' => $this->faker->firstName(),
            'last_name' => $this->faker->lastName(),
            'suffix' => $this->faker->optional()->randomElement(['Jr.', 'Sr.', 'III']),
            'gender' => $this->faker->randomElement(['Male', 'Female']),
            'citizenship' => 'Filipino',
            'religion' => $this->faker->randomElement([
                'Roman Catholic',
                'Protestant',
                'Islam',
                'Buddhist'
            ]),
            'date_of_birth' => $this->faker->date('Y-m-d', '-10 years'),
            'place_of_birth' => $this->faker->city(),
            'civil_status' => $this->faker->randomElement(['Single', 'Married']),
            'birth_order' => $this->faker->optional()->randomElement(['1st', '2nd', '3rd', '4th']),
            'mother_tongue' => $this->faker->optional()->randomElement(['Tagalog', 'Ilocano', 'Cebuano']),
            'ethnicity' => $this->faker->optional()->word(),

            // Contact Information
            'phone' => $this->faker->regexify('\+639\d{9}'),
            'email' => $this->faker->unique()->safeEmail(),
            'street' => $this->faker->streetAddress(),
            'brgy' => $this->faker->streetName(),
            'city' => $this->faker->city(),
            'state' => $this->faker->state(),
            'zip_code' => $this->faker->regexify('\d{4}'),

            'father_name' => $this->faker->name('male'),
            'father_number' => $this->faker->regexify('\+639\d{9}'),
            'mother_name' => $this->faker->name('female'),
            'mother_number' => $this->faker->regexify('\+639\d{9}'),
            'emergency_contact_name' => $this->faker->name(),
            'emergency_contact_number' => $this->faker->regexify('\+639\d{9}'),

            // Other Information
            'financial_source' => $this->faker->optional()->randomElement(['Parents', 'Mother', 'Father', 'Grandparents']),
            'exam_schedule' => $this->faker->dateTimeBetween('now', '+1 month'),
        ];
    }
}
