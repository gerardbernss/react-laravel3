<?php

namespace App\Http\Requests\EmailVerification;

use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

abstract class EmailVerificationJsonRequest extends FormRequest
{
    protected string $invalidMessage = 'Invalid email address';

    protected bool $includeErrorsInResponse = true;

    /**
     * Reproduce this endpoint's original {success, message[, errors]} JSON shape on failure.
     */
    protected function failedValidation(ValidatorContract $validator): void
    {
        $payload = [
            'success' => false,
            'message' => $this->invalidMessage,
        ];

        if ($this->includeErrorsInResponse) {
            $payload['errors'] = $validator->errors();
        }

        throw new HttpResponseException(response()->json($payload, 422));
    }
}
