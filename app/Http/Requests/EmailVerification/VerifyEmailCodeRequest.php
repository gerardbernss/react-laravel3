<?php

namespace App\Http\Requests\EmailVerification;

class VerifyEmailCodeRequest extends EmailVerificationJsonRequest
{
    protected string $invalidMessage = 'Invalid input';

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'email'],
            'code' => ['required', 'string', 'size:6'],
        ];
    }
}
