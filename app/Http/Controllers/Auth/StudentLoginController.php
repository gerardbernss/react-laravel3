<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\PortalCredential;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class StudentLoginController extends Controller
{
    /**
     * Show the student login page.
     */
    public function create(Request $request): Response|RedirectResponse
    {
        // If already logged in as student, redirect to appropriate dashboard
        if (Auth::guard('student')->check()) {
            $credential = Auth::guard('student')->user();
            $studentRecord = $credential->personalData?->student;
            return redirect()->route($studentRecord ? 'student.dashboard' : 'applicant.dashboard');
        }

        return Inertia::render('auth/student-login', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming student authentication request.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'username' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        // Find the portal credential by username (email)
        $credential = PortalCredential::where('username', $request->username)->first();

        if (! $credential) {
            return back()->withErrors([
                'username' => 'The provided credentials do not match our records.',
            ]);
        }

        // Check if account is suspended
        if ($credential->access_status === 'Suspended') {
            return back()->withErrors([
                'username' => 'Your account has been suspended due to too many failed login attempts. Please contact the admissions office.',
            ]);
        }

        // Check if account is inactive
        if ($credential->access_status === 'Inactive') {
            return back()->withErrors([
                'username' => 'Your account is inactive. Please contact the admissions office.',
            ]);
        }

        // Verify password
        if (! Hash::check($request->password, $credential->temporary_password)) {
            // Increment login attempts
            $credential->incrementLoginAttempts();

            $attemptsLeft = 5 - $credential->login_attempts;
            $message = 'The provided credentials do not match our records.';

            if ($attemptsLeft > 0 && $attemptsLeft <= 3) {
                $message .= " You have {$attemptsLeft} attempt(s) remaining.";
            }

            return back()->withErrors([
                'username' => $message,
            ]);
        }

        // Login successful - record the login
        $credential->recordLogin();

        // Login using the student guard
        Auth::guard('student')->login($credential, $request->boolean('remember'));

        $request->session()->regenerate();

        $studentRecord = $credential->personalData?->student;
        $defaultRoute = $studentRecord ? route('student.dashboard') : route('applicant.dashboard');
        return redirect()->intended($defaultRoute);
    }

    /**
     * Destroy an authenticated student session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('student')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/student/login');
    }
}
