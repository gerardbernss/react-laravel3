<?php
namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;

use App\Mail\Admissions\StudentAdmissionsMail;
use App\Models\Applicant;
use App\Models\EnrollmentPeriod;
use App\Models\Student;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class StudentIDController extends Controller
{
    // Display all applications with full relationships.
    public function index()
    {
        $currentPeriod = EnrollmentPeriod::current();

        $applications = Applicant::with([
            'personalData.student',
        ])
            ->where('application_status', 'Enrolled')
            ->when($currentPeriod, fn($q) => $currentPeriod->applyTo($q))
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
            $application = Applicant::with([
                'personalData.student',
            ])->findOrFail($request->applicant_id);

            $student = Student::where('applicant_personal_data_id', $application->personalData->id)->first();

            // Validate with conditional uniqueness rule
            $validated = $request->validate([
                'applicant_id'   => 'required|integer|exists:applicants,id',
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
                    'student_id_number'             => $validated['student_number'],
                    'applicant_id' => $student->applicant_id ?? $application->id,
                ]);
            } else {
                // Create new student record if it doesn't exist
                Student::create([
                    'applicant_personal_data_id'    => $application->personalData->id,
                    'applicant_id' => $application->id,
                    'student_id_number'             => $validated['student_number'],
                ]);
            }

            return back()->with('success', 'Student ID assigned successfully!');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors());
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to assign Student ID: ' . $e->getMessage()]);
        }
    }

    public function bulkGenerate(): RedirectResponse
    {
        $currentPeriod = EnrollmentPeriod::current();

        $applicants = Applicant::with('personalData.student')
            ->where('application_status', 'Enrolled')
            ->when($currentPeriod, fn($q) => $currentPeriod->applyTo($q))
            ->whereNotNull('year_level')
            ->get()
            ->filter(fn($a) => !$a->personalData?->student?->student_id_number);

        $generated = 0;
        foreach ($applicants as $applicant) {
            $prefix = $this->getStudentIdPrefix($applicant->year_level);
            if (!$prefix) continue;

            $year = substr((string) $applicant->school_year, 2, 2);

            $existing = Student::where('student_id_number', 'like', "{$prefix}{$year}%")
                ->max('student_id_number');
            $next = $existing ? ((int) substr($existing, 3) + 1) : 1;
            $studentId = sprintf('%s%s%04d', $prefix, $year, $next);

            $student = $applicant->personalData?->student;
            if ($student) {
                $student->update(['student_id_number' => $studentId]);
            } else {
                Student::create([
                    'applicant_personal_data_id' => $applicant->applicant_personal_data_id,
                    'applicant_id'               => $applicant->id,
                    'student_id_number'          => $studentId,
                ]);
            }
            $generated++;
        }

        return redirect()->back()->with('success', "Generated {$generated} student ID(s).");
    }

    private function getStudentIdPrefix(string $yearLevel): ?string
    {
        if (str_contains(strtolower($yearLevel), 'kinder')) return 'L';
        $num = (int) filter_var($yearLevel, FILTER_SANITIZE_NUMBER_INT);
        if ($num >= 1 && $num <= 6)  return 'L';
        if ($num >= 7 && $num <= 10) return 'J';
        if ($num >= 11)              return 'S';
        return null;
    }

    // Controller
    public function emailStudentID($id)
    {
        try {
            $application = Applicant::with('personalData')->findOrFail($id);

            if (! $application->personalData || ! $application->personalData->email) {
                return response()->json([
                    'message' => 'Applicant email not found.',
                ], 400);
            }

            $student = Student::where('application_id', $application->id)
                ->orWhere('applicant_personal_data_id', $application->personalData->id)
                ->first();

            if (! $student) {
                return response()->json([
                    'message' => 'Student record not found.',
                ], 400);
            }

            $mailData = [
                'first_name'        => $application->personalData->first_name,
                'last_name'         => $application->personalData->last_name,
                'student_id_number' => $student->student_id_number ?? 'Not assigned',
                'email'             => $application->personalData->email,
            ];

            Mail::to($application->personalData->email)->send(new StudentAdmissionsMail($mailData));

            return response()->json([
                'message' => 'Student ID email sent successfully.',
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Failed to send student ID email: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to send email: ' . $e->getMessage(),
            ], 500);
        }
    }
}
