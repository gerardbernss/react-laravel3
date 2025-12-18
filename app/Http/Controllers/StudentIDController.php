<?php
namespace App\Http\Controllers;

use App\Mail\StudentAdmissionsMail;
use App\Models\ApplicantApplicationInfo;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class StudentIDController extends Controller
{
    // Display all applications with full relationships.
    public function index()
    {
        $applications = ApplicantApplicationInfo::with([
            'personalData.student',
        ])
            ->whereIn('application_status', ['Enrolled', 'active'])
            ->get();

        $flattenedApplications = $applications->map(function ($application) {
            return [
                'id'                 => $application->id,
                'application_number' => $application->application_number,
                'student_id_number'  => $application->personalData?->student?->student_id_number ?? '',

                'application_date'   => $application->application_date,
                'application_status' => $application->application_status,
                'strand'             => $application->strand,

                'last_name'          => $application->personalData->last_name ?? null,
                'first_name'         => $application->personalData->first_name ?? null,
                'middle_name'        => $application->personalData->middle_name ?? null,
                'gender'             => $application->personalData->gender ?? null,
                'email'              => $application->personalData->email ?? null,
            ];
        });

        return Inertia::render('StudentIdAssignment/Index', [
            'applications' => $flattenedApplications,
        ]);
    }
    // Display a single applicant with full details.

    public function show($id)
    {

    }

    // Render the create form page.
    public function create()
    {
        return Inertia::render('Admissions/AddApplicant');
    }

    public function store(Request $request)
    {

    }

    public function edit($id)
    {

    }

    public function update(Request $request, $id)
    {

    }

    public function assignStudentId(Request $request)
    {
        try {
            // First, find the application and its related student
            $application = ApplicantApplicationInfo::with([
                'personalData.student',
            ])->findOrFail($request->applicant_id);

            $student = Student::where('applicant_personal_data_id', $application->personalData->id)->first();

            // Validate with conditional uniqueness rule
            $validated = $request->validate([
                'applicant_id'   => 'required|integer|exists:applicant_application_info,id',
                'student_number' => [
                    'required',
                    'string',
                    // Exclude current student's ID from uniqueness check if updating
                    Rule::unique('students', 'student_id_number')
                        ->ignore($student?->id),
                ],
            ]);

            if ($student) {
                // Update existing student record
                $student->update([
                    'student_id_number' => $validated['student_number'],
                ]);
            } else {
                // Create new student record if it doesn't exist
                Student::create([
                    'applicant_personal_data_id' => $application->personalData->id,
                    'student_id_number'          => $validated['student_number'],
                    // Add other required fields here
                ]);
            }

            return back()->with('success', 'Student ID assigned successfully!');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors());
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to assign Student ID: ' . $e->getMessage()]);
        }
    }

    // Controller
    public function emailStudentID($id)
    {
        $application = ApplicantApplicationInfo::with('personalData')->findOrFail($id);

        $student = Student::where('application_id', $application->id)
            ->orWhere('applicant_personal_data_id', $application->personalData->id)
            ->first();

        $mailData = [
            'first_name'        => $application->personalData->first_name,
            'last_name'         => $application->personalData->last_name,
            'student_id_number' => $student->student_id_number ?? 'Not assigned',
            'email'             => $application->personalData->email,
        ];

        Mail::to($application->personalData->email)->send(new StudentAdmissionsMail($mailData));

        return back()->with('success', 'ID Number successfully sent.');
    }
}
