<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterUserRequest;
use App\Services\Auth\UserRegistrationService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function __construct(private UserRegistrationService $userRegistrationService)
    {
    }

    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    /**
     * Handle an incoming registration request.
     */
    public function store(RegisterUserRequest $request): RedirectResponse
    {
        $this->userRegistrationService->execute($request->validated());

        return redirect()->route('verification.notice');
    }
}
