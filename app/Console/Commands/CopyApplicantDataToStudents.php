<?php

namespace App\Console\Commands;

use App\Models\Student;
use App\Models\StudentDocuments;
use App\Models\StudentFamilyBackground;
use App\Models\StudentPersonalData;
use App\Models\StudentSiblings;
use Illuminate\Console\Command;

class CopyApplicantDataToStudents extends Command
{
    protected $signature = 'students:copy-applicant-data';

    protected $description = 'Retroactively copy applicant personal data into student_personal_data tables for enrolled students';

    public function handle(): int
    {
        $students = Student::with([
            'personalData.familyBackground',
            'personalData.siblings',
            'application.documents',
        ])
            ->whereNotNull('applicant_personal_data_id')
            ->whereNull('student_personal_data_id')
            ->get();

        if ($students->isEmpty()) {
            $this->info('No students need backfilling.');
            return self::SUCCESS;
        }

        $this->info("Found {$students->count()} student(s) to backfill.");
        $bar = $this->output->createProgressBar($students->count());
        $bar->start();

        $copied = 0;
        $skipped = 0;

        foreach ($students as $student) {
            $pd = $student->personalData;

            if (!$pd) {
                $skipped++;
                $bar->advance();
                continue;
            }

            // Copy personal data
            $spd = StudentPersonalData::updateOrCreate(
                ['email' => $pd->email],
                [
                    'last_name'                => $pd->last_name,
                    'first_name'               => $pd->first_name,
                    'middle_name'              => $pd->middle_name,
                    'suffix'                   => $pd->suffix,
                    'learner_reference_number' => $pd->learner_reference_number,
                    'gender'                   => $pd->gender,
                    'citizenship'              => $pd->citizenship,
                    'religion'                 => $pd->religion,
                    'date_of_birth'            => $pd->date_of_birth,
                    'place_of_birth'           => $pd->place_of_birth,
                    'has_sibling'              => $pd->has_sibling ?? false,
                    'alt_email'                => $pd->alt_email,
                    'mobile_number'            => $pd->mobile_number,
                    'present_street'           => $pd->present_street,
                    'present_brgy'             => $pd->present_brgy,
                    'present_city'             => $pd->present_city,
                    'present_province'         => $pd->present_province,
                    'present_zip'              => $pd->present_zip,
                    'permanent_street'         => $pd->permanent_street,
                    'permanent_brgy'           => $pd->permanent_brgy,
                    'permanent_city'           => $pd->permanent_city,
                    'permanent_province'       => $pd->permanent_province,
                    'permanent_zip'            => $pd->permanent_zip,
                    'stopped_studying'         => $pd->stopped_studying,
                    'accelerated'              => $pd->accelerated,
                    'health_conditions'        => $pd->health_conditions,
                    'has_doctors_note'         => $pd->has_doctors_note ?? false,
                    'doctors_note_file'        => $pd->doctors_note_file,
                ]
            );

            $student->update(['student_personal_data_id' => $spd->id]);

            // Copy family background
            $fb = $pd->familyBackground;
            if ($fb) {
                StudentFamilyBackground::updateOrCreate(
                    ['student_personal_data_id' => $spd->id],
                    [
                        'father_lname'              => $fb->father_lname,
                        'father_fname'              => $fb->father_fname,
                        'father_mname'              => $fb->father_mname,
                        'father_living'             => $fb->father_living,
                        'father_citizenship'        => $fb->father_citizenship,
                        'father_religion'           => $fb->father_religion,
                        'father_highest_educ'       => $fb->father_highest_educ,
                        'father_occupation'         => $fb->father_occupation,
                        'father_income'             => $fb->father_income,
                        'father_business_emp'       => $fb->father_business_emp,
                        'father_business_address'   => $fb->father_business_address,
                        'father_contact_no'         => $fb->father_contact_no,
                        'father_email'              => $fb->father_email,
                        'father_slu_employee'       => $fb->father_slu_employee,
                        'father_slu_dept'           => $fb->father_slu_dept,
                        'mother_lname'              => $fb->mother_lname,
                        'mother_fname'              => $fb->mother_fname,
                        'mother_mname'              => $fb->mother_mname,
                        'mother_living'             => $fb->mother_living,
                        'mother_citizenship'        => $fb->mother_citizenship,
                        'mother_religion'           => $fb->mother_religion,
                        'mother_highest_educ'       => $fb->mother_highest_educ,
                        'mother_occupation'         => $fb->mother_occupation,
                        'mother_income'             => $fb->mother_income,
                        'mother_business_emp'       => $fb->mother_business_emp,
                        'mother_business_address'   => $fb->mother_business_address,
                        'mother_contact_no'         => $fb->mother_contact_no,
                        'mother_email'              => $fb->mother_email,
                        'mother_slu_employee'       => $fb->mother_slu_employee,
                        'mother_slu_dept'           => $fb->mother_slu_dept,
                        'guardian_lname'            => $fb->guardian_lname,
                        'guardian_fname'            => $fb->guardian_fname,
                        'guardian_mname'            => $fb->guardian_mname,
                        'guardian_relationship'     => $fb->guardian_relationship,
                        'guardian_citizenship'      => $fb->guardian_citizenship,
                        'guardian_religion'         => $fb->guardian_religion,
                        'guardian_highest_educ'     => $fb->guardian_highest_educ,
                        'guardian_occupation'       => $fb->guardian_occupation,
                        'guardian_income'           => $fb->guardian_income,
                        'guardian_business_emp'     => $fb->guardian_business_emp,
                        'guardian_business_address' => $fb->guardian_business_address,
                        'guardian_contact_no'       => $fb->guardian_contact_no,
                        'guardian_email'            => $fb->guardian_email,
                        'guardian_slu_employee'     => $fb->guardian_slu_employee,
                        'guardian_slu_dept'         => $fb->guardian_slu_dept,
                        'emergency_contact_name'    => $fb->emergency_contact_name,
                        'emergency_relationship'    => $fb->emergency_relationship,
                        'emergency_email'           => $fb->emergency_email,
                        'emergency_home_phone'      => $fb->emergency_home_phone,
                        'emergency_mobile_phone'    => $fb->emergency_mobile_phone,
                    ]
                );
            }

            // Copy siblings
            foreach ($pd->siblings as $sibling) {
                StudentSiblings::firstOrCreate(
                    [
                        'student_personal_data_id' => $spd->id,
                        'sibling_full_name'        => $sibling->sibling_full_name,
                    ],
                    [
                        'sibling_grade_level' => $sibling->sibling_grade_level,
                        'sibling_id_number'   => $sibling->sibling_id_number,
                    ]
                );
            }

            // Copy documents
            $docs = $student->application?->documents;
            if ($docs) {
                StudentDocuments::updateOrCreate(
                    ['student_personal_data_id' => $spd->id],
                    [
                        'certificate_of_enrollment' => $docs->certificate_of_enrollment,
                        'birth_certificate'         => $docs->birth_certificate,
                        'latest_report_card_front'  => $docs->latest_report_card_front,
                        'latest_report_card_back'   => $docs->latest_report_card_back,
                    ]
                );
            }

            $copied++;
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Done. Copied: {$copied}, Skipped (no personal data): {$skipped}.");

        return self::SUCCESS;
    }
}
