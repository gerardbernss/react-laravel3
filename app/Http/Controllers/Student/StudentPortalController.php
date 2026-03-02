<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\BlockSection;
use App\Models\DiscountType;
use App\Models\FeeRate;
use App\Models\FeeType;
use App\Models\Program;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentEnrollmentSubject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class StudentPortalController extends Controller
{
    /**
     * Get the currently authenticated student's portal credential.
     */
    protected function getStudent()
    {
        return Auth::guard('student')->user();
    }

    /**
     * Show the student dashboard.
     */
    public function dashboard(): Response
    {
        $student = $this->getStudent();
        $personalData = $student->personalData;
        $application = $student->application;
        $studentRecord = $personalData ? $personalData->student : null;

        return Inertia::render('Student/Dashboard', [
            'student' => [
                'id' => $student->id,
                'username' => $student->username,
                'password_changed' => $student->password_changed,
                'first_login_at' => $student->first_login_at,
                'last_login_at' => $student->last_login_at,
            ],
            'personalData' => $personalData ? [
                'id' => $personalData->id,
                'first_name' => $personalData->first_name,
                'last_name' => $personalData->last_name,
                'middle_name' => $personalData->middle_name,
                'suffix' => $personalData->suffix,
                'email' => $personalData->email,
                'gender' => $personalData->gender,
                'date_of_birth' => $personalData->date_of_birth,
                'place_of_birth' => $personalData->place_of_birth,
                'citizenship' => $personalData->citizenship,
                'religion' => $personalData->religion,
                'mobile_number' => $personalData->mobile_number,
                'present_address' => trim(implode(', ', array_filter([
                    $personalData->present_street,
                    $personalData->present_brgy,
                    $personalData->present_city,
                    $personalData->present_province,
                ]))),
            ] : null,
            'application' => $application ? [
                'id' => $application->id,
                'application_number' => $application->application_number,
                'school_year' => $application->school_year,
                'semester' => $application->semester,
                'grade_level' => $application->year_level,
                'strand' => $application->strand,
                'student_category' => $application->student_category,
                'classification' => $application->classification,
                'learning_mode' => $application->learning_mode,
                'application_status' => $application->application_status,
                'date_applied' => $application->application_date,
                'examination_date' => $application->examination_date,
            ] : null,
            'studentRecord' => $studentRecord ? [
                'id' => $studentRecord->id,
                'student_id_number' => $studentRecord->student_id_number,
                'enrollment_status' => $studentRecord->enrollment_status,
                'enrollment_date' => $studentRecord->enrollment_date,
            ] : null,
        ]);
    }

    /**
     * Show the student enrollment page.
     * Shows enrollment process if not yet enrolled, otherwise shows status.
     */
    public function enrollment(): Response
    {
        $student = $this->getStudent();
        $personalData = $student->personalData;
        $application = $student->application;
        $studentRecord = $personalData?->student;
        $documents = $personalData?->documents;

        $isEnrolled = $application && strtolower($application->application_status) === 'enrolled';
        $canEnroll = $application && !$isEnrolled;

        $program = $application ? $this->resolveProgram($application) : null;

        $enrollmentData = $canEnroll && $application
            ? $this->getEnrollmentWizardData($application)
            : ['blockSections' => [], 'fees' => [], 'availableDiscounts' => []];

        return Inertia::render('Student/Enrollment', [
            'student' => $this->formatStudentResponse($student),
            'personalData' => $this->formatPersonalDataResponse($personalData),
            'application' => $this->formatApplicationResponse($application),
            'studentRecord' => $this->formatStudentRecordResponse($studentRecord),
            'canEnroll' => $canEnroll,
            'isEnrolled' => $isEnrolled,
            'documents' => $this->formatDocumentsResponse($documents),
            'maxLoad' => $program?->max_load ?? 0,
            'programName' => $program?->description ?? null,
            'blockSections' => $enrollmentData['blockSections'],
            'fees' => $enrollmentData['fees'],
            'availableDiscounts' => $enrollmentData['availableDiscounts'],
        ]);
    }

    /**
     * Get all enrollment wizard data for a given application.
     *
     * @param mixed $application
     * @return array{blockSections: array, fees: array, availableDiscounts: array}
     */
    private function getEnrollmentWizardData($application): array
    {
        $gradeLevel = $application->year_level;
        $schoolYear = $application->school_year;
        $strand = $application->strand;
        $studentCategory = $this->getStudentCategory($gradeLevel);

        return [
            'blockSections' => $this->getBlockSections($gradeLevel, $schoolYear, $strand),
            'fees' => $this->getApplicableFees($studentCategory, $schoolYear),
            'availableDiscounts' => $this->getAvailableDiscounts(),
        ];
    }

    /**
     * Get available block sections for enrollment.
     */
    private function getBlockSections(string $gradeLevel, string $schoolYear, ?string $strand): array
    {
        $query = BlockSection::with(['subjects.faculty'])
            ->where('grade_level', $gradeLevel)
            ->where('school_year', $schoolYear)
            ->where('is_active', true)
            ->whereColumn('current_enrollment', '<', 'capacity');

        if ($strand) {
            $query->where(function ($q) use ($strand) {
                $q->where('strand', $strand)->orWhereNull('strand');
            });
        }

        return $query->get()->map(function ($block) {
            $subjects = $block->subjects->map(function ($subject) {
                return [
                    'id' => $subject->id,
                    'code' => $subject->code,
                    'name' => $subject->name,
                    'units' => $subject->units,
                    'type' => $subject->type,
                ];
            });

            return [
                'id' => $block->id,
                'name' => $block->name,
                'code' => $block->code,
                'grade_level' => $block->grade_level,
                'strand' => $block->strand,
                'adviser' => $block->adviser,
                'room' => $block->room,
                'capacity' => $block->capacity,
                'current_enrollment' => $block->current_enrollment,
                'schedule' => $block->schedule,
                'subjects' => $subjects->toArray(),
                'total_units' => $block->subjects->sum('units'),
            ];
        })->toArray();
    }

    /**
     * Get applicable fees for a student category.
     */
    private function getApplicableFees(string $studentCategory, string $schoolYear): array
    {
        $fees = [];

        $feeTypes = FeeType::where('is_active', true)
            ->where(function ($query) use ($studentCategory) {
                $query->where('applies_to', 'all')->orWhere('applies_to', $studentCategory);
            })
            ->get();

        foreach ($feeTypes as $feeType) {
            $rate = FeeRate::where('fee_type_id', $feeType->id)
                ->where('school_year', $schoolYear)
                ->where('is_active', true)
                ->where(function ($query) use ($studentCategory) {
                    $query->where('student_category', 'all')->orWhere('student_category', $studentCategory);
                })
                ->orderByRaw("CASE WHEN student_category = ? THEN 0 ELSE 1 END", [$studentCategory])
                ->first();

            if ($rate) {
                $fees[] = [
                    'id' => $feeType->id,
                    'name' => $feeType->name,
                    'code' => $feeType->code,
                    'category' => $feeType->category,
                    'is_per_unit' => $feeType->is_per_unit,
                    'amount' => (float) $rate->amount,
                ];
            }
        }

        return $fees;
    }

    /**
     * Get available discount types.
     */
    private function getAvailableDiscounts(): array
    {
        return DiscountType::where('is_active', true)
            ->get()
            ->map(fn ($discount) => [
                'id' => $discount->id,
                'name' => $discount->name,
                'code' => $discount->code,
                'discount_type' => $discount->discount_type,
                'value' => (float) $discount->value,
                'applies_to' => $discount->applies_to,
            ])->toArray();
    }

    /**
     * Format student data for response.
     */
    private function formatStudentResponse($student): array
    {
        return [
            'id' => $student->id,
            'username' => $student->username,
        ];
    }

    /**
     * Format personal data for response.
     */
    private function formatPersonalDataResponse($personalData): ?array
    {
        if (!$personalData) {
            return null;
        }

        return [
            'id' => $personalData->id,
            'first_name' => $personalData->first_name,
            'last_name' => $personalData->last_name,
            'middle_name' => $personalData->middle_name,
            'email' => $personalData->email,
        ];
    }

    /**
     * Format application data for response.
     */
    private function formatApplicationResponse($application): ?array
    {
        if (!$application) {
            return null;
        }

        return [
            'id' => $application->id,
            'school_year' => $application->school_year,
            'grade_level' => $application->year_level,
            'student_type' => $application->student_category,
            'student_category' => $this->getStudentCategory($application->year_level),
            'application_status' => $application->application_status,
            'date_applied' => $application->application_date,
            'exam_status' => $application->exam_status,
            'exam_date' => $application->examination_date,
        ];
    }

    /**
     * Format student record for response.
     */
    private function formatStudentRecordResponse($studentRecord): ?array
    {
        if (!$studentRecord) {
            return null;
        }

        return [
            'id' => $studentRecord->id,
            'student_id' => $studentRecord->student_id_number,
            'enrollment_status' => $studentRecord->enrollment_status,
            'enrollment_date' => $studentRecord->enrollment_date,
            'current_year_level' => $studentRecord->current_year_level,
            'current_school_year' => $studentRecord->current_school_year,
        ];
    }

    /**
     * Format documents for response.
     */
    private function formatDocumentsResponse($documents): ?array
    {
        if (!$documents) {
            return null;
        }

        return [
            'birth_certificate' => $documents->birth_certificate,
            'report_card' => $documents->report_card,
            'good_moral' => $documents->good_moral,
            'id_photo' => $documents->id_photo,
        ];
    }

    /**
     * Determine student category based on grade level.
     */
    private function getStudentCategory(string $gradeLevel): string
    {
        if (str_contains($gradeLevel, 'Grade 1') || str_contains($gradeLevel, 'Grade 2') ||
            str_contains($gradeLevel, 'Grade 3') || str_contains($gradeLevel, 'Grade 4') ||
            str_contains($gradeLevel, 'Grade 5') || str_contains($gradeLevel, 'Grade 6')) {
            return 'LES';
        }

        if (str_contains($gradeLevel, 'Grade 7') || str_contains($gradeLevel, 'Grade 8') ||
            str_contains($gradeLevel, 'Grade 9') || str_contains($gradeLevel, 'Grade 10')) {
            return 'JHS';
        }

        if (str_contains($gradeLevel, 'Grade 11') || str_contains($gradeLevel, 'Grade 12')) {
            return 'SHS';
        }

        return 'all';
    }

    /**
     * Resolve the Program model from an applicant's strand/student_category.
     */
    private function resolveProgram($application): ?Program
    {
        $strand = $application->strand;

        // SHS: extract code from parentheses, e.g. "Accountancy, Business and Management (ABM)" → "ABM"
        if (preg_match('/\(([A-Z]+)\)/', $strand, $matches)) {
            $program = Program::active()->where('code', $matches[1])->first();
            if ($program) {
                return $program;
            }
        }

        // JHS/LES: fall back to student_category
        $category = $application->student_category;

        return Program::active()->where('code', $category)->first();
    }

    /**
     * Confirm student enrollment.
     */
    public function confirmEnrollment(Request $request)
    {
        $student = $this->getStudent();
        $personalData = $student->personalData;
        $application = $student->application;

        if (!$application) {
            return back()->withErrors(['error' => 'No application found.']);
        }

        // Check if already enrolled
        if (strtolower($application->application_status) === 'enrolled') {
            return back()->withErrors(['error' => 'You are already enrolled.']);
        }

        // Get or create student record
        $studentRecord = $personalData->student;

        if (!$studentRecord) {
            // Create new student record
            $studentRecord = Student::create([
                'applicant_personal_data_id' => $personalData->id,
                'applicant_application_info_id' => $application->id,
                'enrollment_status' => 'Active',
                'enrollment_date' => now(),
                'current_year_level' => $application->year_level,
                'current_school_year' => $application->school_year,
            ]);
        } else {
            // Update existing record
            $studentRecord->update([
                'enrollment_status' => 'Active',
                'enrollment_date' => now(),
            ]);
        }

        // Update application status
        $application->update([
            'application_status' => 'Enrolled',
        ]);

        return back()->with('success', 'Congratulations! Your enrollment has been confirmed successfully.');
    }

    /**
     * Process student enrollment with subject selection and fee calculation.
     */
    public function processEnrollment(Request $request)
    {
        $student = $this->getStudent();
        $personalData = $student->personalData;
        $application = $student->application;

        if (!$application) {
            return back()->withErrors(['error' => 'No application found.']);
        }

        // Check if already enrolled
        if (strtolower($application->application_status) === 'enrolled') {
            return back()->withErrors(['error' => 'You are already enrolled.']);
        }

        $validated = $request->validate([
            'selection_type' => ['required', 'in:block'],
            'block_section_id' => ['required', 'exists:block_sections,id'],
            'discount_ids' => ['nullable', 'array'],
            'discount_ids.*' => ['exists:discount_types,id'],
            'payment_method' => ['required', 'in:full,installment'],
            'total_amount' => ['required', 'numeric', 'min:0'],
        ]);

        // Get or create student record
        $studentRecord = $personalData->student;

        if (!$studentRecord) {
            // Create new student record
            $studentRecord = Student::create([
                'applicant_personal_data_id' => $personalData->id,
                'applicant_application_info_id' => $application->id,
                'enrollment_status' => 'Active',
                'enrollment_date' => now(),
                'current_year_level' => $application->year_level,
                'current_semester' => $application->semester ?? 'First',
                'current_school_year' => $application->school_year,
            ]);
        } else {
            // Update existing record
            $studentRecord->update([
                'enrollment_status' => 'Active',
                'enrollment_date' => now(),
                'current_year_level' => $application->year_level,
                'current_semester' => $application->semester ?? 'First',
                'current_school_year' => $application->school_year,
            ]);
        }

        // Create enrollment history record
        $studentCategory = $this->getStudentCategory($application->year_level);

        $enrollment = StudentEnrollment::create([
            'student_id' => $studentRecord->id,
            'block_section_id' => $validated['block_section_id'],
            'school_year' => $application->school_year,
            'semester' => $application->semester ?? 'First',
            'year_level' => $application->year_level,
            'student_category' => $studentCategory,
            'enrollment_date' => now(),
            'status' => 'Enrolled',
        ]);

        // Increment enrollment count and add subjects for the selected block section
        if ($validated['block_section_id']) {
            $blockSection = BlockSection::with('subjects')->find($validated['block_section_id']);
            if ($blockSection) {
                $blockSection->incrementEnrollment();

                // Add all block section subjects to enrollment history
                foreach ($blockSection->subjects as $subject) {
                    StudentEnrollmentSubject::create([
                        'student_enrollment_id' => $enrollment->id,
                        'subject_id' => $subject->id,
                        'units' => $subject->units,
                        'schedule' => $subject->schedule ?? null,
                        'room' => $subject->room ?? null,
                        'teacher' => $subject->faculty?->name ?? null,
                    ]);
                }

                // Update total units
                $enrollment->update(['total_units' => $blockSection->subjects->sum('units')]);
            }
        }

        // Update application status
        $application->update([
            'application_status' => 'Enrolled',
        ]);

        return redirect()->route('student.enrollment')
            ->with('success', 'Congratulations! Your enrollment has been confirmed successfully. Please proceed to the Finance Office for payment.');
    }

    /**
     * Show the student personal info page.
     */
    public function personalInfo(): Response
    {
        $student = $this->getStudent();
        $personalData = $student->personalData;
        $familyBackground = $personalData ? $personalData->familyBackground : null;

        return Inertia::render('Student/PersonalInfo', [
            'student' => [
                'id' => $student->id,
                'username' => $student->username,
            ],
            'personalData' => $personalData ? [
                'id' => $personalData->id,
                'first_name' => $personalData->first_name,
                'last_name' => $personalData->last_name,
                'middle_name' => $personalData->middle_name,
                'suffix' => $personalData->suffix,
                'gender' => $personalData->gender,
                'citizenship' => $personalData->citizenship,
                'religion' => $personalData->religion,
                'date_of_birth' => $personalData->date_of_birth,
                'place_of_birth' => $personalData->place_of_birth,
                'email' => $personalData->email,
                'alt_email' => $personalData->alt_email,
                'mobile_number' => $personalData->mobile_number,
                'present_street' => $personalData->present_street,
                'present_brgy' => $personalData->present_brgy,
                'present_city' => $personalData->present_city,
                'present_province' => $personalData->present_province,
                'present_zip' => $personalData->present_zip,
                'permanent_street' => $personalData->permanent_street,
                'permanent_brgy' => $personalData->permanent_brgy,
                'permanent_city' => $personalData->permanent_city,
                'permanent_province' => $personalData->permanent_province,
                'permanent_zip' => $personalData->permanent_zip,
            ] : null,
            'familyBackground' => $familyBackground ? [
                'father_fname' => $familyBackground->father_fname,
                'father_lname' => $familyBackground->father_lname,
                'father_occupation' => $familyBackground->father_occupation,
                'father_contact_no' => $familyBackground->father_contact_no,
                'father_email' => $familyBackground->father_email,
                'mother_fname' => $familyBackground->mother_fname,
                'mother_lname' => $familyBackground->mother_lname,
                'mother_occupation' => $familyBackground->mother_occupation,
                'mother_contact_no' => $familyBackground->mother_contact_no,
                'mother_email' => $familyBackground->mother_email,
                'guardian_fname' => $familyBackground->guardian_fname,
                'guardian_lname' => $familyBackground->guardian_lname,
                'guardian_relationship' => $familyBackground->guardian_relationship,
                'guardian_occupation' => $familyBackground->guardian_occupation,
                'guardian_contact_no' => $familyBackground->guardian_contact_no,
                'guardian_email' => $familyBackground->guardian_email,
            ] : null,
        ]);
    }

    /**
     * Update student personal info.
     */
    public function updatePersonalInfo(Request $request)
    {
        $student = $this->getStudent();
        $personalData = $student->personalData;

        if (! $personalData) {
            return back()->withErrors(['error' => 'Personal data not found.']);
        }

        // Only allow updating contact information and addresses
        $validated = $request->validate([
            'alt_email' => ['nullable', 'email'],
            'mobile_number' => ['nullable', 'string', 'max:20'],
            'present_street' => ['nullable', 'string', 'max:255'],
            'present_brgy' => ['nullable', 'string', 'max:255'],
            'present_city' => ['nullable', 'string', 'max:255'],
            'present_province' => ['nullable', 'string', 'max:255'],
            'present_zip' => ['nullable', 'string', 'max:10'],
            'permanent_street' => ['nullable', 'string', 'max:255'],
            'permanent_brgy' => ['nullable', 'string', 'max:255'],
            'permanent_city' => ['nullable', 'string', 'max:255'],
            'permanent_province' => ['nullable', 'string', 'max:255'],
            'permanent_zip' => ['nullable', 'string', 'max:10'],
        ]);

        $personalData->update($validated);

        return back()->with('success', 'Personal information updated successfully.');
    }

    /**
     * Show the change password form.
     */
    public function changePasswordForm(): Response
    {
        $student = $this->getStudent();

        return Inertia::render('Student/ChangePassword', [
            'student' => [
                'id' => $student->id,
                'username' => $student->username,
                'password_changed' => $student->password_changed,
            ],
        ]);
    }

    /**
     * Change the student password.
     */
    public function changePassword(Request $request)
    {
        $student = $this->getStudent();

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        // Verify current password
        if (! Hash::check($validated['current_password'], $student->temporary_password)) {
            return back()->withErrors(['current_password' => 'The current password is incorrect.']);
        }

        // Update password
        $student->update([
            'temporary_password' => Hash::make($validated['password']),
            'password_changed' => true,
        ]);

        return back()->with('success', 'Password changed successfully.');
    }
}
