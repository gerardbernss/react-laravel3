<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class GoogleController extends Controller
{
    /**
     * Redirect to Google OAuth provider.
     */
    public function redirectToGoogle(): RedirectResponse
    {
        $allowedDomains = config('services.google.allowed_domains');

        $driver = Socialite::driver('google')
            ->scopes(['openid', 'profile', 'email']);

        // Provide domain hint to Google if a single domain is configured
        if (!empty($allowedDomains) && count($allowedDomains) === 1) {
            $driver->with(['hd' => $allowedDomains[0]]);
        }

        return $driver->redirect();
    }

    /**
     * Handle Google OAuth callback.
     */
    public function handleGoogleCallback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();

            // Enforce allowed domain(s)
            $allowedDomains = config('services.google.allowed_domains');
            if (!empty($allowedDomains)) {
                $email = (string) $googleUser->getEmail();
                $emailDomain = strtolower(substr(strrchr($email, '@'), 1) ?: '');

                $isAllowed = in_array($emailDomain, array_map('strtolower', $allowedDomains), true);

                if (! $isAllowed) {
                    return redirect()->route('login')->withErrors([
                        'email' => 'Your email domain is not allowed to sign in.',
                    ]);
                }
            }

            // Check if user already exists with this Google ID
            $user = User::where('google_id', $googleUser->getId())->first();

            if ($user) {
                // User exists, log them in
                Auth::login($user);

                return redirect()->intended(route('dashboard', absolute: false));
            }

            // Check if user exists with same email but different Google ID
            $existingUser = User::where('email', $googleUser->getEmail())->first();

            if ($existingUser) {
                // Link Google account to existing user
                $existingUser->update([
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                ]);

                Auth::login($existingUser);

                return redirect()->intended(route('dashboard', absolute: false));
            }

            // Create new user
            $newUser = User::create([
                'name' => $googleUser->getName(),
                'email' => $googleUser->getEmail(),
                'google_id' => $googleUser->getId(),
                'avatar' => $googleUser->getAvatar(),
                'email_verified_at' => now(), // Google emails are pre-verified
                'password' => bcrypt(str()->random(32)), // Random password since they'll use Google
            ]);

            // Assign default role (you can customize this logic)
            $defaultRole = Role::where('slug', 'base')->first();
            if ($defaultRole) {
                $newUser->assignRole($defaultRole);
            }

            Auth::login($newUser);

            return redirect()->intended(route('dashboard', absolute: false));

        } catch (\Exception $e) {
            \Log::error('Google OAuth Error: ' . $e->getMessage());
            return redirect()->route('login')->withErrors([
                'email' => 'Google authentication failed. Please try again.',
            ]);
        }
    }
}
