<?php

namespace App\Services\Auth;

use App\Exceptions\GoogleDomainNotAllowedException;
use App\Models\User;
use App\Repositories\RoleRepository;
use App\Repositories\UserRepository;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Contracts\User as SocialiteUser;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthService
{
    public function __construct(
        private UserRepository $userRepository,
        private RoleRepository $roleRepository,
    ) {
    }

    /**
     * Redirects the user to Google's login page.
     * If only one allowed domain is configured, it pre-fills the domain hint on the Google login screen.
     */
    public function buildAuthRedirect(): RedirectResponse
    {
        $allowedDomains = config('services.google.allowed_domains');

        $driver = Socialite::driver('google')->scopes(['openid', 'profile', 'email']);

        if (! empty($allowedDomains) && count($allowedDomains) === 1) {
            $driver->with(['hd' => $allowedDomains[0]]);
        }

        return $driver->redirect();
    }

    /**
     * Handles the Google OAuth callback: finds or creates the matching local user, syncs their Google info, and logs them in.
     *
     * @throws GoogleDomainNotAllowedException if the Google account's email domain is not allowed
     */
    public function authenticate(): User
    {
        $googleUser = Socialite::driver('google')->user();

        $this->ensureDomainAllowed((string) $googleUser->getEmail());

        $user = $this->userRepository->findByGoogleId($googleUser->getId());

        if (! $user) {
            $user = $this->userRepository->findByEmail($googleUser->getEmail());

            if ($user) {
                $this->userRepository->update($user, [
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                ]);
            } else {
                $user = $this->createUserFromGoogle($googleUser);
            }
        }

        Auth::login($user);

        return $user;
    }

    /**
     * Checks that the email's domain is in the configured allowlist.
     * Does nothing if no domain restriction is set.
     *
     * @throws GoogleDomainNotAllowedException if the domain is not permitted
     */
    private function ensureDomainAllowed(string $email): void
    {
        $allowedDomains = config('services.google.allowed_domains');

        if (empty($allowedDomains)) {
            return;
        }

        $emailDomain = strtolower(substr(strrchr($email, '@'), 1) ?: '');

        if (! in_array($emailDomain, array_map('strtolower', $allowedDomains), true)) {
            throw new GoogleDomainNotAllowedException();
        }
    }

    /**
     * Creates a new local user from the Google profile and assigns them the default 'base' role.
     */
    private function createUserFromGoogle(SocialiteUser $googleUser): User
    {
        $newUser = $this->userRepository->createFromGoogle($googleUser);

        $defaultRole = $this->roleRepository->findBySlug('base');

        if ($defaultRole) {
            $this->userRepository->assignRole($newUser, $defaultRole);
        }

        return $newUser;
    }
}
