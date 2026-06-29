<?php

namespace App\Http\Requests\Admissions;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class ConfirmExamResultsImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) Auth::user();
    }

    public function rules(): array
    {
        return [
            'overwrite' => ['required', 'boolean'],
        ];
    }
}
