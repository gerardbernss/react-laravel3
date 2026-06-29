<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreBlockSectionRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:block_sections,code'],
            'grade_level' => ['required', 'string'],
            'school_year' => ['required', 'string'],
            'semester' => ['nullable', 'in:First Semester,Second Semester,Summer,Full Year'],
            'adviser' => ['nullable', 'string', 'max:255'],
            'room' => ['nullable', 'string', 'max:50'],
            'capacity' => ['required', 'integer', 'min:1', 'max:100'],
            'schedule' => ['nullable', 'string'],
            'is_active' => ['boolean'],
            'subjects' => ['nullable', 'array'],
            'subjects.*.subject_id' => ['required', 'exists:subjects,id'],
        ];
    }
}
