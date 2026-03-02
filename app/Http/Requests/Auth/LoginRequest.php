<?php

namespace App\Http\Requests\Auth;

use App\Models\PortalCredential;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Track which guard was used for authentication.
     */
    public ?string $authenticatedGuard = null;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     * Tries admin (web) guard first, then student guard.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        // Try admin/staff login first (web guard)
        if (Auth::guard('web')->attempt($this->only('email', 'password'), $this->boolean('remember'))) {
            $this->authenticatedGuard = 'web';
            RateLimiter::clear($this->throttleKey());
            return;
        }

        // Try student login (student guard) - uses email as username
        $credential = PortalCredential::where('username', $this->email)->first();

        if ($credential) {
            // Check if account is suspended
            if ($credential->access_status === 'Suspended') {
                throw ValidationException::withMessages([
                    'email' => 'Your account has been suspended. Please contact the admissions office.',
                ]);
            }

            // Check if account is inactive
            if ($credential->access_status === 'Inactive') {
                throw ValidationException::withMessages([
                    'email' => 'Your account is inactive. Please contact the admissions office.',
                ]);
            }

            // Verify password
            if (Hash::check($this->password, $credential->temporary_password)) {
                // Record the login
                $credential->recordLogin();

                // Login using student guard
                Auth::guard('student')->login($credential, $this->boolean('remember'));
                $this->authenticatedGuard = 'student';
                RateLimiter::clear($this->throttleKey());
                return;
            }

            // Increment failed attempts for student
            $credential->incrementLoginAttempts();
        }

        // Neither guard authenticated
        RateLimiter::hit($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => __('auth.failed'),
        ]);
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => __('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return $this->string('email')
            ->lower()
            ->append('|'.$this->ip())
            ->transliterate()
            ->value();
    }
}
