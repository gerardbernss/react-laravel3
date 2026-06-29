<?php

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateAttendanceReasonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) Auth::guard('student')->user();
    }

    public function rules(): array
    {
        return [
            'reason' => ['nullable', 'string', 'max:500'],
        ];
    }
}
