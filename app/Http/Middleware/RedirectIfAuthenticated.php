<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RedirectIfAuthenticated
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$guards): Response
    {
        // If no guards specified, only check the specified guard(s)
        // Don't check all guards - this allows students to login even if admin is logged in
        $guards = empty($guards) ? ['web'] : $guards;

        foreach ($guards as $guard) {
            if (Auth::guard($guard)->check()) {
                // Redirect to appropriate dashboard based on guard
                if ($guard === 'student') {
                    return redirect()->route('student.dashboard');
                }
                return redirect()->route('dashboard');
            }
        }

        return $next($request);
    }
}
