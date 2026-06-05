<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Services\Student\CopyApplicantDataService;
use App\Models\Attendance;
use App\Models\ApplicantAssessment;
use App\Models\BlockSection;
use App\Models\StudentEnrollment;
use App\Models\ApplicantDocuments;
use App\Models\ApplicantEducationalBackground;
use App\Models\ApplicantFamilyBackground;
use App\Models\ApplicantSiblings;
use App\Models\DiscountType;
use App\Models\EnrollmentPeriod;
use App\Models\Fee;
use App\Models\Program;
use App\Models\Student;
use App\Models\StudentAssessment;
use App\Models\StudentFamilyBackground;
use App\Models\StudentPersonalData;
use App\Models\StudentDocuments;
use App\Models\StudentSiblings;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
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
     * Show the applicant dashboard (pre-enrollment).
     */
    public function applicantDashboard(): Response|\Illuminate\Http\RedirectResponse
    {
        $student = $this->getStudent();
        $personalData = $student->personalData;
        $studentRecord = $personalData?->student;

        if ($studentRecord) {
            return redirect()->route('student.dashboard');
        }

        $application = $student->application;
        $announcements = $this->getAnnouncements();

        $examAssignment = $application?->examAssignment()->with('examSchedule.examinationRoom')->first();
        $examSchedule   = $examAssignment?->examSchedule;

        return Inertia::render('Applicant/Dashboard', [
            'announcements' => $announcements,
            'student' => [
                'id' => $student->id,
                'username' => $student->username,
                'password_changed' => $student->password_changed,
            ],
            'personalData' => $personalData ? [
                'id' => $personalData->id,
                'first_name' => $personalData->first_name,
                'last_name' => $personalData->last_name,
                'middle_name' => $personalData->middle_name,
                'suffix' => $personalData->suffix,
                'email' => $personalData->email,
            ] : null,
            'application' => $application ? [
                'id' => $application->id,
                'application_number' => $application->application_number,
                'school_year' => $application->school_year,
                'semester' => $application->semester,
                'grade_level' => $application->year_level,
                'strand' => $application->strand,
                'student_category' => $application->student_category,
                'application_status' => $application->application_status,
                'date_applied' => $application->application_date,
                'examination_date' => $application->examination_date,
                'remarks' => $application->remarks,
            ] : null,
            'examSchedule' => $examSchedule ? [
                'name'          => $examSchedule->name,
                'exam_type'     => $examSchedule->exam_type,
                'exam_date'     => $examSchedule->exam_date?->format('Y-m-d'),
                'start_time'    => $examSchedule->start_time,
                'end_time'      => $examSchedule->end_time,
                'instructions'  => $examSchedule->instructions,
                'room_name'     => $examSchedule->examinationRoom?->name,
                'room_building' => $examSchedule->examinationRoom?->building,
                'room_floor'    => $examSchedule->examinationRoom?->floor,
                'status'        => $examAssignment->status,
            ] : null,
        ]);
    }

    /**
     * Show the enrolled student dashboard.
     */
    public function dashboard(): Response|\Illuminate\Http\RedirectResponse
    {
        $student = $this->getStudent();
        $personalData = $student->personalData;
        $studentRecord = $personalData ? $personalData->student : null;

        if (!$studentRecord) {
            return redirect()->route('applicant.dashboard');
        }

        $application = $student->application;
        $announcements = $this->getAnnouncements();

        return Inertia::render('Student/Dashboard', [
            'announcements' => $announcements,
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
            ] : null,
            'application' => $application ? [
                'id' => $application->id,
                'application_number' => $application->application_number,
                'school_year' => $application->school_year,
                'semester' => $application->semester,
                'grade_level' => $application->year_level,
                'strand' => $application->strand,
                'student_category' => $application->student_category,
                'application_status' => $application->application_status,
            ] : null,
            'studentRecord' => [
                'id' => $studentRecord->id,
                'student_id_number' => $studentRecord->student_id_number,
                'enrollment_status' => $studentRecord->enrollment_status,
                'enrollment_date' => $studentRecord->enrollment_date,
            ],
        ]);
    }

    private function getAnnouncements()
    {
        $now = now();
        return \App\Models\Announcement::where(function ($q) use ($now) {
                $q->whereNull('publish_start')->orWhere('publish_start', '<=', $now);
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('publish_end')->orWhere('publish_end', '>=', $now);
            })
            ->orderByDesc('publish_start')
            ->get(['announcement_id', 'title', 'content', 'attachment', 'publish_start']);
    }

    /**
     * Show the applicant personal information page (full edit form).
     */
    public function applicantPersonalInfo(): Response|\Illuminate\Http\RedirectResponse
    {
        $student = $this->getStudent();
        $personalData = $student->personalData;
        $studentRecord = $personalData?->student;

        if ($studentRecord) {
            return redirect()->route('student.personal-info');
        }

        $application    = $student->application;
        $familyBg       = $personalData?->familyBackground;
        $siblings       = $personalData?->siblings ?? collect();
        $eduBg          = $application?->educationalBackground ?? collect();
        $documents      = $application?->documents;

        return Inertia::render('Applicant/PersonalInfo', [
            'personalData' => $personalData ? [
                'first_name'               => $personalData->first_name,
                'last_name'                => $personalData->last_name,
                'middle_name'              => $personalData->middle_name,
                'suffix'                   => $personalData->suffix,
                'gender'                   => $personalData->gender,
                'citizenship'              => $personalData->citizenship,
                'religion'                 => $personalData->religion,
                'date_of_birth'            => $personalData->date_of_birth?->format('Y-m-d'),
                'place_of_birth'           => $personalData->place_of_birth,
                'learner_reference_number' => $personalData->learner_reference_number,
                'email'                    => $personalData->email,
                'alt_email'                => $personalData->alt_email,
                'mobile_number'            => $personalData->mobile_number,
                'present_street'           => $personalData->present_street,
                'present_brgy'             => $personalData->present_brgy,
                'present_city'             => $personalData->present_city,
                'present_province'         => $personalData->present_province,
                'present_zip'              => $personalData->present_zip,
                'permanent_street'         => $personalData->permanent_street,
                'permanent_brgy'           => $personalData->permanent_brgy,
                'permanent_city'           => $personalData->permanent_city,
                'permanent_province'       => $personalData->permanent_province,
                'permanent_zip'            => $personalData->permanent_zip,
                'stopped_studying'         => $personalData->stopped_studying,
                'accelerated'              => $personalData->accelerated,
                'health_conditions'        => $personalData->health_conditions ?? [],
                'has_doctors_note'         => $personalData->has_doctors_note,
                'doctors_note_file'        => $personalData->doctors_note_file,
            ] : null,
            'familyBackground' => $familyBg ? [
                'father_lname'            => $familyBg->father_lname,
                'father_fname'            => $familyBg->father_fname,
                'father_mname'            => $familyBg->father_mname,
                'father_living'           => $familyBg->father_living,
                'father_citizenship'      => $familyBg->father_citizenship,
                'father_religion'         => $familyBg->father_religion,
                'father_highest_educ'     => $familyBg->father_highest_educ,
                'father_occupation'       => $familyBg->father_occupation,
                'father_income'           => $familyBg->father_income,
                'father_business_emp'     => $familyBg->father_business_emp,
                'father_business_address' => $familyBg->father_business_address,
                'father_contact_no'       => $familyBg->father_contact_no,
                'father_email'            => $familyBg->father_email,
                'father_slu_employee'     => $familyBg->father_slu_employee,
                'father_slu_dept'         => $familyBg->father_slu_dept,
                'mother_lname'            => $familyBg->mother_lname,
                'mother_fname'            => $familyBg->mother_fname,
                'mother_mname'            => $familyBg->mother_mname,
                'mother_living'           => $familyBg->mother_living,
                'mother_citizenship'      => $familyBg->mother_citizenship,
                'mother_religion'         => $familyBg->mother_religion,
                'mother_highest_educ'     => $familyBg->mother_highest_educ,
                'mother_occupation'       => $familyBg->mother_occupation,
                'mother_income'           => $familyBg->mother_income,
                'mother_business_emp'     => $familyBg->mother_business_emp,
                'mother_business_address' => $familyBg->mother_business_address,
                'mother_contact_no'       => $familyBg->mother_contact_no,
                'mother_email'            => $familyBg->mother_email,
                'mother_slu_employee'     => $familyBg->mother_slu_employee,
                'mother_slu_dept'         => $familyBg->mother_slu_dept,
                'guardian_lname'          => $familyBg->guardian_lname,
                'guardian_fname'          => $familyBg->guardian_fname,
                'guardian_mname'          => $familyBg->guardian_mname,
                'guardian_relationship'   => $familyBg->guardian_relationship,
                'guardian_citizenship'    => $familyBg->guardian_citizenship,
                'guardian_religion'       => $familyBg->guardian_religion,
                'guardian_highest_educ'   => $familyBg->guardian_highest_educ,
                'guardian_occupation'     => $familyBg->guardian_occupation,
                'guardian_income'         => $familyBg->guardian_income,
                'guardian_business_emp'   => $familyBg->guardian_business_emp,
                'guardian_business_address' => $familyBg->guardian_business_address,
                'guardian_contact_no'     => $familyBg->guardian_contact_no,
                'guardian_email'          => $familyBg->guardian_email,
                'guardian_slu_employee'   => $familyBg->guardian_slu_employee,
                'guardian_slu_dept'       => $familyBg->guardian_slu_dept,
                'emergency_contact_name'  => $familyBg->emergency_contact_name,
                'emergency_relationship'  => $familyBg->emergency_relationship,
                'emergency_home_phone'    => $familyBg->emergency_home_phone,
                'emergency_mobile_phone'  => $familyBg->emergency_mobile_phone,
                'emergency_email'         => $familyBg->emergency_email,
            ] : null,
            'siblings' => $siblings->map(fn($s) => [
                'sibling_full_name'   => $s->sibling_full_name,
                'sibling_grade_level' => $s->sibling_grade_level,
                'sibling_id_number'   => $s->sibling_id_number,
            ])->values()->toArray(),
            'educationalBackground' => $eduBg->map(fn($e) => [
                'school_name'    => $e->school_name,
                'school_address' => $e->school_address,
                'from_grade'     => $e->from_grade,
                'to_grade'       => $e->to_grade,
                'from_year'      => $e->from_year,
                'to_year'        => $e->to_year,
                'honors_awards'  => $e->honors_awards,
                'general_average'=> $e->general_average,
                'class_rank'     => $e->class_rank,
                'class_size'     => $e->class_size,
            ])->values()->toArray(),
            'documents' => $documents ? [
                'certificate_of_enrollment'  => $documents->certificate_of_enrollment,
                'birth_certificate'          => $documents->birth_certificate,
                'latest_report_card_front'   => $documents->latest_report_card_front,
                'latest_report_card_back'    => $documents->latest_report_card_back,
            ] : null,
        ]);
    }

    /**
     * Save all applicant information including documents, siblings, and educational background.
     */
    public function applicantUpdatePersonalInfo(Request $request): \Illuminate\Http\RedirectResponse
    {
        $student     = $this->getStudent();
        $personalData = $student->personalData;

        if (!$personalData) {
            return back()->withErrors(['error' => 'Personal data not found.']);
        }

        $application = $student->application;

        $request->validate([
            // Contact (editable)
            'email'                    => ['required', 'email', 'max:255', Rule::unique('applicant_personal_data', 'email')->ignore($personalData->id)],
            'alt_email'                => ['nullable', 'email', 'max:255'],
            'mobile_number'            => ['nullable', 'string', 'max:20'],
            // Addresses (editable)
            'present_street'           => ['nullable', 'string', 'max:255'],
            'present_brgy'             => ['nullable', 'string', 'max:255'],
            'present_city'             => ['nullable', 'string', 'max:255'],
            'present_province'         => ['nullable', 'string', 'max:255'],
            'present_zip'              => ['nullable', 'string', 'max:10'],
            'permanent_street'         => ['nullable', 'string', 'max:255'],
            'permanent_brgy'           => ['nullable', 'string', 'max:255'],
            'permanent_city'           => ['nullable', 'string', 'max:255'],
            'permanent_province'       => ['nullable', 'string', 'max:255'],
            'permanent_zip'            => ['nullable', 'string', 'max:10'],
            // Academic (editable)
            'stopped_studying'         => ['nullable', 'string', 'max:255'],
            'accelerated'              => ['nullable', 'string', 'max:255'],
            'health_conditions'        => ['nullable', 'array'],
            'health_conditions.*'      => ['string'],
            'has_doctors_note'         => ['nullable', 'string'],
            'doctors_note_file'        => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'father_lname'             => ['nullable', 'string', 'max:100'],
            'father_fname'             => ['nullable', 'string', 'max:100'],
            'father_mname'             => ['nullable', 'string', 'max:100'],
            'father_living'            => ['nullable', 'string', 'max:20'],
            'father_citizenship'       => ['nullable', 'string', 'max:100'],
            'father_religion'          => ['nullable', 'string', 'max:100'],
            'father_highest_educ'      => ['nullable', 'string', 'max:100'],
            'father_occupation'        => ['nullable', 'string', 'max:255'],
            'father_income'            => ['nullable', 'numeric'],
            'father_business_emp'      => ['nullable', 'string', 'max:255'],
            'father_business_address'  => ['nullable', 'string', 'max:255'],
            'father_contact_no'        => ['nullable', 'string', 'max:20'],
            'father_email'             => ['nullable', 'email', 'max:255'],
            'father_slu_employee'      => ['nullable', 'string'],
            'father_slu_dept'          => ['nullable', 'string', 'max:255'],
            'mother_lname'             => ['nullable', 'string', 'max:100'],
            'mother_fname'             => ['nullable', 'string', 'max:100'],
            'mother_mname'             => ['nullable', 'string', 'max:100'],
            'mother_living'            => ['nullable', 'string', 'max:20'],
            'mother_citizenship'       => ['nullable', 'string', 'max:100'],
            'mother_religion'          => ['nullable', 'string', 'max:100'],
            'mother_highest_educ'      => ['nullable', 'string', 'max:100'],
            'mother_occupation'        => ['nullable', 'string', 'max:255'],
            'mother_income'            => ['nullable', 'numeric'],
            'mother_business_emp'      => ['nullable', 'string', 'max:255'],
            'mother_business_address'  => ['nullable', 'string', 'max:255'],
            'mother_contact_no'        => ['nullable', 'string', 'max:20'],
            'mother_email'             => ['nullable', 'email', 'max:255'],
            'mother_slu_employee'      => ['nullable', 'string'],
            'mother_slu_dept'          => ['nullable', 'string', 'max:255'],
            'guardian_lname'           => ['nullable', 'string', 'max:100'],
            'guardian_fname'           => ['nullable', 'string', 'max:100'],
            'guardian_mname'           => ['nullable', 'string', 'max:100'],
            'guardian_relationship'    => ['nullable', 'string', 'max:100'],
            'guardian_citizenship'     => ['nullable', 'string', 'max:100'],
            'guardian_religion'        => ['nullable', 'string', 'max:100'],
            'guardian_highest_educ'    => ['nullable', 'string', 'max:100'],
            'guardian_occupation'      => ['nullable', 'string', 'max:255'],
            'guardian_income'          => ['nullable', 'numeric'],
            'guardian_business_emp'    => ['nullable', 'string', 'max:255'],
            'guardian_business_address'=> ['nullable', 'string', 'max:255'],
            'guardian_contact_no'      => ['nullable', 'string', 'max:20'],
            'guardian_email'           => ['nullable', 'email', 'max:255'],
            'guardian_slu_employee'    => ['nullable', 'string'],
            'guardian_slu_dept'        => ['nullable', 'string', 'max:255'],
            'emergency_contact_name'   => ['nullable', 'string', 'max:255'],
            'emergency_relationship'   => ['nullable', 'string', 'max:100'],
            'emergency_home_phone'     => ['nullable', 'string', 'max:20'],
            'emergency_mobile_phone'   => ['nullable', 'string', 'max:20'],
            'emergency_email'          => ['nullable', 'email', 'max:255'],
            'siblings'                 => ['nullable', 'array'],
            'siblings.*.sibling_full_name'   => ['required_with:siblings', 'string', 'max:255'],
            'siblings.*.sibling_grade_level' => ['nullable', 'string', 'max:50'],
            'siblings.*.sibling_id_number'   => ['nullable', 'string', 'max:50'],
            'schools'                  => ['nullable', 'array'],
            'schools.*.school_name'    => ['required_with:schools', 'string', 'max:255'],
            'schools.*.school_address' => ['nullable', 'string', 'max:255'],
            'schools.*.from_grade'     => ['nullable', 'string', 'max:50'],
            'schools.*.to_grade'       => ['nullable', 'string', 'max:50'],
            'schools.*.from_year'      => ['nullable', 'string', 'max:10'],
            'schools.*.to_year'        => ['nullable', 'string', 'max:10'],
            'schools.*.honors_awards'  => ['nullable', 'string', 'max:255'],
            'schools.*.general_average'=> ['nullable', 'string', 'max:10'],
            'schools.*.class_rank'     => ['nullable', 'string', 'max:10'],
            'schools.*.class_size'     => ['nullable', 'string', 'max:10'],
            'certificate_of_enrollment'  => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'birth_certificate'          => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'latest_report_card_front'   => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'latest_report_card_back'    => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ]);

        DB::transaction(function () use ($request, $personalData, $application) {
            $healthConditions = $request->input('health_conditions', []);

            $pdUpdate = $request->only([
                'email', 'alt_email', 'mobile_number',
                'present_street', 'present_brgy', 'present_city', 'present_province', 'present_zip',
                'permanent_street', 'permanent_brgy', 'permanent_city', 'permanent_province', 'permanent_zip',
                'stopped_studying', 'accelerated',
            ]);
            $pdUpdate['health_conditions'] = !empty($healthConditions) ? $healthConditions : null;
            $pdUpdate['has_doctors_note']  = $request->boolean('has_doctors_note');

            if ($request->hasFile('doctors_note_file')) {
                $pdUpdate['doctors_note_file'] = $request->file('doctors_note_file')
                    ->store('documents/doctors_notes', 'public');
            }

            $personalData->update($pdUpdate);

            $fbData = $request->only([
                'father_lname', 'father_fname', 'father_mname', 'father_living',
                'father_citizenship', 'father_religion', 'father_highest_educ',
                'father_occupation', 'father_income', 'father_business_emp', 'father_business_address',
                'father_contact_no', 'father_email', 'father_slu_dept',
                'mother_lname', 'mother_fname', 'mother_mname', 'mother_living',
                'mother_citizenship', 'mother_religion', 'mother_highest_educ',
                'mother_occupation', 'mother_income', 'mother_business_emp', 'mother_business_address',
                'mother_contact_no', 'mother_email', 'mother_slu_dept',
                'guardian_lname', 'guardian_fname', 'guardian_mname', 'guardian_relationship',
                'guardian_citizenship', 'guardian_religion', 'guardian_highest_educ',
                'guardian_occupation', 'guardian_income', 'guardian_business_emp', 'guardian_business_address',
                'guardian_contact_no', 'guardian_email', 'guardian_slu_dept',
                'emergency_contact_name', 'emergency_relationship',
                'emergency_home_phone', 'emergency_mobile_phone', 'emergency_email',
            ]);
            $fbData['father_slu_employee']   = $request->input('father_slu_employee') === 'true';
            $fbData['mother_slu_employee']   = $request->input('mother_slu_employee') === 'true';
            $fbData['guardian_slu_employee'] = $request->input('guardian_slu_employee') === 'true';

            ApplicantFamilyBackground::updateOrCreate(
                ['applicant_personal_data_id' => $personalData->id],
                $fbData
            );

            $personalData->siblings()->delete();
            foreach ($request->input('siblings', []) as $sibling) {
                if (!empty($sibling['sibling_full_name'])) {
                    $personalData->siblings()->create($sibling);
                }
            }

            if ($application) {
                $application->educationalBackground()->delete();
                foreach ($request->input('schools', []) as $school) {
                    if (!empty($school['school_name'])) {
                        $application->educationalBackground()->create($school);
                    }
                }

                $docFields = [
                    'certificate_of_enrollment' => 'COE',
                    'birth_certificate'         => 'BIRTHCERTIFICATE',
                    'latest_report_card_front'  => 'REPORTCARD_FRONT',
                    'latest_report_card_back'   => 'REPORTCARD_BACK',
                ];
                $docData = [];
                foreach ($docFields as $field => $label) {
                    if ($request->hasFile($field)) {
                        $file    = $request->file($field);
                        $ext     = $file->getClientOriginalExtension();
                        $last    = preg_replace('/[^A-Z0-9]/', '', strtoupper($personalData->last_name));
                        $first   = preg_replace('/[^A-Z0-9]/', '', strtoupper($personalData->first_name));
                        $appNum  = preg_replace('/[^A-Z0-9]/', '', strtoupper($application->application_number ?? 'APP'));
                        $docData[$field] = $file->storeAs('documents', "{$appNum}_{$last}_{$first}_{$label}.{$ext}", 'public');
                    }
                }
                if (!empty($docData)) {
                    ApplicantDocuments::updateOrCreate(['applicant_id' => $application->id], $docData);
                }
            }
        });

        return back()->with('success', 'Information updated successfully.');
    }

    /**
     * Applicant enrollment page — 3-step wizard (no submit).
     * Applicants view auto-calculated fees, update info, and choose payment preferences.
     */
    public function applicantEnrollment(): Response|\Illuminate\Http\RedirectResponse
    {
        $student      = $this->getStudent();
        $personalData = $student->personalData;
        $application  = $student->application;

        // Enrolled students should use the student portal
        if ($personalData?->student) {
            return redirect()->route('student.enrollment');
        }

        $fees               = $application
            ? $this->getApplicableFees($application->year_level, $application->school_year)
            : [];
        $availableDiscounts = $this->getAvailableDiscounts();

        return Inertia::render('Applicant/Enrollment', [
            'personalData'       => $this->formatPersonalDataResponse($personalData),
            'application'        => $this->formatApplicationResponse($application),
            'fees'               => $fees,
            'availableDiscounts' => $availableDiscounts,
            'enrollmentOpen'     => EnrollmentPeriod::hasOpenApplicantPeriod(),
            'assessmentNumber'   => $application?->assessment?->assessment_number,
        ]);
    }

    /**
     * Generate an ApplicantAssessment when the applicant completes step 2.
     * Idempotent — does nothing if assessment already exists.
     */
    public function generateApplicantAssessment(): \Illuminate\Http\RedirectResponse
    {
        $student     = $this->getStudent();
        $application = $student->application;

        if (!$application || $application->application_status !== 'Exam Passed') {
            return back()->withErrors(['error' => 'Not eligible for enrollment.']);
        }

        if ($application->assessment()->exists()) {
            return back()->with('success', 'Assessment already generated.');
        }

        $fees    = $this->getApplicableFees($application->year_level, $application->school_year);
        $program = $this->resolveProgram($application);
        $units   = $program?->max_load ?? 0;

        $calc     = fn (string $cat) => collect($fees)
            ->filter(fn ($f) => $f['category'] === $cat)
            ->sum(fn ($f) => $f['is_per_unit'] ? $f['amount'] * $units : $f['amount']);

        $tTuition = $calc('tuition');
        $tMisc    = $calc('miscellaneous');
        $tLab     = $calc('laboratory');
        $tOther   = $calc('special');
        $gross    = $tTuition + $tMisc + $tLab + $tOther;
        $net      = $gross;
        $minimum  = round($net * 0.30, 2);

        ApplicantAssessment::create([
            'applicant_id'      => $application->id,
            'assessment_number' => ApplicantAssessment::generateAssessmentNumber($application->school_year),
            'school_year'       => $application->school_year,
            'semester'          => $application->semester ?? 'First Semester',
            'total_tuition'     => $tTuition,
            'total_misc_fees'   => $tMisc,
            'total_lab_fees'    => $tLab,
            'total_other_fees'  => $tOther,
            'gross_amount'      => $gross,
            'total_discounts'   => 0,
            'net_amount'        => $net,
            'minimum_amount'    => $minimum,
            'mode_of_payment'   => 'cash',
            'status'            => 'pending',
            'generated_at'      => now(),
        ]);

        return back()->with('success', 'Assessment generated.');
    }

    /**
     * Show the student enrollment page.
     * Students who have an assessment awaiting payment see their assessment status.
     * Enrolled students see their enrollment confirmation.
     */
    public function enrollment(): Response
    {
        $student          = $this->getStudent();
        $personalData     = $student->personalData;
        $application      = $student->application;
        $studentRecord    = $personalData?->student;
        $familyBackground = $personalData?->familyBackground;

        // Use the current open enrollment period as the target so that when a
        // new semester opens the student sees the correct status/wizard.
        $currentPeriod = EnrollmentPeriod::current();
        $targetYear    = $currentPeriod?->school_year ?? $application?->school_year;
        $targetSem     = $currentPeriod?->semester    ?? $application?->semester ?? 'First Semester';

        $assessment    = null;
        $hasAssessment = false;
        if ($studentRecord && $targetYear) {
            $assessment = StudentAssessment::where('student_id', $studentRecord->id)
                ->where('school_year', $targetYear)
                ->where('semester', $targetSem)
                ->latest()
                ->first();
            $hasAssessment = $assessment !== null;
        }

        $isEnrolled = $hasAssessment
            && $assessment
            && (
                (float) $assessment->total_paid >= (float) $assessment->minimum_required
                || in_array($assessment->status, ['paid', 'partial'])
            );

        $awaitingPayment = $hasAssessment && !$isEnrolled;

        // Load fees for the enrollment wizard when the student hasn't enrolled yet
        $fees = (!$hasAssessment && $application && $targetYear)
            ? $this->getApplicableFees($application->year_level, $targetYear)
            : [];

        // Prior balance from a previous semester — shown in the wizard before submission
        $priorBalance = (!$hasAssessment && $studentRecord && $targetYear)
            ? $this->getStudentPriorBalance($studentRecord->id, $targetYear, $targetSem)
            : 0.0;

        return Inertia::render('Student/Enrollment', [
            'student'          => $this->formatStudentResponse($student),
            'personalData'     => $this->formatPersonalDataResponse($personalData),
            'application'      => $this->formatApplicationResponse($application),
            'studentRecord'    => $this->formatStudentRecordResponse($studentRecord),
            'isEnrolled'       => $isEnrolled,
            'awaitingPayment'  => $awaitingPayment,
            'fees'             => $fees,
            'priorBalance'     => $priorBalance,
            'enrollmentOpen'   => $targetYear ? EnrollmentPeriod::isOpenFor($targetYear, $targetSem, 'student') : false,
            'targetYear'       => $targetYear,
            'targetSemester'   => $targetSem,
            'familyBackground' => $familyBackground ? [
                'emergency_contact_name' => $familyBackground->emergency_contact_name,
                'emergency_mobile_phone' => $familyBackground->emergency_mobile_phone,
            ] : null,
            'assessment'       => $assessment ? [
                'assessment_number' => $assessment->assessment_number,
                'school_year'       => $assessment->school_year,
                'semester'          => $assessment->semester,
                'total_tuition'     => (float) $assessment->total_tuition,
                'total_misc_fees'   => (float) $assessment->total_misc_fees,
                'total_lab_fees'    => (float) $assessment->total_lab_fees,
                'total_other_fees'  => (float) $assessment->total_other_fees,
                'gross_amount'      => (float) $assessment->gross_amount,
                'total_discounts'   => (float) $assessment->total_discounts,
                'prior_balance'     => (float) $assessment->prior_balance,
                'net_amount'        => (float) $assessment->net_amount,
                'status'            => $assessment->status,
                'mode_of_payment'   => $assessment->mode_of_payment,
                'payment_plan'      => $assessment->payment_plan ?? 'full',
                'minimum_amount'    => $assessment->minimum_required,
                'total_paid'        => $assessment->total_paid,
                'finalized_at'      => $assessment->finalized_at?->format('F d, Y'),
            ] : null,
        ]);
    }

    public function mySection(): Response
    {
        $student       = $this->getStudent();
        $personalData  = $student->personalData;
        $studentRecord = $personalData?->student;
        $application   = $student->application;

        $currentPeriod = EnrollmentPeriod::current();
        $targetYear    = $currentPeriod?->school_year ?? $application?->school_year;
        $targetSem     = $currentPeriod?->semester    ?? $application?->semester ?? 'First Semester';

        $enrollment = $studentRecord
            ? StudentEnrollment::where('student_id', $studentRecord->id)
                ->where('school_year', $targetYear)
                ->where('semester', $targetSem)
                ->with('blockSection.subjects')
                ->first()
            : null;

        $blockSection = $enrollment?->blockSection;

        return Inertia::render('Student/MySection', [
            'targetYear'     => $targetYear,
            'targetSemester' => $targetSem,
            'blockSection'   => $blockSection ? [
                'name'        => $blockSection->name,
                'code'        => $blockSection->code,
                'grade_level' => $blockSection->grade_level,
                'strand'      => $blockSection->strand,
                'adviser'     => $blockSection->adviser,
                'room'        => $blockSection->room,
            ] : null,
            'subjects' => $blockSection
                ? $blockSection->subjects->map(fn ($s) => [
                    'code'  => $s->code,
                    'name'  => $s->name,
                    'units' => $s->units,
                    'type'  => $s->type,
                ])->toArray()
                : [],
        ]);
    }

    /**
     * Get applicable fees for a student category.
     */
    private function getApplicableFees(string $gradeLevel, ?string $schoolYear): array
    {
        $schoolLevel = $this->getStudentCategory($gradeLevel);

        $baseQuery = fn (string $year) => Fee::where('is_active', true)
            ->where('school_year', $year)
            ->where(function ($q) use ($schoolLevel) {
                $q->where('school_level', 'all')->orWhere('school_level', $schoolLevel);
            })
            ->orderByRaw("CASE WHEN school_level = ? THEN 0 ELSE 1 END", [$schoolLevel]);

        // Try the application's school year first; fall back to the most recent available year.
        $fees = $schoolYear ? $baseQuery($schoolYear)->get() : collect();

        if ($fees->isEmpty()) {
            $latestYear = Fee::where('is_active', true)->max('school_year');
            $fees = $latestYear ? $baseQuery($latestYear)->get() : collect();
        }

        return $fees->map(fn ($fee) => [
            'id'          => $fee->id,
            'name'        => $fee->name,
            'code'        => $fee->code,
            'category'    => $fee->category,
            'is_per_unit' => $fee->is_per_unit,
            'amount'      => (float) $fee->amount,
        ])->toArray();
    }

    /**
     * Get discount types the current applicant is eligible for.
     */
    private function getAvailableDiscounts(): array
    {
        return DiscountType::where('is_active', true)
            ->get()
            ->filter(function ($discount) {
                if ($discount->code === 'SIBLING') {
                    return $this->hasEnrolledSibling();
                }
                return true;
            })
            ->values()
            ->map(fn ($discount) => [
                'id'            => $discount->id,
                'name'          => $discount->name,
                'code'          => $discount->code,
                'discount_type' => $discount->discount_type,
                'value'         => (float) $discount->value,
                'applies_to'    => $discount->applies_to,
            ])->toArray();
    }

    private function getStudentPriorBalance(int $studentId, string $targetYear, string $targetSem): float
    {
        $previous = StudentAssessment::where('student_id', $studentId)
            ->where(function ($q) use ($targetYear, $targetSem) {
                $q->where('school_year', '!=', $targetYear)
                  ->orWhere('semester', '!=', $targetSem);
            })
            ->whereIn('status', ['finalized', 'partial'])
            ->latest()
            ->first();

        if (!$previous) {
            return 0.0;
        }

        return $previous->remaining_balance;
    }

    private function hasEnrolledSibling(): bool
    {
        $student  = $this->getStudent();
        $siblings = $student->personalData?->siblings ?? collect();

        foreach ($siblings as $sibling) {
            if (!empty($sibling->sibling_id_number)) {
                if (Student::where('student_id_number', $sibling->sibling_id_number)
                    ->where('enrollment_status', 'Active')
                    ->exists()) {
                    return true;
                }
            }

            if (!empty($sibling->sibling_full_name)) {
                if (Student::whereHas('personalData', function ($q) use ($sibling) {
                    $q->whereRaw("first_name || ' ' || last_name = ?", [trim($sibling->sibling_full_name)]);
                })->where('enrollment_status', 'Active')->exists()) {
                    return true;
                }
            }
        }

        return false;
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
            'id'               => $personalData->id,
            'first_name'       => $personalData->first_name,
            'last_name'        => $personalData->last_name,
            'middle_name'      => $personalData->middle_name,
            'email'            => $personalData->email,
            'mobile_number'    => $personalData->mobile_number,
            'present_street'   => $personalData->present_street,
            'present_brgy'     => $personalData->present_brgy,
            'present_city'     => $personalData->present_city,
            'present_province' => $personalData->present_province,
            'present_zip'      => $personalData->present_zip,
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
            'id'                      => $application->id,
            'application_number'      => $application->application_number,
            'school_year'             => $application->school_year,
            'semester'                => $application->semester,
            'grade_level'             => $application->year_level,
            'student_type'            => $application->student_category,
            'student_category'        => $this->getStudentCategory($application->year_level),
            'application_status'      => $application->application_status,
            'date_applied'            => $application->application_date,
            'exam_status'             => $application->exam_status,
            'exam_date'               => $application->examination_date,
            'preferred_payment_plan'  => $application->preferred_payment_plan,
            'preferred_payment_mode'  => $application->preferred_payment_mode,
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
     * Resolve the Program record for a given application.
     * SHS: extract code from strand "(ABM)", "(HUMSS)", etc.
     * JHS / LES: match by student_category code.
     */
    private function resolveProgram($application): ?Program
    {
        $strand = $application->strand ?? null;

        if ($strand) {
            $codeMap = [
                'Science, Technology, Engineering and Mathematics' => 'STEM',
                'Accountancy, Business and Management'             => 'ABM',
                'Humanities and Social Sciences'                   => 'HUMSS',
            ];
            $code    = $codeMap[$strand] ?? $strand;
            $program = Program::active()->where('code', $code)->first();
            if ($program) {
                return $program;
            }
        }

        return Program::active()->where('code', $application->student_category)->first();
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

        $currentPeriod = EnrollmentPeriod::current();
        $targetYear    = $currentPeriod?->school_year ?? $application->school_year;
        $targetSem     = $currentPeriod?->semester    ?? $application->semester ?? 'First Semester';

        if (!EnrollmentPeriod::isOpenFor($targetYear, $targetSem, 'student')) {
            return back()->withErrors(['error' => 'Enrollment is currently closed for this semester.']);
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
                'applicant_id' => $application->id,
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

        // Mirror applicant data into student_personal_data tables
        $this->copyApplicantDataToStudent($studentRecord);

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

        $currentPeriod = EnrollmentPeriod::current();
        $targetYear    = $currentPeriod?->school_year ?? $application->school_year;
        $targetSem     = $currentPeriod?->semester    ?? $application->semester ?? 'First Semester';

        if (!EnrollmentPeriod::isOpenFor($targetYear, $targetSem, 'student')) {
            return back()->withErrors(['error' => 'Enrollment is currently closed for this semester.']);
        }

        // Check if assessment already submitted for this period
        $studentRecord = $personalData?->student;
        $alreadySubmitted = $studentRecord && StudentAssessment::where('student_id', $studentRecord->id)
            ->where('school_year', $targetYear)
            ->where('semester', $targetSem)
            ->exists();

        if ($alreadySubmitted) {
            return back()->withErrors(['error' => 'Your fee assessment has already been submitted.']);
        }

        $request->validate([
            'discount_ids'    => ['nullable', 'array'],
            'discount_ids.*'  => ['exists:discount_types,id'],
            'total_amount'    => ['required', 'numeric', 'min:0'],
            'mode_of_payment' => ['nullable', 'in:cash,check,bank_transfer,gcash,maya'],
            'payment_plan'    => ['required', 'in:full,installment'],
        ]);

        // Get or create student record
        $studentRecord = $personalData->student;

        if (!$studentRecord) {
            $studentRecord = Student::create([
                'applicant_personal_data_id' => $personalData->id,
                'applicant_id'               => $application->id,
                'enrollment_status'          => 'Pending',
                'enrollment_date'            => now(),
                'current_year_level'         => $application->year_level,
                'current_semester'           => $targetSem,
                'current_school_year'        => $targetYear,
            ]);
        } else {
            $studentRecord->update([
                'enrollment_status'  => 'Pending',
                'enrollment_date'    => now(),
                'applicant_id'       => $studentRecord->applicant_id ?? $application->id,
                'current_year_level' => $application->year_level,
                'current_semester'   => $targetSem,
                'current_school_year'=> $targetYear,
            ]);
        }

        // Create assessment record (idempotent — skip if already exists)
        $existingAssessment = StudentAssessment::where('student_id', $studentRecord->id)
            ->where('school_year', $targetYear)
            ->where('semester', $targetSem)
            ->first();

        if (!$existingAssessment) {
            $assessmentFees = $this->getApplicableFees($application->year_level, $targetYear);
            $assessmentProgram = $this->resolveProgram($application);
            $assessmentUnits   = $assessmentProgram?->max_load ?? 0;

            $calcTotal = fn(string $cat) => collect($assessmentFees)
                ->filter(fn($f) => $f['category'] === $cat)
                ->sum(fn($f) => $f['is_per_unit'] ? $f['amount'] * $assessmentUnits : $f['amount']);

            $tTuition = $calcTotal('tuition');
            $tMisc    = $calcTotal('miscellaneous');
            $tLab     = $calcTotal('laboratory');
            $tOther   = $calcTotal('special');
            $gross    = $tTuition + $tMisc + $tLab + $tOther;
            $net         = (float) $request->input('total_amount', 0);
            $discount    = max(0, $gross - $net);
            $paymentPlan = $request->input('payment_plan', 'full');

            $priorBalance = $this->getStudentPriorBalance($studentRecord->id, $targetYear, $targetSem);
            $netWithPrior = $net + $priorBalance;

            $minimumAmount = $paymentPlan === 'installment'
                ? round($net * 0.30 + $priorBalance, 2)
                : $netWithPrior;

            StudentAssessment::create([
                'student_id'        => $studentRecord->id,
                'assessment_number' => StudentAssessment::generateAssessmentNumber($targetYear),
                'school_year'       => $targetYear,
                'semester'          => $targetSem,
                'total_tuition'     => $tTuition,
                'total_misc_fees'   => $tMisc,
                'total_lab_fees'    => $tLab,
                'total_other_fees'  => $tOther,
                'gross_amount'      => $gross,
                'total_discounts'   => $discount,
                'net_amount'        => $netWithPrior,
                'prior_balance'     => $priorBalance,
                'payment_plan'      => $paymentPlan,
                'minimum_amount'    => $minimumAmount,
                'mode_of_payment'   => $request->input('mode_of_payment'),
                'status'            => 'finalized',
                'generated_at'      => now(),
                'finalized_at'      => now(),
            ]);
        }

        // Update application status — 'Pending' until cashier records payment
        $application->update([
            'application_status' => 'Pending',
        ]);

        // Mirror applicant data into student_personal_data tables
        $this->copyApplicantDataToStudent($studentRecord);

        return redirect()->route('student.enrollment')
            ->with('success', 'Enrollment confirmed! Please proceed to the Finance Office to complete your payment.');
    }

    /**
     * Change the student's intended mode of payment.
     */
    public function changePaymentMode(Request $request)
    {
        $student = $this->getStudent();
        $studentRecord = $student->personalData?->student;

        if (!$studentRecord) {
            return back()->withErrors(['payment_mode' => 'No student record found.']);
        }

        $assessment = StudentAssessment::where('student_id', $studentRecord->id)->latest()->first();

        if (!$assessment || $assessment->status === 'paid') {
            return back()->withErrors(['payment_mode' => 'Cannot update payment mode once fully paid.']);
        }

        $validated = $request->validate([
            'mode_of_payment' => ['required', 'in:cash,check,bank_transfer,gcash,maya'],
        ]);

        $assessment->update(['mode_of_payment' => $validated['mode_of_payment']]);

        return back()->with('success', 'Payment mode updated successfully.');
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
            'alt_email'               => ['nullable', 'email'],
            'mobile_number'           => ['nullable', 'string', 'max:20'],
            'present_street'          => ['nullable', 'string', 'max:255'],
            'present_brgy'            => ['nullable', 'string', 'max:255'],
            'present_city'            => ['nullable', 'string', 'max:255'],
            'present_province'        => ['nullable', 'string', 'max:255'],
            'present_zip'             => ['nullable', 'string', 'max:10'],
            'permanent_street'        => ['nullable', 'string', 'max:255'],
            'permanent_brgy'          => ['nullable', 'string', 'max:255'],
            'permanent_city'          => ['nullable', 'string', 'max:255'],
            'permanent_province'      => ['nullable', 'string', 'max:255'],
            'permanent_zip'           => ['nullable', 'string', 'max:10'],
            'emergency_contact_name'  => ['nullable', 'string', 'max:255'],
            'emergency_mobile_phone'  => ['nullable', 'string', 'max:20'],
        ]);

        $personalData->update(
            collect($validated)->except(['emergency_contact_name', 'emergency_mobile_phone'])->toArray()
        );

        $familyBackground = $personalData->familyBackground;
        if ($familyBackground) {
            $familyBackground->update([
                'emergency_contact_name' => $validated['emergency_contact_name'] ?? $familyBackground->emergency_contact_name,
                'emergency_mobile_phone' => $validated['emergency_mobile_phone'] ?? $familyBackground->emergency_mobile_phone,
            ]);
        }

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

    /**
     * Copy applicant personal data into the student_personal_data tables.
     * Called after enrollment is confirmed so all students have a canonical record.
     */
    private function copyApplicantDataToStudent(Student $studentRecord): void
    {
        app(CopyApplicantDataService::class)->execute($studentRecord);
    }

    /**
     * Show the student class schedule page.
     */
    public function schedule(): Response
    {
        $student = $this->getStudent();
        $personalData = $student->personalData;
        $studentRecord = $personalData?->student;

        $enrollment = $studentRecord
            ? $studentRecord->enrollments()
                ->with(['enrollmentSubjects.subject'])
                ->latest()
                ->first()
            : null;

        $subjects = $enrollment
            ? $enrollment->enrollmentSubjects->map(fn($es) => [
                'subject_code' => $es->subject?->code,
                'subject_name' => $es->subject?->name,
                'units'        => $es->units,
                'schedule'     => $es->schedule,
                'room'         => $es->room,
                'teacher'      => $es->teacher,
                'grade_status' => $es->grade_status,
            ])->values()
            : [];

        return Inertia::render('Student/Schedule', [
            'student'    => $this->formatStudentResponse($student),
            'isEnrolled' => $studentRecord !== null,
            'enrollment' => $enrollment ? [
                'school_year'      => $enrollment->school_year,
                'semester'         => $enrollment->semester,
                'year_level'       => $enrollment->year_level,
                'student_category' => $enrollment->student_category,
                'status'           => $enrollment->status,
            ] : null,
            'subjects' => $subjects,
        ]);
    }

    /**
     * Show the student attendance page.
     *
     * Only Absent and Late records are surfaced — Present/Excused rows are
     * not actionable by the student and would add noise to the table. Each
     * row includes the record ID so the frontend can submit a reason update.
     */
    public function attendance(): Response
    {
        $student       = $this->getStudent();
        $personalData  = $student->personalData;
        $studentRecord = $personalData?->student;

        $enrollment = $studentRecord
            ? $studentRecord->enrollments()->latest()->first()
            : null;

        $attendance = [];
        if ($enrollment) {
            $attendance = Attendance::where('student_enrollment_id', $enrollment->id)
                ->whereIn('status', ['Absent', 'Late'])
                ->with('subject')
                ->orderBy('date', 'desc')
                ->get()
                ->map(fn ($a) => [
                    'id'           => $a->id,
                    'subject_code' => $a->subject?->code,
                    'subject_name' => $a->subject?->name,
                    'date'         => $a->date->format('Y-m-d'),
                    'status'       => $a->status,
                    'remarks'      => $a->remarks,  // instructor note (read-only)
                    'reason'       => $a->reason,   // student-supplied reason
                ])
                ->values()
                ->toArray();
        }

        return Inertia::render('Student/Attendance', [
            'student'    => $this->formatStudentResponse($student),
            'isEnrolled' => $studentRecord !== null,
            'enrollment' => $enrollment ? [
                'school_year' => $enrollment->school_year,
                'semester'    => $enrollment->semester,
                'year_level'  => $enrollment->year_level,
            ] : null,
            'attendance' => $attendance,
        ]);
    }

    /**
     * Let a student add or update their own reason for an absence or late mark.
     *
     * Ownership is verified by checking that the attendance row belongs to the
     * student's own enrollment — students cannot annotate other students' records.
     * The reason is stored in the existing `remarks` column.
     */
    public function updateAttendanceReason(Request $request, Attendance $attendance): \Illuminate\Http\RedirectResponse
    {
        $student       = $this->getStudent();
        $personalData  = $student->personalData;
        $studentRecord = $personalData?->student;
        $enrollment    = $studentRecord?->enrollments()->latest()->first();

        if (! $enrollment || $attendance->student_enrollment_id !== $enrollment->id) {
            abort(403, 'This attendance record does not belong to you.');
        }

        $validated = $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        $attendance->update(['reason' => $validated['reason']]);

        return back();
    }

    /**
     * Show the downloadable forms page.
     */
    public function downloadableForms(): Response
    {
        return Inertia::render('Student/DownloadableForms');
    }
}
