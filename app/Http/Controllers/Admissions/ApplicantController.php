<?php

namespace App\Http\Controllers\Admissions;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admissions\EnrollApplicantRequest;
use App\Http\Requests\Admissions\EvaluateApplicantRequest;
use App\Http\Requests\Admissions\StoreApplicantRequest;
use App\Http\Requests\Admissions\UpdateApplicantRequest;
use App\Services\Admissions\ApplicantService;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

/**
 * Admin-side CRUD and lifecycle management for applicant records.
 *
 * This controller is auth-protected (requires 'manage-applications' permission)
 * and is used exclusively by admin/staff — not by the public. Public online
 * submissions go through ApplicationController instead.
 *
 * All queries live in ApplicantRepository and all business logic (including the
 * enrollment transaction and the credential/email dispatch lifecycle) lives in
 * ApplicantService. This controller only translates HTTP requests into service
 * calls and shapes the resulting response.
 */
class ApplicantController extends Controller
{
    public function __construct(private readonly ApplicantService $applicantService)
    {
    }

    public function index()
    {
        return Inertia::render('Admissions/Index', $this->applicantService->indexData());
    }

    public function show($id)
    {
        return Inertia::render('Admissions/Show', $this->applicantService->showData((int) $id));
    }

    public function create()
    {
        return Inertia::render('Admissions/AddApplicant');
    }

    public function store(StoreApplicantRequest $request)
    {
        try {
            $this->applicantService->createApplicant($request->validated(), $request);

            return redirect()->route('applicants.index')->with('success', 'Applicant added successfully.');
        } catch (\Exception $e) {
            Log::error('Application submission failed: ' . $e->getMessage());

            return back()->withErrors(['error' => 'Failed to submit: ' . $e->getMessage()])->withInput();
        }
    }

    public function edit($id)
    {
        return Inertia::render('Admissions/Edit', $this->applicantService->editData((int) $id));
    }

    public function update(UpdateApplicantRequest $request, $id)
    {
        try {
            $application = $this->applicantService->findForUpdate((int) $id);
            $this->applicantService->updateApplicant($application, $request->validated(), $request);

            return redirect()->route('applicants.index')->with('success', 'Applicant updated successfully.');
        } catch (\Exception $e) {
            Log::error('Application update failed: ' . $e->getMessage());

            return back()->withErrors(['error' => 'Failed to update: ' . $e->getMessage()])->withInput();
        }
    }

    public function destroy($id)
    {
        try {
            $this->applicantService->destroyApplicant((int) $id);

            return redirect()->route('applicants.index')->with('success', 'Applicant deleted successfully');
        } catch (\Exception $e) {
            Log::error('Application deletion failed: ' . $e->getMessage());

            return back()->withErrors(['error' => 'Failed to delete applicant.']);
        }
    }

    public function evaluate(EvaluateApplicantRequest $request, $id)
    {
        try {
            $data = $this->applicantService->evaluateApplicant((int) $id, $request->validated()['evaluation'], $request->validated()['remarks'] ?? null);

            return response()->json(['success' => true, 'message' => 'Application evaluated successfully.', 'data' => $data]);
        } catch (\Exception $e) {
            Log::error('Application evaluation failed: ' . $e->getMessage());

            return response()->json(['success' => false, 'message' => 'Failed to evaluate application. Please try again.'], 500);
        }
    }

    public function enrollPage($id)
    {
        return Inertia::render('Admissions/Enroll', $this->applicantService->enrollPageData((int) $id));
    }

    public function enroll(EnrollApplicantRequest $request, $id)
    {
        $this->applicantService->enrollApplicant((int) $id, $request->validated());

        return redirect()->route('applicants.show', $id)->with('success', 'Applicant enrolled and payment recorded successfully.');
    }

    public function sendFinalResult($id)
    {
        return $this->jsonResult($this->applicantService->sendFinalResult((int) $id));
    }

    public function sendConfirmationEmail($id)
    {
        return $this->jsonResult($this->applicantService->sendConfirmationEmail((int) $id));
    }

    public function sendPortalPassword($id)
    {
        return $this->jsonResult($this->applicantService->sendPortalPassword((int) $id));
    }

    private function jsonResult(array $result)
    {
        $status = $result['status'] ?? 200;
        unset($result['status']);

        return response()->json($result, $status);
    }
}
