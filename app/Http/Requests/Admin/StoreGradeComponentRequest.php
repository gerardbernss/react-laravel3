<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreGradeComponentRequest extends FormRequest
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
            'block_section_id' => ['required', 'exists:block_sections,id'],
            'subject_id' => ['required', 'exists:subjects,id'],
            'grading_quarter' => ['required', 'in:Q1,Q2,Q3,Q4'],
            'name' => ['required', 'string', 'max:100'],
            'hps' => ['required', 'numeric', 'min:0.01', 'max:9999'],
            'weight' => ['required', 'numeric', 'min:0.01', 'max:100'],
        ];
    }
}
