<?php

namespace App\Services\Auth;

use App\Models\PortalCredential;
use App\Repositories\PortalCredentialRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class StudentLoginService
{
    public function __construct(private PortalCredentialRepository $portalCredentialRepository)
    {
    }

    /**
     * Authenticates a student portal login: verifies the username exists, checks account status,
     * validates the password (tracking failed attempts), records the login, and regenerates the session.
     *
     * @throws ValidationException if credentials are wrong, the account is suspended, or the account is inactive
     */
    public function attempt(Request $request): PortalCredential
    {
        $credential = $this->portalCredentialRepository->findByUsername($request->string('username'));

        if (! $credential) {
            throw ValidationException::withMessages([
                'username' => 'The provided credentials do not match our records.',
            ]);
        }

        $this->ensureAccountIsActive($credential);
        $this->verifyPassword($credential, $request->string('password'));

        $this->portalCredentialRepository->recordLogin($credential);

        Auth::guard('student')->login($credential, $request->boolean('remember'));

        $request->session()->regenerate();

        return $credential;
    }

    /**
     * Returns the appropriate dashboard route for the credential: student dashboard if a student record exists, otherwise the applicant dashboard.
     */
    public function dashboardRouteFor(PortalCredential $credential): string
    {
        return $credential->personalData?->student ? 'student.dashboard' : 'applicant.dashboard';
    }

    /**
     * Route name to send an already-logged-in student to, or null if not logged in.
     */
    public function guestRedirectRouteName(): ?string
    {
        if (! Auth::guard('student')->check()) {
            return null;
        }

        return $this->dashboardRouteFor(Auth::guard('student')->user());
    }

    /**
     * Logs the student out and invalidates the session.
     */
    public function logout(Request $request): void
    {
        Auth::guard('student')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();
    }

    /**
     * Throws if the account is suspended or inactive, preventing login before the password is checked.
     *
     * @throws ValidationException
     */
    private function ensureAccountIsActive(PortalCredential $credential): void
    {
        if ($credential->access_status === 'Suspended') {
            throw ValidationException::withMessages([
                'username' => 'Your account has been suspended due to too many failed login attempts. Please contact the admissions office.',
            ]);
        }

        if ($credential->access_status === 'Inactive') {
            throw ValidationException::withMessages([
                'username' => 'Your account is inactive. Please contact the admissions office.',
            ]);
        }
    }

    /**
     * Checks the password against the stored hash and increments the failed-attempt counter on mismatch.
     * Shows a remaining-attempts warning when 3 or fewer tries are left before the account is locked.
     *
     * @throws ValidationException if the password does not match
     */
    private function verifyPassword(PortalCredential $credential, string $password): void
    {
        if (Hash::check($password, $credential->temporary_password)) {
            return;
        }

        $this->portalCredentialRepository->incrementLoginAttempts($credential);

        $attemptsLeft = 5 - $credential->login_attempts;
        $message = 'The provided credentials do not match our records.';

        if ($attemptsLeft > 0 && $attemptsLeft <= 3) {
            $message .= " You have {$attemptsLeft} attempt(s) remaining.";
        }

        throw ValidationException::withMessages([
            'username' => $message,
        ]);
    }
}
