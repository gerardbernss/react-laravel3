<?php

namespace App\Http\Controllers\Admissions;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admissions\StoreApplicantRequest;
use App\Http\Requests\Admissions\UpdateApplicantRequest;
use App\Mail\Admissions\EmailConfirmationMail;
use App\Mail\Admissions\FinalResultMail;
use App\Mail\Admissions\PortalPasswordMail;
use App\Models\ApplicantApplicationInfo;
use App\Models\ApplicantPersonalData;
use App\Models\PortalCredential;
use App\Services\Admissions\ApplicantService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ApplicantController extends Controller
{
    public function __construct(
        private readonly ApplicantService $applicantService
    ) {}

    public function index()
    {
        $applications = ApplicantApplicationInfo::with(['personalData'])->get();

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

    public function show($id)
    {
        $application = ApplicantApplicationInfo::with([
            'personalData.familyBackground',
            'personalData.siblings',
            'educationalBackground',
            'documents',
        ])->findOrFail($id);

        return Inertia::render('Admissions/Show', [
            'applicant' => $application,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admissions/AddApplicant');
    }

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

    public function edit($id)
    {
        $application = ApplicantApplicationInfo::with([
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

    public function update(UpdateApplicantRequest $request, $id)
    {
        try {
            $application = ApplicantApplicationInfo::with([
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

    public function destroy($id)
    {
        try {
            DB::transaction(function () use ($id) {
                $application = ApplicantApplicationInfo::with([
                    'documents',
                    'educationalBackground',
                    'personalData',
                ])->findOrFail($id);

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
                $otherAppsCount = $personalData
                    ? $personalData->applications()->where('id', '!=', $id)->count()
                    : 0;

                if ($personalData && $otherAppsCount === 0) {
                    ApplicantPersonalData::destroy($personalData->id);
                } else {
                    $application->educationalBackground()->delete();
                    ApplicantApplicationInfo::destroy($application->id);
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

    public function sendFinalResult($id)
    {
        return $this->sendEmail($id, function ($application) {
            Mail::to($application->personalData->email)->send(new FinalResultMail($application));
        }, 'Final result email sent successfully.');
    }

    public function sendConfirmationEmail($id)
    {
        return $this->sendEmail($id, function ($application) {
            Mail::to($application->personalData->email)->send(new EmailConfirmationMail($application));
        }, 'Confirmation email sent successfully.');
    }

    public function sendPortalPassword($id)
    {
        try {
            $application = ApplicantApplicationInfo::with('personalData')->findOrFail($id);

            if (! $application->personalData?->email) {
                return response()->json([
                    'success' => false,
                    'message' => 'Applicant email not found.',
                ], 400);
            }

            $credential = PortalCredential::where('applicant_application_info_id', $application->id)->first();
            $temporaryPassword = Str::random(12);

            if (! $credential) {
                $username = $application->personalData->email;

                if (PortalCredential::where('username', $username)->exists()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Portal credentials already exist for this email address.',
                    ], 400);
                }

                $credential = PortalCredential::create([
                    'applicant_personal_data_id'    => $application->applicant_personal_data_id,
                    'applicant_application_info_id' => $application->id,
                    'username'                      => $username,
                    'temporary_password'            => bcrypt($temporaryPassword),
                    'credentials_generated_at'      => now(),
                ]);
            } else {
                $credential->update([
                    'temporary_password' => bcrypt($temporaryPassword),
                ]);
            }

            $credential->load('personalData');

            Mail::to($application->personalData->email)
                ->send(new PortalPasswordMail($credential, $temporaryPassword));

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
     * Shared email sending logic with consistent error handling.
     */
    private function sendEmail(int $id, callable $sendAction, string $successMessage)
    {
        try {
            $application = ApplicantApplicationInfo::with('personalData')->findOrFail($id);

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
