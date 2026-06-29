<?php

namespace App\Http\Requests\EmailVerification;

class SendEmailVerificationCodeRequest extends EmailVerificationJsonRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'email'],
        ];
    }
}
