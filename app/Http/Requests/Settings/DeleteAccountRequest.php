<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class DeleteAccountRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * Google OAuth users have no password to confirm, so the rule is skipped for them.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        if ($this->user()->hasGoogleAccount()) {
            return [];
        }

        return [
            'password' => ['required', 'current_password'],
        ];
    }
}
