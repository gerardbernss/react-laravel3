<?php

namespace App\Services\Auth;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SessionGuardService
{
    /**
     * Route name to send an already-authenticated visitor to, or null if a guest.
     */
    public function guestRedirectRoute(): ?string
    {
        if (Auth::guard('web')->check()) {
            return 'dashboard';
        }

        if (Auth::guard('student')->check()) {
            return 'student.dashboard';
        }

        return null;
    }

    /**
     * Returns the dashboard route name for the given guard ('student' → student dashboard, anything else → admin dashboard).
     */
    public function dashboardRouteName(string $guard): string
    {
        return $guard === 'student' ? 'student.dashboard' : 'dashboard';
    }

    /**
     * Logs out both the web and student guards, then destroys the session and rotates the CSRF token.
     */
    public function logoutAllGuards(Request $request): void
    {
        Auth::guard('web')->logout();
        Auth::guard('student')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();
    }
}
