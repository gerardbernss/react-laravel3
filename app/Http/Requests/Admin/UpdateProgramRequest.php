<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProgramRequest extends FormRequest
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
            'code' => ['required', 'string', 'max:20', 'unique:programs,code,'.$this->route('program')->id],
            'description' => ['required', 'string', 'max:255'],
            'school' => ['required', 'in:Laboratory Elementary School,Junior High School,Senior High School'],
            'is_active' => ['boolean'],
            'max_load' => ['required', 'integer', 'min:0', 'max:100'],
        ];
    }
}
