<?php

namespace App\Http\Controllers\Admissions;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admissions\EvaluateApplicantRequest;
use App\Http\Requests\Admissions\StoreApplicantRequest;
use App\Http\Requests\Admissions\UpdateApplicantRequest;
use App\Mail\Admissions\EmailConfirmationMail;
use App\Mail\Admissions\FinalResultMail;
use App\Mail\Admissions\PortalPasswordMail;
use App\Mail\Admissions\ResendPortalPasswordMail;
use App\Models\Applicant;
use App\Models\ApplicantAssessment;
use App\Models\ApplicantExamResult;
use App\Models\ApplicantPersonalData;
use App\Models\EnrollmentPeriod;
use App\Models\PortalCredential;
use App\Models\Student;
use App\Models\StudentAssessment;
use App\Models\StudentPayment;
use App\Services\Admissions\ApplicantService;
use App\Services\Student\CopyApplicantDataService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

/**
 * Admin-side CRUD and lifecycle management for applicant records.
 *
 * This controller is auth-protected (requires 'manage-applications' permission)
 * and is used exclusively by admin/staff — not by the public. Public online
 * submissions go through ApplicationController instead.
 *
 * All write operations are delegated to ApplicantService (injected via constructor)
 * which wraps each multi-table operation in a DB transaction. This controller
 * owns the following additional responsibilities that the service does not handle:
 *   - Email dispatch (sendFinalResult, sendConfirmationEmail, sendPortalPassword)
 *   - The enrollment transaction: Student + StudentAssessment + StudentPayment
 *     are created together in enroll(), then CopyApplicantDataService mirrors the
 *     personal data into the student-side tables.
 *
 * The sendEmail() private helper centralises the guard check and JSON response
 * format so each email action only needs to supply its Mailable.
 */
class ApplicantController extends Controller
{
    // ApplicantService is injected via the constructor so all write operations
    // (create, update, delete) go through the service layer instead of living
    // directly in the controller.
    public function __construct(
        private readonly ApplicantService $applicantService
    ) {}

    /**
     * List all applicants for the management table.
     *
     * We eager-load personalData to avoid N+1 queries, then flatten each
     * applicant + their personal data into a single plain object. Inertia
     * serialises this to JSON, and the React table component receives it as
     * a simple array of rows — no nested objects needed on the frontend.
     */
    public function index()
    {
        $currentPeriod = EnrollmentPeriod::where('is_open', true)
            ->where(function ($q) { $q->whereNull('start_date')->orWhereDate('start_date', '<=', today()); })
            ->where(function ($q) { $q->whereNull('close_date')->orWhereDate('close_date', '>=', today()); })
            ->first()
            ?? EnrollmentPeriod::latest()->first();

        $applications = Applicant::with(['personalData'])
            ->when($currentPeriod, fn($q) => $currentPeriod->applyTo($q))
            ->get();

        $flattenedApplications = $applications->map(function ($application) {
            return [
                'id'                 => $application->id,
                'application_number' => $application->application_number,
                'application_date'   => $application->application_date,
                'application_status' => $application->application_status,
                'strand'             => $application->strand,
                'personal_data_id'   => $application->personalData->id ?? null,
                'last_name'          => $application->personalData->last_name ?? null,
                'first_name'         => $application->personalData->first_name ?? null,
                'middle_name'        => $application->personalData->middle_name ?? null,
                'gender'             => $application->personalData->gender ?? null,
                'email'              => $application->personalData->email ?? null,
            ];
        });

        return Inertia::render('Admissions/Index', [
            'applications' => $flattenedApplications,
        ]);
    }

    /**
     * Show the full detail view for a single applicant.
     *
     * Deep-loads all related data so the detail page can display every section
     * (personal info, family background, siblings, school history, documents)
     * without additional requests.
     */
    public function show($id)
    {
        $application = Applicant::with([
            'personalData.familyBackground',
            'personalData.siblings',
            'educationalBackground',
            'documents',
            'assessment',
        ])->findOrFail($id);

        $examResult = ApplicantExamResult::where('applicant_personal_data_id', $application->applicant_personal_data_id)->first();

        return Inertia::render('Admissions/Show', [
            'applicant'  => $application,
            'examResult' => $examResult ? [
                'applicant_number'   => $examResult->applicant_number,
                'exam_date'          => $examResult->exam_date?->toDateString(),
                'exam_time'          => $examResult->exam_time,
                'exam_venue'         => $examResult->exam_venue,
                'math_score'         => $examResult->math_score,
                'english_score'      => $examResult->english_score,
                'science_score'      => $examResult->science_score,
                'total_score'        => $examResult->total_score,
                'percentage_score'   => $examResult->percentage_score,
                'result'             => $examResult->result,
                'ranking'            => $examResult->ranking,
            ] : null,
        ]);
    }

