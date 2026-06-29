<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGradesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'grades' => ['required', 'array'],
            'grades.*.id' => ['required', 'exists:student_enrollment_subjects,id'],
            'grades.*.grade' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'grades.*.grade_status' => ['nullable', 'in:Passed,Failed,INC,DRP,W'],
        ];
    }
}
