<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\PasswordResetLinkRequest;
use App\Services\Auth\PasswordResetLinkService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    public function __construct(private PasswordResetLinkService $passwordResetLinkService)
    {
    }

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
    public function store(PasswordResetLinkRequest $request): RedirectResponse
    {
        $this->passwordResetLinkService->execute($request->validated('email'));

        return back()->with('status', __('We have emailed your password reset link.'));
    }
}
