<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureEnrolledStudent
{
    public function handle(Request $request, Closure $next): Response
    {
        $credential   = Auth::guard('student')->user();
        $studentRecord = $credential?->personalData?->student;

        if (!$studentRecord) {
            return redirect()->route('applicant.dashboard')
                ->with('warning', 'This page is only available to enrolled students.');
        }

        return $next($request);
    }
}
