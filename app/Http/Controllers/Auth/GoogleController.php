<?php

namespace App\Http\Controllers\Auth;

use App\Exceptions\GoogleDomainNotAllowedException;
use App\Http\Controllers\Controller;
use App\Services\Auth\GoogleAuthService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

class GoogleController extends Controller
{
    public function __construct(private GoogleAuthService $googleAuthService)
    {
    }

    /**
     * Redirect to Google OAuth provider.
     */
    public function redirectToGoogle(): RedirectResponse
    {
        return $this->googleAuthService->buildAuthRedirect();
    }

    /**
     * Handle Google OAuth callback.
     */
    public function handleGoogleCallback(): RedirectResponse
    {
        try {
            $this->googleAuthService->authenticate();

            return redirect()->intended(route('dashboard', absolute: false));
        } catch (GoogleDomainNotAllowedException) {
            return redirect()->route('login')->withErrors([
                'email' => 'Your email domain is not allowed to sign in.',
            ]);
        } catch (Throwable $e) {
            Log::error('Google OAuth Error: '.$e->getMessage());

            return redirect()->route('login')->withErrors([
                'email' => 'Google authentication failed. Please try again.',
            ]);
        }
    }
}
