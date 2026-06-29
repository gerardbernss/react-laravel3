<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\Auth\PasswordConfirmationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ConfirmablePasswordController extends Controller
{
    public function __construct(private PasswordConfirmationService $passwordConfirmationService)
    {
    }

    /**
     * Show the confirm password page.
     */
    public function show(): Response
    {
        return Inertia::render('auth/confirm-password');
    }

    /**
     * Confirm the user's password.
     */
    public function store(Request $request): RedirectResponse
    {
        $this->passwordConfirmationService->execute($request);

        return redirect()->intended(route('dashboard', absolute: false));
    }
}
