<?php
namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        // Get student if logged in via student guard
        $student = Auth::guard('student')->user();
        $studentData = null;

        if ($student) {
            $personalData = $student->personalData;
            $studentData = [
                'id' => $student->id,
                'username' => $student->username,
                'password_changed' => $student->password_changed,
                'name' => $personalData ? "{$personalData->first_name} {$personalData->last_name}" : $student->username,
                'email' => $personalData->email ?? $student->username,
                'personal_data' => $personalData ? [
                    'first_name' => $personalData->first_name,
                    'last_name' => $personalData->last_name,
                ] : null,
            ];
        }

        // Get admin user explicitly from web guard
        $webUser = Auth::guard('web')->user();
        $userData = null;

        if ($webUser) {
            $userData = $webUser->load(['roles.permissions', 'role']);
        }

        return [
             ...parent::share($request),
            'name'        => config('app.name'),
            'quote'       => ['message' => trim($message), 'author' => trim($author)],
            'auth'        => [
                'user' => $userData,
                'student' => $studentData,
            ],
            // return message from crud operation
            'flash'       => [
                'message' => fn() => $request->session()->get('message'),
                'success' => fn() => $request->session()->get('success'),
                'error'   => fn()   => $request->session()->get('error'),
                'info'    => fn()    => $request->session()->get('info'),
                'warning' => fn() => $request->session()->get('warning'),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
