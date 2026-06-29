<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class OpenEnrollmentPeriodRequest extends FormRequest
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
            'start_date' => ['nullable', 'date'],
            'close_date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
