<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Services\Auth\SessionGuardService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    public function __construct(private SessionGuardService $sessionGuardService)
    {
    }

    /**
     * Show the login page.
     */
    public function create(Request $request): Response|RedirectResponse
    {
        if ($route = $this->sessionGuardService->guestRedirectRoute()) {
            return redirect()->route($route);
        }

        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $routeName = $this->sessionGuardService->dashboardRouteName($request->authenticatedGuard);

        return redirect()->intended(route($routeName, absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $this->sessionGuardService->logoutAllGuards($request);

        return redirect('/');
    }
}
