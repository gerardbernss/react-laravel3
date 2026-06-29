<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;

/**
 * Cache-backed 6-digit email verification codes, shared by the primary and
 * alternate email fields used across the applicant/student forms.
 */
class EmailVerificationCodeService
{
    private const CODE_TTL_MINUTES = 10;

    private const RATE_LIMIT_SECONDS = 60;

    private const VERIFIED_TTL_HOURS = 24;

    public function canSend(string $email): bool
    {
        $lastSent = Cache::get("email_verification_sent:{$email}");

        return ! ($lastSent && now()->diffInSeconds($lastSent) < self::RATE_LIMIT_SECONDS);
    }

    public function send(string $email): void
    {
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        Cache::put("email_verification:{$email}", $code, now()->addMinutes(self::CODE_TTL_MINUTES));
        Cache::put("email_verification_sent:{$email}", now(), now()->addMinute());

        Mail::send([], [], function ($message) use ($email, $code) {
            $message->to($email)
                ->subject('Email Verification Code')
                ->html($this->codeEmailHtml($code));
        });
    }

    /**
     * @return array{success: bool, message?: string}
     */
    public function verify(string $email, string $code): array
    {
        $cachedCode = Cache::get("email_verification:{$email}");

        if (! $cachedCode) {
            return ['success' => false, 'message' => 'Verification code has expired or does not exist'];
        }

        if ($cachedCode !== $code) {
            return ['success' => false, 'message' => 'Invalid verification code'];
        }

        Cache::put("email_verified:{$email}", true, now()->addHours(self::VERIFIED_TTL_HOURS));
        Cache::forget("email_verification:{$email}");
        Cache::forget("email_verification_sent:{$email}");

        return ['success' => true];
    }

    public function isVerified(string $email): bool
    {
        return Cache::get("email_verified:{$email}", false);
    }

    private function codeEmailHtml(string $code): string
    {
        return "
            <h2>Email Verification</h2>
            <p>Your email verification code is: <strong>{$code}</strong></p>
            <p>This code will expire in 10 minutes.</p>
            <p>If you did not request this code, please ignore this email.</p>
        ";
    }
}