    /**
     * Render the blank add-applicant form (onsite entry).
     */
    public function create()
    {
        return Inertia::render('Admissions/AddApplicant');
    }

    /**
     * Persist a new applicant submitted from the onsite form.
     *
     * Delegates to ApplicantService::createApplicant() which wraps all DB
     * writes in a single transaction (personal data → family → siblings →
     * application → education → documents).
     */
    public function store(StoreApplicantRequest $request)
    {
        try {
            $this->applicantService->createApplicant($request->validated(), $request);

            return redirect()->route('applicants.index')
                ->with('success', 'Applicant added successfully.');
        } catch (\Exception $e) {
            Log::error('Application submission failed: ' . $e->getMessage());

            return back()
                ->withErrors(['error' => 'Failed to submit: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Load the edit form pre-populated with existing applicant data.
     */
    public function edit($id)
    {
        $application = Applicant::with([
            'personalData',
            'personalData.familyBackground',
            'educationalBackground',
            'personalData.siblings',
            'documents',
        ])->findOrFail($id);

        return Inertia::render('Admissions/Edit', [
            'applicant' => $application,
        ]);
    }

    /**
     * Save changes to an existing applicant record.
     *
     * Delegates to ApplicantService::updateApplicant(). When application_status
     * is changed to 'Enrolled', the service automatically creates the linked
     * Student record if one doesn't exist yet.
     */
    public function update(UpdateApplicantRequest $request, $id)
    {
        try {
            $application = Applicant::with([
                'personalData.familyBackground',
                'personalData.siblings',
                'educationalBackground',
                'documents',
            ])->findOrFail($id);

            $this->applicantService->updateApplicant($application, $request->validated(), $request);

            return redirect()->route('applicants.index')
                ->with('success', 'Applicant updated successfully.');
        } catch (\Exception $e) {
            Log::error('Application update failed: ' . $e->getMessage());

            return back()
                ->withErrors(['error' => 'Failed to update: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Delete an applicant and all associated data.
     *
     * Personal data (ApplicantPersonalData) is shared — the same person may
     * have submitted multiple applications. We only delete the personal data
     * row when this is the applicant's only remaining application; otherwise
     * we just delete the educational background and the application row itself,
     * leaving the shared personal data intact for the other application(s).
     *
     * All operations are wrapped in a transaction so a partial failure does
     * not leave orphaned records.
     */
    public function destroy($id)
    {
        try {
            DB::transaction(function () use ($id) {
                $application = Applicant::with([
                    'documents',
                    'educationalBackground',
                    'personalData',
                ])->findOrFail($id);

                // Delete uploaded document files from disk before removing the DB row.
                if ($application->documents) {
                    $fileFields = [
                        'certificate_of_enrollment',
                        'birth_certificate',
                        'latest_report_card_front',
                        'latest_report_card_back',
                    ];

                    foreach ($fileFields as $field) {
                        if (! empty($application->documents->$field)) {
                            Storage::disk('public')->delete($application->documents->$field);
                        }
                    }
                    $application->documents()->delete();
                }

                $personalData   = $application->personalData;
                // Count other applications using the same personal data record.
                $otherAppsCount = $personalData
                    ? $personalData->applications()->where('id', '!=', $id)->count()
                    : 0;

                if ($personalData && $otherAppsCount === 0) {
                    // No other applications share this personal data — safe to
                    // cascade-delete everything (personal data model will remove
                    // family background, siblings, and this application via DB
                    // cascade or model events).
                    ApplicantPersonalData::destroy($personalData->id);
                } else {
                    // Another application references the same personal data.
                    // Only delete the education records and the application row.
                    $application->educationalBackground()->delete();
                    Applicant::destroy($application->id);
                }
            });

            return redirect()
                ->route('applicants.index')
                ->with('success', 'Applicant deleted successfully');
        } catch (\Exception $e) {
            Log::error('Application deletion failed: ' . $e->getMessage());

            return back()->withErrors(['error' => 'Failed to delete applicant.']);
        }
    }

    /**
     * Evaluate a submitted application — sets the review status and optional remarks.
     * Maps intent words (approve/revise/reject) to actual application_status values.
     */
    public function evaluate(EvaluateApplicantRequest $request, $id)
    {
        $statusMap = [
            'approve' => 'For Exam',
            'revise'  => 'For Revision',
            'reject'  => 'Rejected',
        ];

        try {
            $applicant = Applicant::findOrFail($id);
            $applicant->update([
                'application_status' => $statusMap[$request->validated()['evaluation']],
                'remarks'            => $request->validated()['remarks'] ?? null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Application evaluated successfully.',
                'data'    => [
                    'application_status' => $applicant->application_status,
                    'remarks'            => $applicant->remarks,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Application evaluation failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to evaluate application. Please try again.',
            ], 500);
        }
    }

    /**
     * Render the dedicated enrollment/payment page for an applicant.
     */
    public function enrollPage($id)
    {
        $applicant  = Applicant::with(['personalData', 'assessment'])->findOrFail($id);
        $assessment = $applicant->assessment;

        return Inertia::render('Admissions/Enroll', [
            'applicant' => [
                'id'                 => $applicant->id,
                'application_number' => $applicant->application_number,
                'application_status' => $applicant->application_status,
                'year_level'         => $applicant->year_level,
                'school_year'        => $applicant->school_year,
                'semester'           => $applicant->semester,
                'name'               => trim(
                    ($applicant->personalData->last_name ?? '') . ', ' .
                    ($applicant->personalData->first_name ?? '') . ' ' .
                    ($applicant->personalData->middle_name ?? '')
                ),
            ],
            'assessment' => $assessment ? [
                'assessment_number' => $assessment->assessment_number,
                'school_year'       => $assessment->school_year,
                'semester'          => $assessment->semester,
                'total_tuition'     => (float) $assessment->total_tuition,
                'total_misc_fees'   => (float) $assessment->total_misc_fees,
                'total_lab_fees'    => (float) $assessment->total_lab_fees,
                'total_other_fees'  => (float) $assessment->total_other_fees,
                'gross_amount'      => (float) $assessment->gross_amount,
                'net_amount'        => (float) $assessment->net_amount,
                'minimum_amount'    => (float) $assessment->minimum_amount,
                'status'            => $assessment->status,
            ] : null,
        ]);
    }

    /**
     * Enroll an Exam Passed applicant and record their initial payment.
     * Creates Student + StudentAssessment + StudentPayment in one transaction.
     */
    public function enroll(Request $request, $id)
    {
        $validated = $request->validate([
            'amount_paid' => ['required', 'numeric', 'min:0'],
            'notes'       => ['nullable', 'string', 'max:500'],
        ]);

        $applicant           = Applicant::with(['personalData', 'assessment'])->findOrFail($id);
        $applicantAssessment = $applicant->assessment;

        abort_if(!in_array($applicant->application_status, ['Exam Passed', 'Pending Enrollment']), 422, 'Applicant is not eligible for enrollment.');
        abort_if(!$applicantAssessment, 422, 'No assessment found. Applicant must complete the enrollment wizard first.');

        DB::transaction(function () use ($applicant, $applicantAssessment, $validated) {
            $personalData = $applicant->personalData;

            $student = Student::create([
                'applicant_personal_data_id' => $personalData->id,
                'applicant_id'               => $applicant->id,
                'enrollment_status'          => 'Active',
                'enrollment_date'            => now(),
                'current_year_level'         => $applicant->year_level,
                'current_semester'           => $applicant->semester ?? 'First Semester',
                'current_school_year'        => $applicant->school_year,
            ]);

            $studentAssessment = StudentAssessment::create([
                'student_id'        => $student->id,
                'assessment_number' => StudentAssessment::generateAssessmentNumber($applicant->school_year),
                'school_year'       => $applicantAssessment->school_year,
                'semester'          => $applicantAssessment->semester,
                'total_tuition'     => $applicantAssessment->total_tuition,
                'total_misc_fees'   => $applicantAssessment->total_misc_fees,
                'total_lab_fees'    => $applicantAssessment->total_lab_fees,
                'total_other_fees'  => $applicantAssessment->total_other_fees,
                'gross_amount'      => $applicantAssessment->gross_amount,
                'total_discounts'   => $applicantAssessment->total_discounts,
                'net_amount'        => $applicantAssessment->net_amount,
                'payment_plan'      => 'installment',
                'minimum_amount'    => $applicantAssessment->minimum_amount,
                'mode_of_payment'   => 'cash',
                'status'            => 'finalized',
                'generated_at'      => now(),
                'finalized_at'      => now(),
                'finalized_by'      => Auth::id(),
            ]);

            StudentPayment::create([
                'assessment_id'  => $studentAssessment->id,
                'amount_paid'    => $validated['amount_paid'],
                'payment_method' => 'cash',
                'payment_date'   => now()->toDateString(),
                'notes'          => $validated['notes'] ?? null,
                'processed_by'   => Auth::id(),
            ]);

            $totalPaid = (float) $validated['amount_paid'];
            $net       = (float) $applicantAssessment->net_amount;
            $newStatus = $totalPaid >= $net ? 'paid' : ($totalPaid > 0 ? 'partial' : 'finalized');
            $studentAssessment->update(['status' => $newStatus]);

            $applicantAssessment->update(['status' => 'paid']);
            $applicant->update(['application_status' => 'Enrolled']);

            app(CopyApplicantDataService::class)->execute($student);
        });

        return redirect()->route('applicants.show', $id)
            ->with('success', 'Applicant enrolled and payment recorded successfully.');
    }

    /**
     * Send the final admission result email to an applicant.
     */
    public function sendFinalResult($id)
    {
        return $this->sendEmail($id, function ($application) {
            Mail::to($application->personalData->email)->send(new FinalResultMail($application));
        }, 'Final result email sent successfully.');
    }

    /**
     * Send an application receipt / confirmation email.
     */
    public function sendConfirmationEmail($id)
    {
        return $this->sendEmail($id, function ($application) {
            Mail::to($application->personalData->email)->send(new EmailConfirmationMail($application));
        }, 'Confirmation email sent successfully.');
    }

    /**
     * Generate (or regenerate) portal credentials and email them to the applicant.
     *
     * Logic:
     *  - If no PortalCredential row exists yet, create one using the applicant's
     *    email as the username. Guard against duplicate usernames first.
     *  - If a credential row already exists (e.g. resending), only update the
     *    hashed temporary_password so the student gets a fresh login.
     *  - Either way, bcrypt() hashes the plain-text password before storage.
     *    The plain-text version is passed to the Mailable so it can be included
     *    in the email — it is never stored.
     *  - After sending, record credentials_sent_at and the delivery channel.
     */
    public function sendPortalPassword($id)
    {
        try {
            $application = Applicant::with('personalData')->findOrFail($id);

            if (! $application->personalData?->email) {
                return response()->json([
                    'success' => false,
                    'message' => 'Applicant email not found.',
                ], 400);
            }

            $credential        = PortalCredential::where('applicant_id', $application->id)->first();
            $temporaryPassword = Str::random(12);

            if (! $credential) {
                // First time — create a new credential row.
                $username = $application->personalData->email;

                if (PortalCredential::where('username', $username)->exists()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Portal credentials already exist for this email address.',
                    ], 400);
                }

                $credential = PortalCredential::create([
                    'applicant_personal_data_id' => $application->applicant_personal_data_id,
                    'applicant_id'               => $application->id,
                    'username'                   => $username,
                    // Store only the bcrypt hash — plain text is discarded after emailing.
                    'temporary_password'         => bcrypt($temporaryPassword),
                    'credentials_generated_at'   => now(),
                ]);
            } else {
                // Credential already exists — just reset the password.
                $credential->update([
                    'temporary_password' => bcrypt($temporaryPassword),
                ]);
            }

            $credential->load('personalData');

            // Pass the plain-text password to the Mailable so it can be shown
            // in the email body. The Mailable does NOT persist it anywhere.
            Mail::to($application->personalData->email)
                ->send(new ResendPortalPasswordMail($credential, $temporaryPassword));

            // Record when and how the credentials were delivered.
            $credential->update([
                'credentials_sent_at' => now(),
                'sent_via'            => 'email',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Portal credentials emailed successfully.',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send portal password email: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to send email. Please try again.',
            ], 500);
        }
    }

    /**
     * Shared email-sending helper used by sendFinalResult() and sendConfirmationEmail().
     *
     * Accepts a callable $sendAction so each caller can inject its own Mailable
     * without duplicating the guard check, try/catch, or JSON response format.
     * The callable receives the loaded $application instance.
     */
    private function sendEmail(int $id, callable $sendAction, string $successMessage)
    {
        try {
            $application = Applicant::with('personalData')->findOrFail($id);

            if (! $application->personalData?->email) {
                return response()->json([
                    'success' => false,
                    'message' => 'Applicant email not found.',
                ], 400);
            }

            $sendAction($application);

            return response()->json([
                'success' => true,
                'message' => $successMessage,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send email: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to send email. Please try again.',
            ], 500);
        }
    }
}
