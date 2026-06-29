<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\StudentNewPasswordRequest;
use App\Services\Auth\StudentPasswordResetService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentNewPasswordController extends Controller
{
    public function __construct(private StudentPasswordResetService $studentPasswordResetService)
    {
    }

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
    public function store(StudentNewPasswordRequest $request): RedirectResponse
    {
        $this->studentPasswordResetService->execute(
            $request->validated('email'),
            $request->validated('token'),
            $request->validated('password'),
        );

        return to_route('login')->with('status', __('Your password has been reset. You can now login with your new password.'));
    }
}
