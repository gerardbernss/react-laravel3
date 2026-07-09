<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\DashboardService;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(private DashboardService $dashboardService)
    {
    }

    /**
     * Render the dashboard — faculty users see their assigned sections and subjects while admins see school-wide stats.
     */
    public function index(): Response
    {
        /** @var \App\Models\User|null $user */
        $user = Auth::user();

        $data = $user && $user->hasRole('faculty')
            ? $this->dashboardService->facultyDashboardData($user)
            : $this->dashboardService->adminDashboardData();

        return Inertia::render('dashboard', $data);
    }
}
