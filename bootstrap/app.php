<?php

use App\Http\Middleware\CheckPermission;
use App\Http\Middleware\CheckRole;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleCors;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\PreventBackHistory;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        // Add CORS middleware globally
        $middleware->append(HandleCors::class);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            PreventBackHistory::class,
        ]);

        $middleware->api([
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);

        // Configure guest redirects for different guards (unauthenticated users trying to access protected routes)
        $middleware->redirectGuestsTo(function ($request) {
            // Check if the request is for student routes
            if ($request->is('student/*') || $request->is('student')) {
                return route('student.login');
            }
            return route('login');
        });

        // Configure redirects for authenticated users trying to access guest-only routes
        $middleware->redirectUsersTo(function ($request) {
            // Check if the request is for student routes - only redirect if student is authenticated
            if ($request->is('student/*') || $request->is('student')) {
                // Only redirect if authenticated as student, not as admin
                if (\Illuminate\Support\Facades\Auth::guard('student')->check()) {
                    return route('student.dashboard');
                }
                // If not authenticated as student, allow access to student login
                return null;
            }
            return route('dashboard');
        });

        // Register custom middleware aliases
        $middleware->alias([
            'role'             => CheckRole::class,
            'permission'       => CheckPermission::class,
            'guest'            => \App\Http\Middleware\RedirectIfAuthenticated::class,
            'student.enrolled' => \App\Http\Middleware\EnsureEnrolledStudent::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
