<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\PortalCredential;
use App\Models\User;
use App\Notifications\StudentResetPasswordNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    /**
     * Show the password reset link request page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming password reset link request.
     * Handles both regular users and students.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        // First, try to find a regular user
        $user = User::where('email', $request->email)->first();

        if ($user) {
            // Send reset link for regular user
            $status = Password::sendResetLink(
                $request->only('email')
            );

            if ($status == Password::RESET_LINK_SENT) {
                return back()->with('status', __('We have emailed your password reset link.'));
            }

            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        // If not a regular user, try to find a student portal credential
        $credential = PortalCredential::with('personalData')
            ->where(function ($query) use ($request) {
                $query->whereHas('personalData', function ($q) use ($request) {
                    $q->where('email', $request->email);
                })->orWhere('username', $request->email);
            })
            ->first();

        if ($credential) {
            // Send reset link for student
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

        // No user or student found
        throw ValidationException::withMessages([
            'email' => ['We could not find an account with that email address.'],
        ]);
    }
}
