<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreEnrollmentPeriodRequest extends FormRequest
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
            'school_year' => ['required', 'string', 'max:20'],
            'semester' => ['required', 'in:First Semester,Second Semester,Summer,Full Year'],
            'type' => ['required', 'in:student,applicant,application'],
            'start_date' => ['nullable', 'date'],
            'close_date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
