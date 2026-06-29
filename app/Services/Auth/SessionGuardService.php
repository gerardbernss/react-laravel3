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

    public function dashboardRouteName(string $guard): string
    {
        return $guard === 'student' ? 'student.dashboard' : 'dashboard';
    }

    public function logoutAllGuards(Request $request): void
    {
        Auth::guard('web')->logout();
        Auth::guard('student')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();
    }
}
