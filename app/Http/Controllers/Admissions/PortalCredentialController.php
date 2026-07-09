<?php

namespace App\Http\Controllers\Admissions;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admissions\StorePortalCredentialRequest;
use App\Models\PortalCredential;
use App\Repositories\PortalCredentialRepository;
use App\Services\Admissions\PortalCredentialService;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

/**
 * Manages student portal login credentials (PortalCredential model).
 *
 * Used by admin/registrar staff (requires 'manage-portal-credentials' permission).
 * The main portal credential send flow also exists in ApplicantController::sendPortalPassword()
 * for the inline "send credentials" action on the applicant detail page; this
 * controller handles the dedicated portal-credentials management area.
 */
class PortalCredentialController extends Controller
{
    public function __construct(
        private PortalCredentialRepository $portalCredentialRepository,
        private PortalCredentialService $portalCredentialService,
    ) {
    }

    public function index()
    {
        return Inertia::render('Admissions/PortalCredentials/Index', [
            'credentials' => $this->portalCredentialRepository->allWithRelations(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admissions/PortalCredentials/Create', [
            'applicants' => $this->portalCredentialRepository->applicantsWithPersonalData(),
        ]);
    }

    public function store(StorePortalCredentialRequest $request)
    {
        $result = $this->portalCredentialService->store($request->validated(), Auth::id());

        if (! empty($result['error_field'])) {
            return back()->withErrors([$result['error_field'] => $result['error_message']]);
        }

        return redirect()->route('admin.portal-credentials.show', $result['credential']->id)
            ->with('success', 'Portal credentials generated and sent to applicant successfully.');
    }

    public function show(PortalCredential $credential)
    {
        return Inertia::render('Admissions/PortalCredentials/Show', [
            'credential' => $this->portalCredentialRepository->loadRelations($credential),
        ]);
    }

    public function send(PortalCredential $credential)
    {
        $result = $this->portalCredentialService->send($credential);

        return back()->with($result['success'] ? 'success' : 'error', $result['message']);
    }

    public function resend(PortalCredential $credential)
    {
        $result = $this->portalCredentialService->resend($credential);

        return back()->with($result['success'] ? 'success' : 'error', $result['message']);
    }

    public function suspend(PortalCredential $credential)
    {
        $this->portalCredentialService->suspend($credential);

        return back()->with('success', 'Portal access suspended.');
    }

    public function reactivate(PortalCredential $credential)
    {
        $this->portalCredentialService->reactivate($credential);

        return back()->with('success', 'Portal access reactivated.');
    }

    public function statistics()
    {
        return Inertia::render('Admissions/PortalCredentials/Statistics', [
            'statistics' => $this->portalCredentialService->statistics(),
        ]);
    }
}
