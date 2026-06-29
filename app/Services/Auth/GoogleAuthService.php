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
     * @throws GoogleDomainNotAllowedException
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
