<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreAttendanceRequest extends FormRequest
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
            'date' => ['required', 'date'],
            'subject_id' => ['required', 'exists:subjects,id'],
            'attendance' => ['required', 'array'],
            'attendance.*.student_enrollment_id' => ['required', 'exists:student_enrollments,id'],
            'attendance.*.status' => ['required', 'in:Present,Absent,Late,Excused'],
            'attendance.*.remarks' => ['nullable', 'string', 'max:255'],
        ];
    }
}
