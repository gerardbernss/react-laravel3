<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class BulkStoreApplicantExamAssignmentRequest extends FormRequest
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
            'applicant_ids' => ['required', 'array', 'min:1'],
            'applicant_ids.*' => ['exists:applicants,id'],
            'exam_schedule_id' => ['required', 'exists:exam_schedules,id'],
        ];
    }
}
