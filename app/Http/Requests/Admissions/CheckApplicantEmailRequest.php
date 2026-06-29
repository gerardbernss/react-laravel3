<?php

namespace App\Http\Requests\Admissions;

use Illuminate\Foundation\Http\FormRequest;

class CheckApplicantEmailRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => 'required|email',
        ];
    }
}
