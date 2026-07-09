<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSubjectScheduleRequest extends FormRequest
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
            'days' => ['required', 'string', 'max:10'],
            'time' => ['required', 'string', 'max:20'],
            'room' => ['nullable', 'string', 'max:100'],
            'code' => ['nullable', 'string', 'max:1'],
            'teacher_id' => ['nullable', 'integer', 'exists:users,id'],
            'block_section_id' => ['nullable', 'integer', 'exists:block_sections,id'],
        ];
    }
}
