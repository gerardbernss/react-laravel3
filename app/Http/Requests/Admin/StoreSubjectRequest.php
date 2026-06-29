<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreSubjectRequest extends FormRequest
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
            'code' => ['required', 'string', 'max:50', 'unique:subjects,code'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'units' => ['required', 'integer', 'min:1', 'max:10'],
            'type' => ['required', 'in:Core,Major,Minor,Elective,Specialized'],
            'grade_level' => ['nullable', 'string'],
            'semester' => ['nullable', 'in:First Semester,Second Semester,Summer,Full Year'],
            'days' => ['nullable', 'string', 'max:10'],
            'time' => ['nullable', 'string', 'max:20'],
            'room' => ['nullable', 'string', 'max:100'],
            'user_id' => ['nullable', 'exists:users,id'],
            'is_active' => ['boolean'],
        ];
    }
}
