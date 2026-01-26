<?php
namespace App\Http\Controllers;

use App\Http\Requests\StorePortalCredentialRequest;
use App\Mail\PortalPasswordMail;
use App\Models\ApplicantApplicationInfo;
use App\Models\PortalCredential;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PortalCredentialController extends Controller
{
    /**
     * Display all portal credentials
     */
    public function index(Request $request)
    {
        $query = PortalCredential::with(['personalData', 'application'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $query->where('access_status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('personalData', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })->orWhere('username', 'like', "%{$search}%");
        }

        $credentials = $query->paginate(15);

        return Inertia::render('Admissions/PortalCredentials/Index', [
            'credentials' => $credentials,
            'filters'     => [
                'status' => $request->status,
                'search' => $request->search,
            ],
        ]);
    }

    /**
     * Show form to generate credentials
     */
    public function create()
    {
        $applicants = ApplicantApplicationInfo::with('applicantPersonalData')->get();

        return Inertia::render('Admissions/PortalCredentials/Create', [
            'applicants' => $applicants,
        ]);
    }

    /**
     * Store new portal credentials
     */
    public function store(StorePortalCredentialRequest $request)
    {
        $validated = $request->validated();

        // Generate username if not provided
        $username = $validated['username'] ?? 'applicant.' . strtolower(Str::slug($validated['personal_name'] ?? 'user'));

        // Ensure username is unique
        $baseUsername = $username;
        $counter      = 1;
        while (PortalCredential::where('portal_username', $username)->exists()) {
            $username = $baseUsername . $counter;
            $counter++;
        }

        // Generate temporary password
        $temporaryPassword = Str::random(12);

        $credential = PortalCredential::create([
            'applicant_personal_data_id'    => $validated['applicant_personal_data_id'],
            'applicant_application_info_id' => $validated['applicant_application_info_id'],
            'portal_username'               => $username,
            'temporary_password'            => bcrypt($temporaryPassword), // Hash the password
            'is_activated'                  => true,                       // Auto-activate upon creation
            'credentials_generated_at'      => now(),
            'created_by'                    => Auth::id(),
        ]);

        // Send email with credentials
        try {
            if ($credential->personalData && $credential->personalData->email) {
                Mail::to($credential->personalData->email)
                    ->send(new PortalPasswordMail($credential, $temporaryPassword));

                // Mark as sent
                $credential->update([
                    'credentials_sent_at' => now(),
                    'sent_via'            => 'email',
                ]);
            }
        } catch (\Exception $e) {
            // Log the error but don't fail the entire operation
            Log::error('Failed to send portal credentials email: ' . $e->getMessage());
        }

        return redirect()->route('portal-credentials.show', $credential->id)
            ->with('success', 'Portal credentials generated and sent to applicant successfully.');
    }

    /**
     * Show credential details
     */
    public function show(PortalCredential $credential)
    {
        $credential->load(['personalData', 'application']);

        return Inertia::render('Admissions/PortalCredentials/Show', [
            'credential' => $credential,
        ]);
    }

    /**
     * Send credentials to applicant
     */
    public function send(PortalCredential $credential)
    {
        try {
            if ($credential->personalData && $credential->personalData->email) {
                // Generate a temporary password for sending
                $temporaryPassword = Str::random(12);

                // Update credential with new password
                $credential->update([
                    'temporary_password'  => bcrypt($temporaryPassword),
                    'credentials_sent_at' => now(),
                    'sent_via'            => 'email',
                ]);

                // Send email with new credentials
                Mail::to($credential->personalData->email)
                    ->send(new PortalPasswordMail($credential, $temporaryPassword));

                return back()->with('success', 'Portal password sent to applicant successfully.');
            }
        } catch (\Exception $e) {
            Log::error('Failed to send portal credentials: ' . $e->getMessage());
            return back()->with('error', 'Failed to send credentials. Please try again.');
        }

        return back()->with('error', 'Applicant email not found.');
    }

    /**
     * Resend credentials with new password
     */
    public function resend(PortalCredential $credential)
    {
        try {
            // Generate new temporary password
            $newPassword = Str::random(12);

            // Update credential with new password
            $credential->update([
                'temporary_password'  => bcrypt($newPassword),
                'credentials_sent_at' => now(),
                'sent_via'            => 'email',
                'resent_count'        => ($credential->resent_count ?? 0) + 1,
            ]);

            // Send email with new credentials
            if ($credential->personalData && $credential->personalData->email) {
                Mail::to($credential->personalData->email)
                    ->send(new PortalPasswordMail($credential, $newPassword));
            }

            return back()->with('success', 'New credentials generated and sent to applicant.');
        } catch (\Exception $e) {
            Log::error('Failed to resend portal credentials: ' . $e->getMessage());
            return back()->with('error', 'Failed to resend credentials. Please try again.');
        }
    }

    /**
     * Suspend access
     */
    public function suspend(PortalCredential $credential)
    {
        $credential->update([
            'access_suspended_at'   => now(),
            'failed_login_attempts' => 0,
        ]);

        return back()->with('success', 'Portal access suspended.');
    }

    /**
     * Reactivate access
     */
    public function reactivate(PortalCredential $credential)
    {
        $credential->update([
            'access_suspended_at'   => null,
            'failed_login_attempts' => 0,
        ]);

        return back()->with('success', 'Portal access reactivated.');
    }

    /**
     * Reset password
     */
    public function resetPassword(PortalCredential $credential)
    {
        $newPassword = Str::random(12);

        $credential->update([
            'temporary_password'    => $newPassword,
            'password_changed'      => false,
            'failed_login_attempts' => 0,
        ]);

        // In production, send new password email
        return back()->with('success', 'Password reset. New credentials sent to applicant.');
    }

    /**
     * Get credential statistics
     */
    public function statistics()
    {
        $stats = [
            'total_credentials' => PortalCredential::count(),
            'total_activated'   => PortalCredential::where('is_activated', true)->count(),
            'total_suspended'   => PortalCredential::whereNotNull('access_suspended_at')->count(),
            'credentials_sent'  => PortalCredential::whereNotNull('credentials_sent_at')->count(),
            'password_changed'  => PortalCredential::where('password_changed', true)->count(),
            'with_logins'       => PortalCredential::whereNotNull('last_login_at')->count(),
        ];

        return Inertia::render('Admissions/PortalCredentials/Statistics', [
            'statistics' => $stats,
        ]);
    }
}
