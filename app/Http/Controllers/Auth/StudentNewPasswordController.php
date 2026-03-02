<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\PortalCredential;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class StudentNewPasswordController extends Controller
{
    /**
     * Show the student password reset page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/student-reset-password', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]);
    }

    /**
     * Handle an incoming student new password request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        // Find the credential by email (check both personal data email and username)
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

        // Verify the token
        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $credential->getEmailForPasswordReset())
            ->first();

        if (!$resetRecord || !Hash::check($request->token, $resetRecord->token)) {
            throw ValidationException::withMessages([
                'email' => ['This password reset token is invalid.'],
            ]);
        }

        // Check if token has expired (60 minutes)
        if (now()->diffInMinutes($resetRecord->created_at) > 60) {
            throw ValidationException::withMessages([
                'email' => ['This password reset token has expired.'],
            ]);
        }

        // Update the password
        $credential->temporary_password = Hash::make($request->password);
        $credential->password_changed = true;
        $credential->save();

        // Delete the used token
        DB::table('password_reset_tokens')
            ->where('email', $credential->getEmailForPasswordReset())
            ->delete();

        event(new PasswordReset($credential));

        return to_route('login')->with('status', __('Your password has been reset. You can now login with your new password.'));
    }
}
