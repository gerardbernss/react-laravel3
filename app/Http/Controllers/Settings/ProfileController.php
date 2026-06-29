<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\DeleteAccountRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Services\Settings\AccountDeletionService;
use App\Services\Settings\ProfileUpdateService;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function __construct(
        private ProfileUpdateService $profileUpdateService,
        private AccountDeletionService $accountDeletionService,
    ) {
    }

    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update the user's profile settings.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $this->profileUpdateService->execute($request->user(), $request->validated());

        return to_route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(DeleteAccountRequest $request): RedirectResponse
    {
        $this->accountDeletionService->execute($request);

        return redirect('/');
    }
}
