<?php

namespace Database\Seeders;

use App\Models\Applicant;
use App\Models\ApplicantPersonalData;
use App\Models\BlockSection;
use App\Models\PortalCredential;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentEnrollmentSubject;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class StudentSeeder extends Seeder
{
    public function run(): void
    {
        $students = [
            // --- Grade 11 STEM (STEM-11A) ---
            [
                'personal' => [
                    'last_name' => 'Reyes', 'first_name' => 'Maria', 'middle_name' => 'Santos',
                    'gender' => 'Female', 'citizenship' => 'Filipino', 'religion' => 'Roman Catholic',
                    'date_of_birth' => '2008-05-15', 'place_of_birth' => 'Baguio City',
                    'email' => 'maria.reyes.student@slu.edu.ph', 'alt_email' => 'mariareyes@gmail.com',
                    'mobile_number' => '09171234561',
                    'present_brgy' => 'Brgy. 1', 'present_city' => 'Baguio City',
                    'present_province' => 'Benguet', 'present_zip' => '2600',
                    'permanent_brgy' => 'Brgy. 1', 'permanent_city' => 'Baguio City',
                    'permanent_province' => 'Benguet', 'permanent_zip' => '2600',
                ],
                'application' => [
                    'year_level' => 'Grade 11', 'school_year' => '2025-2026',
                    'semester' => 'First Semester', 'student_category' => 'SHS',
                    'strand' => 'STEM', 'classification' => 'New Student',
                ],
                'block_code' => 'STEM-11A-1S-2526',
                'username' => 'maria.reyes.2526',
                'grades' => null,
            ],
            [
                'personal' => [
                    'last_name' => 'Cruz', 'first_name' => 'Juan', 'middle_name' => 'Dela',
                    'gender' => 'Male', 'citizenship' => 'Filipino', 'religion' => 'Roman Catholic',
                    'date_of_birth' => '2008-03-22', 'place_of_birth' => 'La Trinidad, Benguet',
                    'email' => 'juan.cruz.student@slu.edu.ph', 'alt_email' => 'juancruz@gmail.com',
                    'mobile_number' => '09181234562',
                    'present_brgy' => 'Brgy. Camp 7', 'present_city' => 'Baguio City',
                    'present_province' => 'Benguet', 'present_zip' => '2600',
                    'permanent_brgy' => 'Brgy. Camp 7', 'permanent_city' => 'Baguio City',
                    'permanent_province' => 'Benguet', 'permanent_zip' => '2600',
                ],
                'application' => [
                    'year_level' => 'Grade 11', 'school_year' => '2025-2026',
                    'semester' => 'First Semester', 'student_category' => 'SHS',
                    'strand' => 'STEM', 'classification' => 'New Student',
                ],
                'block_code' => 'STEM-11A-1S-2526',
                'username' => 'juan.cruz.2526',
                'grades' => ['92', '88', '82', '95', '87', '79'],
            ],
            [
                'personal' => [
                    'last_name' => 'Garcia', 'first_name' => 'Ana', 'middle_name' => 'Lim',
                    'gender' => 'Female', 'citizenship' => 'Filipino', 'religion' => 'Roman Catholic',
                    'date_of_birth' => '2008-11-08', 'place_of_birth' => 'Baguio City',
                    'email' => 'ana.garcia.student@slu.edu.ph', 'alt_email' => 'anagarcia@gmail.com',
                    'mobile_number' => '09191234563',
                    'present_brgy' => 'Brgy. Burnham', 'present_city' => 'Baguio City',
                    'present_province' => 'Benguet', 'present_zip' => '2600',
                    'permanent_brgy' => 'Brgy. Burnham', 'permanent_city' => 'Baguio City',
                    'permanent_province' => 'Benguet', 'permanent_zip' => '2600',
                ],
                'application' => [
                    'year_level' => 'Grade 11', 'school_year' => '2025-2026',
                    'semester' => 'First Semester', 'student_category' => 'SHS',
                    'strand' => 'STEM', 'classification' => 'New Student',
                ],
                'block_code' => 'STEM-11A-1S-2526',
                'username' => 'ana.garcia.2526',
                'grades' => null,
            ],
            // --- Grade 11 ABM (ABM-11A) ---
            [
                'personal' => [
                    'last_name' => 'Santos', 'first_name' => 'Carlo', 'middle_name' => 'Bautista',
                    'gender' => 'Male', 'citizenship' => 'Filipino', 'religion' => 'Roman Catholic',
                    'date_of_birth' => '2008-07-19', 'place_of_birth' => 'Baguio City',
                    'email' => 'carlo.santos.student@slu.edu.ph', 'alt_email' => 'carlosantos@gmail.com',
                    'mobile_number' => '09201234564',
                    'present_brgy' => 'Brgy. Aurora Hill', 'present_city' => 'Baguio City',
                    'present_province' => 'Benguet', 'present_zip' => '2600',
                    'permanent_brgy' => 'Brgy. Aurora Hill', 'permanent_city' => 'Baguio City',
                    'permanent_province' => 'Benguet', 'permanent_zip' => '2600',
                ],
                'application' => [
                    'year_level' => 'Grade 11', 'school_year' => '2025-2026',
                    'semester' => 'First Semester', 'student_category' => 'SHS',
                    'strand' => 'ABM', 'classification' => 'New Student',
                ],
                'block_code' => 'ABM-11A-1S-2526',
                'username' => 'carlo.santos.2526',
                'grades' => ['85', '90', '78', '93', '82', '88'],
            ],
            [
                'personal' => [
                    'last_name' => 'Torres', 'first_name' => 'Sophia', 'middle_name' => 'Ramos',
                    'gender' => 'Female', 'citizenship' => 'Filipino', 'religion' => 'Roman Catholic',
                    'date_of_birth' => '2008-09-30', 'place_of_birth' => 'Baguio City',
                    'email' => 'sophia.torres.student@slu.edu.ph', 'alt_email' => 'sophiatorres@gmail.com',
                    'mobile_number' => '09211234565',
                    'present_brgy' => 'Brgy. Fairview', 'present_city' => 'Baguio City',
                    'present_province' => 'Benguet', 'present_zip' => '2600',
                    'permanent_brgy' => 'Brgy. Fairview', 'permanent_city' => 'Baguio City',
                    'permanent_province' => 'Benguet', 'permanent_zip' => '2600',
                ],
                'application' => [
                    'year_level' => 'Grade 11', 'school_year' => '2025-2026',
                    'semester' => 'First Semester', 'student_category' => 'SHS',
                    'strand' => 'ABM', 'classification' => 'New Student',
                ],
                'block_code' => 'ABM-11A-1S-2526',
                'username' => 'sophia.torres.2526',
                'grades' => null,
            ],
            // --- Grade 7 JHS (G7-THOMAS) ---
            [
                'personal' => [
                    'last_name' => 'Mendoza', 'first_name' => 'Miguel', 'middle_name' => 'Flores',
                    'gender' => 'Male', 'citizenship' => 'Filipino', 'religion' => 'Roman Catholic',
                    'date_of_birth' => '2012-02-14', 'place_of_birth' => 'Baguio City',
                    'email' => 'miguel.mendoza.student@slu.edu.ph', 'alt_email' => 'miguelmendoza@gmail.com',
                    'mobile_number' => '09221234566',
                    'present_brgy' => 'Brgy. Lucnab', 'present_city' => 'Baguio City',
                    'present_province' => 'Benguet', 'present_zip' => '2600',
                    'permanent_brgy' => 'Brgy. Lucnab', 'permanent_city' => 'Baguio City',
                    'permanent_province' => 'Benguet', 'permanent_zip' => '2600',
                ],
                'application' => [
                    'year_level' => 'Grade 7', 'school_year' => '2025-2026',
                    'semester' => 'Full Year', 'student_category' => 'JHS',
                    'strand' => 'Laboratory Junior High School', 'classification' => 'New Student',
                ],
                'block_code' => 'G7-THOMAS-2526',
                'username' => 'miguel.mendoza.2526',
                'grades' => null,
            ],
            [
                'personal' => [
                    'last_name' => 'Villanueva', 'first_name' => 'Isabella', 'middle_name' => 'Navarro',
                    'gender' => 'Female', 'citizenship' => 'Filipino', 'religion' => 'Roman Catholic',
                    'date_of_birth' => '2012-06-25', 'place_of_birth' => 'La Trinidad, Benguet',
                    'email' => 'isabella.villanueva.student@slu.edu.ph', 'alt_email' => 'isabellavillanueva@gmail.com',
                    'mobile_number' => '09231234567',
                    'present_brgy' => 'Brgy. Pacdal', 'present_city' => 'Baguio City',
                    'present_province' => 'Benguet', 'present_zip' => '2600',
                    'permanent_brgy' => 'Brgy. Pacdal', 'permanent_city' => 'Baguio City',
                    'permanent_province' => 'Benguet', 'permanent_zip' => '2600',
                ],
                'application' => [
                    'year_level' => 'Grade 7', 'school_year' => '2025-2026',
                    'semester' => 'Full Year', 'student_category' => 'JHS',
                    'strand' => 'Laboratory Junior High School', 'classification' => 'New Student',
                ],
                'block_code' => 'G7-THOMAS-2526',
                'username' => 'isabella.villanueva.2526',
                'grades' => null,
            ],
            // --- Grade 1 LES (G1-HOPE) ---
            [
                'personal' => [
                    'last_name' => 'Aquino', 'first_name' => 'Liam', 'middle_name' => 'Castillo',
                    'gender' => 'Male', 'citizenship' => 'Filipino', 'religion' => 'Roman Catholic',
                    'date_of_birth' => '2018-04-10', 'place_of_birth' => 'Baguio City',
                    'email' => 'liam.aquino.student@slu.edu.ph', 'alt_email' => 'liamaquino@gmail.com',
                    'mobile_number' => '09241234568',
                    'present_brgy' => 'Brgy. Loakan', 'present_city' => 'Baguio City',
                    'present_province' => 'Benguet', 'present_zip' => '2600',
                    'permanent_brgy' => 'Brgy. Loakan', 'permanent_city' => 'Baguio City',
                    'permanent_province' => 'Benguet', 'permanent_zip' => '2600',
                ],
                'application' => [
                    'year_level' => 'Grade 1', 'school_year' => '2025-2026',
                    'semester' => 'Full Year', 'student_category' => 'LES',
                    'strand' => 'LES', 'classification' => 'New Student',
                ],
                'block_code' => 'G1-HOPE-2526',
                'username' => 'liam.aquino.2526',
                'grades' => null,
            ],
        ];

        $studentIdCounter = 2526001;

        foreach ($students as $data) {
            $block = BlockSection::where('code', $data['block_code'])->first();
            if (! $block) {
                $this->command->warn("Block section {$data['block_code']} not found — skipping {$data['personal']['first_name']} {$data['personal']['last_name']}");
                continue;
            }

            // 1. Personal data
            $personal = ApplicantPersonalData::create([
                ...$data['personal'],
                'present_street' => null,
                'permanent_street' => null,
                'has_sibling' => false,
                'stopped_studying' => null,
                'accelerated' => null,
                'health_conditions' => null,
            ]);

            // 2. Application info
            $application = Applicant::create([
                'applicant_personal_data_id' => $personal->id,
                'application_number' => 'APP-' . str_pad($studentIdCounter, 6, '0', STR_PAD_LEFT),
                'application_status' => 'Enrolled',
                'application_date' => '2025-07-01',
                'year_level' => $data['application']['year_level'],
                'school_year' => $data['application']['school_year'],
                'semester' => $data['application']['semester'],
                'student_category' => $data['application']['student_category'],
                'strand' => $data['application']['strand'],
                'classification' => $data['application']['classification'],
                'application_type' => 'Onsite',
            ]);

            // 3. Student record
            $student = Student::create([
                'applicant_personal_data_id' => $personal->id,
                'applicant_id' => $application->id,
                'student_id_number' => 'SLU-' . $studentIdCounter,
                'enrollment_date' => '2025-08-01',
                'enrollment_status' => 'Active',
                'current_year_level' => $data['application']['year_level'],
                'current_semester' => $data['application']['semester'],
                'current_school_year' => $data['application']['school_year'],
            ]);

            // 4. Portal credential
            PortalCredential::create([
                'applicant_personal_data_id' => $personal->id,
                'applicant_id' => $application->id,
                'username' => $data['username'],
                'temporary_password' => Hash::make('Student123!'),
                'password_changed' => false,
                'access_status' => 'Active',
                'credentials_generated_at' => now(),
                'created_by' => 'Admin',
            ]);

            // 5. Enrollment record
            $enrollment = StudentEnrollment::create([
                'student_id' => $student->id,
                'block_section_id' => $block->id,
                'school_year' => $data['application']['school_year'],
                'semester' => $data['application']['semester'],
                'year_level' => $data['application']['year_level'],
                'student_category' => $data['application']['student_category'],
                'enrollment_date' => '2025-08-01',
                'status' => 'Enrolled',
                'total_units' => 0,
                'units_earned' => 0,
            ]);

            // 6. Enrollment subjects
            $subjects = $block->subjects;
            $gradeValues = $data['grades'];
            $gradeIndex = 0;
            $totalUnits = 0;
            $unitsEarned = 0;

            foreach ($subjects as $subject) {
                $grade = null;
                $gradeStatus = null;

                if ($gradeValues && isset($gradeValues[$gradeIndex])) {
                    $grade = $gradeValues[$gradeIndex];
                    $gradeStatus = (float) $grade >= 75 ? 'Passed' : 'Failed';
                    if ($gradeStatus === 'Passed') {
                        $unitsEarned += $subject->units;
                    }
                }

                StudentEnrollmentSubject::create([
                    'student_enrollment_id' => $enrollment->id,
                    'subject_id' => $subject->id,
                    'units' => $subject->units,
                    'grade' => $grade,
                    'grade_status' => $gradeStatus,
                    'schedule' => $subject->schedule,
                    'room' => $subject->room,
                    'teacher' => $subject->faculty?->name,
                ]);

                $totalUnits += $subject->units;
                $gradeIndex++;
            }

            // Update enrollment totals
            $enrollment->update([
                'total_units' => $totalUnits,
                'units_earned' => $unitsEarned,
            ]);

            // Keep block section enrollment count accurate
            $block->incrementEnrollment();

            $this->command->line("  Created: {$data['personal']['first_name']} {$data['personal']['last_name']} ({$data['username']}) → {$block->code}");

            $studentIdCounter++;
        }

        $this->command->info('✅ 8 enrolled students created. Password for all: Student123!');
    }
}
