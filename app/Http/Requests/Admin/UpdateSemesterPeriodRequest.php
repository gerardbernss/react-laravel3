<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSemesterPeriodRequest extends FormRequest
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
            'start_month' => ['required', 'integer', 'min:1', 'max:12'],
            'end_month' => ['required', 'integer', 'min:1', 'max:12'],
            'is_active' => ['required', 'boolean'],
        ];
    }
}
