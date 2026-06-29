<?php

namespace App\Http\Requests\EmailVerification;

class CheckAltEmailVerificationRequest extends EmailVerificationJsonRequest
{
    protected bool $includeErrorsInResponse = false;

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
