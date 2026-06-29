<?php

namespace App\Http\Requests\EmailVerification;

class VerifyAltEmailCodeRequest extends EmailVerificationJsonRequest
{
    protected string $invalidMessage = 'Invalid input';

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'alt_email' => ['required', 'email'],
            'code' => ['required', 'string', 'size:6'],
        ];
    }
}
