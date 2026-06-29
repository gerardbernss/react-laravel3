<?php

namespace App\Http\Requests\EmailVerification;

class CheckEmailVerificationRequest extends EmailVerificationJsonRequest
{
    protected bool $includeErrorsInResponse = false;

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
