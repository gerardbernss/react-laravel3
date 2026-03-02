<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\PortalCredential;
use App\Notifications\StudentResetPasswordNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class StudentPasswordResetLinkController extends Controller
{
    /**
     * Show the student password reset link request page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/student-forgot-password', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming student password reset link request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        // Find portal credential by email (check both personal data email and username)
        $credential = PortalCredential::with('personalData')
            ->where(function ($query) use ($request) {
                $query->whereHas('personalData', function ($q) use ($request) {
                    $q->where('email', $request->email);
                })->orWhere('username', $request->email);
            })
            ->first();

        if (!$credential) {
            throw ValidationException::withMessages([
                'email' => ['We could not find a student portal account with that email address.'],
            ]);
        }

        // Create a password reset token manually
        $token = Str::random(64);
        $email = $credential->getEmailForPasswordReset();

        // Delete any existing tokens for this email
        DB::table('password_reset_tokens')->where('email', $email)->delete();

        // Insert new token
        DB::table('password_reset_tokens')->insert([
            'email' => $email,
            'token' => Hash::make($token),
            'created_at' => now(),
        ]);

        // Send the reset notification
        $credential->notify(new StudentResetPasswordNotification($token));

        return back()->with('status', __('We have emailed your password reset link.'));
    }
}
