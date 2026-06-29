<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdatePasswordRequest;
use App\Services\Settings\PasswordUpdateService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PasswordController extends Controller
{
    public function __construct(private PasswordUpdateService $passwordUpdateService)
    {
    }

    /**
     * Show the user's password settings page.
     */
    public function edit(): Response
    {
        return Inertia::render('settings/password');
    }

    /**
     * Update the user's password.
     */
    public function update(UpdatePasswordRequest $request): RedirectResponse
    {
        $this->passwordUpdateService->execute($request->user(), $request->validated('password'));

        return back();
    }
}
