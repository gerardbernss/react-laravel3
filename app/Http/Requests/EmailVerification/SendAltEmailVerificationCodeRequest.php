<?php

namespace App\Http\Requests\EmailVerification;

class SendAltEmailVerificationCodeRequest extends EmailVerificationJsonRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'alt_email' => ['required', 'email'],
        ];
    }
}
