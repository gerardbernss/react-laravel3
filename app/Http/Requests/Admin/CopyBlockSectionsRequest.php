<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class CopyBlockSectionsRequest extends FormRequest
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
            'from_school_year' => ['required', 'string'],
            'to_school_year' => ['required', 'string', 'different:from_school_year'],
        ];
    }
}
