<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\StudentLoginRequest;
use App\Services\Auth\StudentLoginService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class StudentLoginController extends Controller
{
    public function __construct(private StudentLoginService $studentLoginService)
    {
    }

    /**
     * Show the student login page.
     */
    public function create(Request $request): Response|RedirectResponse
    {
        if ($route = $this->studentLoginService->guestRedirectRouteName()) {
            return redirect()->route($route);
        }

        return Inertia::render('auth/student-login', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming student authentication request.
     */
    public function store(StudentLoginRequest $request): RedirectResponse
    {
        try {
            $credential = $this->studentLoginService->attempt($request);
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors());
        }

        return redirect()->intended(route($this->studentLoginService->dashboardRouteFor($credential)));
    }

    /**
     * Destroy an authenticated student session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $this->studentLoginService->logout($request);

        return redirect('/student/login');
    }
}
