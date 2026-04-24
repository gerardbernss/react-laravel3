<?php
namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root Blade template loaded on the very first page visit.
     * Inertia uses this to bootstrap the React app; all subsequent
     * navigation happens via XHR without a full page reload.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     */
    protected $rootView = 'app';

    /**
     * Returns the current asset version string.
     *
     * Inertia compares this on each request. When it changes (e.g. after a
     * deployment), the browser performs a hard reload to pick up the new
     * assets instead of using a stale cached version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define props that are automatically available on every React page.
     *
     * This method runs on every Inertia request. Data returned here is merged
     * into the page props alongside any controller-specific props, so every
     * React component can access auth, flash messages, and global config
     * without the controller needing to pass them explicitly.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        // ── Student guard ─────────────────────────────────────────────────────
        // The app has two separate auth guards: 'web' (admin/staff/faculty) and
        // 'student' (portal users). We resolve both independently here because
        // a student and an admin could theoretically be authenticated in the
        // same browser session (different cookies / guard drivers).
        $student     = Auth::guard('student')->user();
        $studentData = null;

        if ($student) {
            $personalData    = $student->personalData;
            $studentRecord   = $personalData?->student;
            $isApplicant     = $studentRecord === null;

            $studentData  = [
                'id'               => $student->id,
                'username'         => $student->username,
                // Flags whether the student has completed their mandatory first-
                // login password change. The portal redirects to the change-
                // password page when this is false.
                'password_changed' => $student->password_changed,
                'name'             => $personalData
                    ? "{$personalData->first_name} {$personalData->last_name}"
                    : $student->username,
                'email'            => $personalData->email ?? $student->username,
                'personal_data'    => $personalData ? [
                    'first_name' => $personalData->first_name,
                    'last_name'  => $personalData->last_name,
                ] : null,
                // True when the portal user is a new applicant (no Student record yet).
                // Used by the frontend to show the applicant-only portal view.
                'is_applicant'     => $isApplicant,
            ];
        }

        // ── Web (admin) guard ─────────────────────────────────────────────────
        // Load roles and permissions eagerly so every page has access to RBAC
        // data without triggering additional queries per request.
        $webUser  = Auth::guard('web')->user();
        $userData = null;

        if ($webUser) {
            $userData = $webUser->load(['roles.permissions', 'role']);
        }

        return [
            ...parent::share($request),
            'name'  => config('app.name'),
            // A random quote displayed in the auth layout sidebar (decorative).
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth'  => [
                'user'    => $userData,
                'student' => $studentData,
            ],
            // Flash messages are wrapped in closures (lazy evaluation) so the
            // session is only read when Inertia actually serialises the response,
            // not on every middleware stack execution.
            'flash' => [
                'message' => fn () => $request->session()->get('message'),
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
                'info'    => fn () => $request->session()->get('info'),
                'warning' => fn () => $request->session()->get('warning'),
            ],
            // Persist sidebar open/closed state across page navigations via a
            // cookie. Defaults to open when the cookie is absent.
            'sidebarOpen'     => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            // Also lazy — queries SemesterPeriod only when the response is built,
            // avoiding a DB hit on every middleware tick.
            'currentSemester' => fn () => [
                'name'        => \App\Models\SemesterPeriod::getCurrentSemester(),
                'school_year' => \App\Models\SemesterPeriod::getCurrentSchoolYear(),
            ],
        ];
    }
}
