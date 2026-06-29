<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreApplicantExamAssignmentRequest extends FormRequest
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
            'applicant_id' => ['required', 'exists:applicants,id'],
            'exam_schedule_id' => ['required', 'exists:exam_schedules,id'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
