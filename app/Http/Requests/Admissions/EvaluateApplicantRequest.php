<?php

namespace App\Http\Requests\Admissions;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class EvaluateApplicantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) Auth::user();
    }

    public function rules(): array
    {
        return [
            'evaluation' => 'required|string|in:approve,revise,reject',
            'remarks'    => 'nullable|string|max:2000',
        ];
    }

    public function messages(): array
    {
        return [
            'evaluation.required' => 'Please select an evaluation outcome.',
            'evaluation.in'       => 'Invalid evaluation outcome selected.',
        ];
    }
}
