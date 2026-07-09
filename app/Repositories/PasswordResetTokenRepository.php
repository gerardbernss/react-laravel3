<?php

namespace App\Repositories;

use Illuminate\Support\Facades\DB;

class PasswordResetTokenRepository
{
    /**
     * Returns the password reset token row for the given email, or null if none exists.
     */
    public function findForEmail(string $email): ?object
    {
        return DB::table('password_reset_tokens')->where('email', $email)->first();
    }

    /**
     * Deletes the reset token row for the given email after a successful password reset.
     */
    public function deleteForEmail(string $email): void
    {
        DB::table('password_reset_tokens')->where('email', $email)->delete();
    }

    /**
     * Inserts a new reset token row for the given email with the current timestamp.
     */
    public function create(string $email, string $hashedToken): void
    {
        DB::table('password_reset_tokens')->insert([
            'email' => $email,
            'token' => $hashedToken,
            'created_at' => now(),
        ]);
    }
}
