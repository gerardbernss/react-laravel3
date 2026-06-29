<?php

namespace App\Repositories;

use Illuminate\Support\Facades\DB;

class PasswordResetTokenRepository
{
    public function findForEmail(string $email): ?object
    {
        return DB::table('password_reset_tokens')->where('email', $email)->first();
    }

    public function deleteForEmail(string $email): void
    {
        DB::table('password_reset_tokens')->where('email', $email)->delete();
    }

    public function create(string $email, string $hashedToken): void
    {
        DB::table('password_reset_tokens')->insert([
            'email' => $email,
            'token' => $hashedToken,
            'created_at' => now(),
        ]);
    }
}
