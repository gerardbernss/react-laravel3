<?php

namespace App\Http\Controllers\Admissions;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admissions\CheckApplicantEmailRequest;
use App\Services\Admissions\ApplicationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

/**
 * Handles public-facing online application form submissions (LES, JHS, SHS).
 *
 * This controller is accessible WITHOUT authentication — it is the entry point
 * for prospective students submitting their own applications online. Admin staff
 * who enter applications on behalf of walk-in applicants use ApplicantController
 * instead (which is auth-protected).
 *
 * storeLES/storeJHS/storeSHS all delegate to ApplicationService, which shares one
 * six-step write flow for the three school levels. The only behavioral difference
 * preserved from the original controller is that LES checks for a duplicate
 * application first; JHS and SHS do not.
 */
class ApplicationController extends Controller
{
    public function __construct(private readonly ApplicationService $applicationService)
    {
    }

    /**
     * Render the public application landing page where prospective students choose their school level.
     */
    public function start()
    {
        return Inertia::render('Applications/Start');
    }

    /**
     * List open application periods and related school information for the public start page.
     */
    public function index()
    {
        return Inertia::render('Applications/Index', $this->applicationService->indexData());
    }

    /**
     * Show the LES online application form, redirecting away if applications are closed.
     */
    public function createLES()
    {
        if (! $this->applicationService->canAcceptApplications()) {
            return redirect('/applications/start');
        }

        return Inertia::render('Applications/AddLES');
    }

    /**
     * Show the JHS online application form, redirecting away if applications are closed.
     */
    public function createJHS()
    {
        if (! $this->applicationService->canAcceptApplications()) {
            return redirect('/applications/start');
        }

        return Inertia::render('Applications/AddJHS');
    }

    /**
     * Show the SHS online application form, redirecting away if applications are closed.
     */
    public function createSHS()
    {
        if (! $this->applicationService->canAcceptApplications()) {
            return redirect('/applications/start');
        }

        return Inertia::render('Applications/AddSHS');
    }

    /**
     * Check whether an email address already has a submitted application for the current period.
     */
    public function checkEmail(CheckApplicantEmailRequest $request)
    {
        return response()->json($this->applicationService->checkEmail($request->validated()['email']));
    }

    /**
     * Submit a new LES application from the public form.
     */
    public function storeLES(Request $request)
    {
        return $this->submit($request, 'submitLES');
    }

    /**
     * Submit a new JHS application from the public form.
     */
    public function storeJHS(Request $request)
    {
        return $this->submit($request, 'submitJHS');
    }

    /**
     * Submit a new SHS application from the public form.
     */
    public function storeSHS(Request $request)
    {
        return $this->submit($request, 'submitSHS');
    }

    /**
     * Render the success page shown after a public application is submitted.
     */
    public function success()
    {
        return Inertia::render('Applications/ApplicationSuccess');
    }

    public function edit($id)
    {
    }

    public function update(Request $request, $id)
    {
    }

    public function destroy($id)
    {
    }

    /**
     * Delegate a form submission to the named service method, guarding against closed periods and duplicate applications.
     */
    private function submit(Request $request, string $method)
    {
        if (! $this->applicationService->canAcceptApplications()) {
            return back()->withErrors(['error' => 'Applications are currently closed.']);
        }

        try {
            $result = $this->applicationService->{$method}($request->all(), $request);

            if ($result['duplicate']) {
                return back()->withErrors(['duplicate_application' => 'You have already submitted an application.'])->withInput();
            }

            return Inertia::location(route('applications.success'));
        } catch (\Exception $e) {
            Log::error('Application submission failed: ' . $e->getMessage());

            return back()->withErrors(['error' => 'Failed to submit: ' . $e->getMessage()])->withInput();
        }
    }
}
