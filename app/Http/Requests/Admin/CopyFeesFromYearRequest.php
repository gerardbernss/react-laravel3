<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class CopyFeesFromYearRequest extends FormRequest
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
            'source_year' => ['required', 'string'],
            'target_year' => ['required', 'string', 'different:source_year'],
            'adjust_percentage' => ['nullable', 'numeric', 'min:-100', 'max:100'],
        ];
    }
}
