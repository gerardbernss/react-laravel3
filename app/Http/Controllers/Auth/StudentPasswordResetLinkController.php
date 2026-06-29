<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\StudentPasswordResetLinkRequest;
use App\Services\Auth\StudentPasswordResetLinkService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentPasswordResetLinkController extends Controller
{
    public function __construct(private StudentPasswordResetLinkService $studentPasswordResetLinkService)
    {
    }

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
    public function store(StudentPasswordResetLinkRequest $request): RedirectResponse
    {
        $this->studentPasswordResetLinkService->execute($request->validated('email'));

        return back()->with('status', __('We have emailed your password reset link.'));
    }
}
