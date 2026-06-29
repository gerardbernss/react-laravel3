<?php

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateStudentPersonalInfoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) Auth::guard('student')->user();
    }

    public function rules(): array
    {
        return [
            'alt_email' => ['nullable', 'email'],
            'mobile_number' => ['nullable', 'string', 'max:20'],
            'present_street' => ['nullable', 'string', 'max:255'],
            'present_brgy' => ['nullable', 'string', 'max:255'],
            'present_city' => ['nullable', 'string', 'max:255'],
            'present_province' => ['nullable', 'string', 'max:255'],
            'present_zip' => ['nullable', 'string', 'max:10'],
            'permanent_street' => ['nullable', 'string', 'max:255'],
            'permanent_brgy' => ['nullable', 'string', 'max:255'],
            'permanent_city' => ['nullable', 'string', 'max:255'],
            'permanent_province' => ['nullable', 'string', 'max:255'],
            'permanent_zip' => ['nullable', 'string', 'max:10'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_mobile_phone' => ['nullable', 'string', 'max:20'],
        ];
    }
}
