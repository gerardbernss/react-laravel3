<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentDocuments;
use App\Models\StudentFamilyBackground;
use App\Models\StudentPersonalData;
use App\Models\StudentSiblings;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class StudentsController extends Controller
{
    /**
     * Display a listing of all students.
     */
    public function index()
    {
        $students = Student::with('studentPersonalData')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($s) => [
                'id'                  => $s->id,
                'student_id_number'   => $s->student_id_number,
                'enrollment_status'   => $s->enrollment_status,
                'current_year_level'  => $s->current_year_level,
                'current_school_year' => $s->current_school_year,
                'current_semester'    => $s->current_semester,
                'source'              => $s->applicant_personal_data_id ? 'applicant' : 'direct',
                'personal_data'       => $s->studentPersonalData ? [
                    'first_name'  => $s->studentPersonalData->first_name,
                    'last_name'   => $s->studentPersonalData->last_name,
                    'middle_name' => $s->studentPersonalData->middle_name,
                    'suffix'      => $s->studentPersonalData->suffix,
                    'email'       => $s->studentPersonalData->email,
                    'gender'      => $s->studentPersonalData->gender,
                ] : null,
            ]);

        return Inertia::render('Admin/Students/Index', [
            'students' => $students,
        ]);
    }

    /**
     * Show the form for creating a new recurring student.
     */
    public function create()
    {
        return Inertia::render('Admin/Students/Create');
    }

    /**
     * Store a new recurring student directly (no admissions flow).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            // Personal data
            'last_name'                => 'required|string|max:100',
            'first_name'               => 'required|string|max:100',
            'middle_name'              => 'nullable|string|max:100',
            'suffix'                   => 'nullable|string|max:20',
            'learner_reference_number' => 'nullable|string|max:50',
            'gender'                   => 'required|in:Male,Female,Other',
            'citizenship'              => 'required|string|max:100',
            'religion'                 => 'required|string|max:100',
            'date_of_birth'            => 'required|date|before:today',
            'place_of_birth'           => 'nullable|string|max:255',
            'has_sibling'              => 'nullable|boolean',
            'email'                    => 'required|email|max:255|unique:student_personal_data,email',
            'alt_email'                => 'nullable|email|max:255',
            'mobile_number'            => 'required|string|max:20',
            'present_brgy'             => 'required|string|max:255',
            'present_city'             => 'required|string|max:255',
            'present_province'         => 'required|string|max:255',
            'present_zip'              => 'required|string|max:10',
            'present_street'           => 'nullable|string|max:255',
            'permanent_brgy'           => 'nullable|string|max:255',
            'permanent_city'           => 'nullable|string|max:255',
            'permanent_province'       => 'nullable|string|max:255',
            'permanent_zip'            => 'nullable|string|max:10',
            'permanent_street'         => 'nullable|string|max:255',
            'stopped_studying'         => 'nullable|string|max:50',
            'accelerated'              => 'nullable|string|max:50',
            'health_conditions'        => 'nullable',
            // Student record
            'student_id_number'        => 'nullable|string|max:50|unique:students,student_id_number',
            'current_year_level'       => 'required|string|max:50',
            'current_school_year'      => 'required|string|max:20',
            'current_semester'         => 'nullable|string|max:30',
            'enrollment_status'        => 'nullable|string|max:20',
            // Family background
            'father_lname'             => 'nullable|string|max:100',
            'father_fname'             => 'nullable|string|max:100',
            'father_mname'             => 'nullable|string|max:100',
            'father_living'            => 'nullable|string|max:20',
            'father_contact_no'        => 'nullable|string|max:20',
            'father_email'             => 'nullable|email|max:255',
            'father_occupation'        => 'nullable|string|max:255',
            'mother_lname'             => 'nullable|string|max:100',
            'mother_fname'             => 'nullable|string|max:100',
            'mother_mname'             => 'nullable|string|max:100',
            'mother_living'            => 'nullable|string|max:20',
            'mother_contact_no'        => 'nullable|string|max:20',
            'mother_email'             => 'nullable|email|max:255',
            'mother_occupation'        => 'nullable|string|max:255',
            'guardian_lname'           => 'nullable|string|max:100',
            'guardian_fname'           => 'nullable|string|max:100',
            'guardian_mname'           => 'nullable|string|max:100',
            'guardian_relationship'    => 'nullable|string|max:100',
            'guardian_contact_no'      => 'nullable|string|max:20',
            'guardian_email'           => 'nullable|email|max:255',
            'emergency_contact_name'   => 'nullable|string|max:255',
            'emergency_relationship'   => 'nullable|string|max:100',
            'emergency_mobile_phone'   => 'nullable|string|max:20',
            'emergency_home_phone'     => 'nullable|string|max:20',
            'emergency_email'          => 'nullable|email|max:255',
            // Siblings
            'siblings'                 => 'nullable|array',
            'siblings.*.sibling_full_name'   => 'required_with:siblings|string|max:255',
            'siblings.*.sibling_grade_level' => 'nullable|string|max:50',
            'siblings.*.sibling_id_number'   => 'nullable|string|max:50',
        ]);

        // Create student personal data
        $spd = StudentPersonalData::create([
            'last_name'                => $validated['last_name'],
            'first_name'               => $validated['first_name'],
            'middle_name'              => $validated['middle_name'] ?? null,
            'suffix'                   => $validated['suffix'] ?? null,
            'learner_reference_number' => $validated['learner_reference_number'] ?? null,
            'gender'                   => $validated['gender'],
            'citizenship'              => $validated['citizenship'],
            'religion'                 => $validated['religion'],
            'date_of_birth'            => $validated['date_of_birth'],
            'place_of_birth'           => $validated['place_of_birth'] ?? null,
            'has_sibling'              => $validated['has_sibling'] ?? false,
            'email'                    => $validated['email'],
            'alt_email'                => $validated['alt_email'] ?? null,
            'mobile_number'            => $validated['mobile_number'],
            'present_street'           => $validated['present_street'] ?? null,
            'present_brgy'             => $validated['present_brgy'],
            'present_city'             => $validated['present_city'],
            'present_province'         => $validated['present_province'],
            'present_zip'              => $validated['present_zip'],
            'permanent_street'         => $validated['permanent_street'] ?? null,
            'permanent_brgy'           => $validated['permanent_brgy'] ?? null,
            'permanent_city'           => $validated['permanent_city'] ?? null,
            'permanent_province'       => $validated['permanent_province'] ?? null,
            'permanent_zip'            => $validated['permanent_zip'] ?? null,
            'stopped_studying'         => $validated['stopped_studying'] ?? null,
            'accelerated'              => $validated['accelerated'] ?? null,
            'health_conditions'        => $validated['health_conditions'] ?? null,
        ]);

        // Create student record
        $student = Student::create([
            'student_personal_data_id' => $spd->id,
            'student_id_number'        => $validated['student_id_number'] ?? null,
            'current_year_level'       => $validated['current_year_level'],
            'current_school_year'      => $validated['current_school_year'],
            'current_semester'         => $validated['current_semester'] ?? null,
            'enrollment_status'        => $validated['enrollment_status'] ?? 'Active',
            'enrollment_date'          => now(),
        ]);

        // Create family background if any parent/guardian data provided
        $fbFields = array_filter(array_intersect_key($validated, array_flip([
            'father_lname', 'father_fname', 'father_mname', 'father_living', 'father_contact_no',
            'father_email', 'father_occupation', 'mother_lname', 'mother_fname', 'mother_mname',
            'mother_living', 'mother_contact_no', 'mother_email', 'mother_occupation',
            'guardian_lname', 'guardian_fname', 'guardian_mname', 'guardian_relationship',
            'guardian_contact_no', 'guardian_email', 'emergency_contact_name',
            'emergency_relationship', 'emergency_mobile_phone', 'emergency_home_phone', 'emergency_email',
        ])));

        if (!empty($fbFields)) {
            StudentFamilyBackground::create(array_merge(
                ['student_personal_data_id' => $spd->id],
                $fbFields
            ));
        }

        // Create siblings
        foreach ($validated['siblings'] ?? [] as $sibling) {
            StudentSiblings::create([
                'student_personal_data_id' => $spd->id,
                'sibling_full_name'        => $sibling['sibling_full_name'],
                'sibling_grade_level'      => $sibling['sibling_grade_level'] ?? null,
                'sibling_id_number'        => $sibling['sibling_id_number'] ?? null,
            ]);
        }

        return redirect()->route('admin.students.show', $student->id)
            ->with('success', 'Student record created successfully.');
    }

    /**
     * Display the specified student's full profile.
     */
    public function show(Student $student)
    {
        $student->load([
            'studentPersonalData.familyBackground',
            'studentPersonalData.siblings',
            'studentPersonalData.documents',
            'personalData.familyBackground',
            'personalData.siblings',
            'application.educationalBackground',
            'enrollments',
        ]);

        $spd = $student->studentPersonalData ?? $student->personalData;

        return Inertia::render('Admin/Students/Show', [
            'student' => [
                'id'                  => $student->id,
                'student_id_number'   => $student->student_id_number,
                'enrollment_status'   => $student->enrollment_status,
                'current_year_level'  => $student->current_year_level,
                'current_school_year' => $student->current_school_year,
                'current_semester'    => $student->current_semester,
                'enrollment_date'     => $student->enrollment_date,
                'source'              => $student->applicant_personal_data_id ? 'applicant' : 'direct',
            ],
            'personalData'          => $spd ? $spd->toArray() : null,
            'familyBackground'      => $spd?->familyBackground?->toArray(),
            'siblings'              => $spd?->siblings?->toArray() ?? [],
            'documents'             => $student->studentPersonalData?->documents?->toArray(),
            'educationalBackground' => $student->application?->educationalBackground?->toArray() ?? [],
            'enrollments' => $student->enrollments->map(fn ($e) => [
                'id'          => $e->id,
                'school_year' => $e->school_year,
                'semester'    => $e->semester,
                'year_level'  => $e->year_level,
                'status'      => $e->status,
            ]),
        ]);
    }

    /**
     * Show the edit form for student personal data.
     */
    public function edit(Student $student)
    {
        $student->load(['studentPersonalData.familyBackground', 'studentPersonalData.siblings', 'studentPersonalData.documents']);
        $spd = $student->studentPersonalData;

        return Inertia::render('Admin/Students/Edit', [
            'student' => [
                'id'                  => $student->id,
                'student_id_number'   => $student->student_id_number,
                'enrollment_status'   => $student->enrollment_status,
                'current_year_level'  => $student->current_year_level,
                'current_school_year' => $student->current_school_year,
                'current_semester'    => $student->current_semester,
            ],
            'personalData'     => $spd?->toArray(),
            'familyBackground' => $spd?->familyBackground?->toArray(),
            'siblings'         => $spd?->siblings?->toArray() ?? [],
            'documents'        => $spd?->documents?->toArray(),
        ]);
    }

    /**
     * Update student personal data.
     */
    public function update(Request $request, Student $student)
    {
        $spd = $student->studentPersonalData;

        if (!$spd) {
            return back()->withErrors(['error' => 'No student personal data found.']);
        }

        $validated = $request->validate([
            'last_name'       => 'required|string|max:100',
            'first_name'      => 'required|string|max:100',
            'middle_name'     => 'nullable|string|max:100',
            'suffix'          => 'nullable|string|max:20',
            'gender'          => 'required|in:Male,Female,Other',
            'citizenship'     => 'required|string|max:100',
            'religion'        => 'required|string|max:100',
            'date_of_birth'   => 'required|date|before:today',
            'place_of_birth'  => 'nullable|string|max:255',
            'email'           => 'required|email|max:255|unique:student_personal_data,email,' . $spd->id,
            'alt_email'       => 'nullable|email|max:255',
            'mobile_number'   => 'required|string|max:20',
            'present_brgy'    => 'required|string|max:255',
            'present_city'    => 'required|string|max:255',
            'present_province'=> 'required|string|max:255',
            'present_zip'     => 'required|string|max:10',
            'present_street'  => 'nullable|string|max:255',
            'permanent_brgy'  => 'nullable|string|max:255',
            'permanent_city'  => 'nullable|string|max:255',
            'permanent_province' => 'nullable|string|max:255',
            'permanent_zip'   => 'nullable|string|max:10',
            'permanent_street'=> 'nullable|string|max:255',
            // Health
            'health_conditions'   => 'nullable|array',
            'health_conditions.*' => 'nullable|string',
            'has_doctors_note'    => 'nullable|boolean',
            'doctors_note_file'   => 'nullable|file|mimes:pdf,jpg,jpeg,png,doc,docx|max:5120',
            // Student record fields
            'current_year_level'  => 'required|string|max:50',
            'current_school_year' => 'required|string|max:20',
            'current_semester'    => 'nullable|string|max:30',
            'enrollment_status'   => 'nullable|string|max:20',
            // Siblings
            'siblings'                       => 'nullable|array',
            'siblings.*.sibling_full_name'   => 'required_with:siblings|string|max:255',
            'siblings.*.sibling_grade_level' => 'nullable|string|max:50',
            'siblings.*.sibling_id_number'   => 'nullable|string|max:50',
            // Documents
            'certificate_of_enrollment' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'birth_certificate'         => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'latest_report_card_front'  => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'latest_report_card_back'   => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $spdExcludeKeys = [
            'current_year_level', 'current_school_year', 'current_semester', 'enrollment_status',
            'siblings', 'certificate_of_enrollment', 'birth_certificate',
            'latest_report_card_front', 'latest_report_card_back', 'doctors_note_file',
        ];

        $spd->update(collect($validated)->except($spdExcludeKeys)->toArray());

        // Doctor's note file
        if ($request->hasFile('doctors_note_file')) {
            $file = $request->file('doctors_note_file');
            $path = $file->storeAs(
                'documents/doctors_notes',
                "{$spd->id}_{$spd->last_name}_DOCTORS_NOTE.{$file->getClientOriginalExtension()}",
                'public'
            );
            $spd->update(['doctors_note_file' => $path]);
        }

        $student->update([
            'current_year_level'  => $validated['current_year_level'],
            'current_school_year' => $validated['current_school_year'],
            'current_semester'    => $validated['current_semester'] ?? $student->current_semester,
            'enrollment_status'   => $validated['enrollment_status'] ?? $student->enrollment_status,
        ]);

        // Siblings — replace all
        $spd->siblings()->delete();
        foreach ($validated['siblings'] ?? [] as $sib) {
            StudentSiblings::create([
                'student_personal_data_id' => $spd->id,
                'sibling_full_name'        => $sib['sibling_full_name'],
                'sibling_grade_level'      => $sib['sibling_grade_level'] ?? null,
                'sibling_id_number'        => $sib['sibling_id_number'] ?? null,
            ]);
        }

        // Documents — store any newly uploaded files
        $docUploads = [];
        $lastName  = preg_replace('/[^A-Za-z0-9]/', '', strtoupper($spd->last_name));
        $firstName = preg_replace('/[^A-Za-z0-9]/', '', strtoupper($spd->first_name));
        $prefix    = $student->student_id_number ?? $spd->id;
        $docKeys   = ['certificate_of_enrollment', 'birth_certificate', 'latest_report_card_front', 'latest_report_card_back'];
        $docLabels = ['COE', 'BIRTHCERTIFICATE', 'REPORTCARD_FRONT', 'REPORTCARD_BACK'];

        foreach ($docKeys as $i => $key) {
            if ($request->hasFile($key)) {
                $file  = $request->file($key);
                $path  = $file->storeAs(
                    'documents',
                    "{$prefix}_{$lastName}_{$firstName}_{$docLabels[$i]}.{$file->getClientOriginalExtension()}",
                    'public'
                );
                $docUploads[$key] = $path;
            }
        }

        if (!empty($docUploads)) {
            StudentDocuments::updateOrCreate(
                ['student_personal_data_id' => $spd->id],
                $docUploads
            );
        }

        return redirect()->route('admin.students.show', $student->id)
            ->with('success', 'Student record updated successfully.');
    }
}
