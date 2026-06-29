<?php

namespace App\Http\Requests\Admissions;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UploadExamResultsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) Auth::user();
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'],
        ];
    }
}
