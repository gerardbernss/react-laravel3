<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFeeRequest extends FormRequest
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
            'code' => ['required', 'string', 'max:20'],
            'category' => ['required', 'in:tuition,miscellaneous,laboratory,special'],
            'is_per_unit' => ['boolean'],
            'is_required' => ['boolean'],
            'school_level' => ['required', 'in:all,LES,JHS,SHS'],
            'school_year' => ['required', 'string', 'max:20'],
            'semester' => ['required', 'in:1st Semester,2nd Semester,Summer,Yearly'],
            'amount' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'effective_date' => ['nullable', 'date'],
            'is_active' => ['boolean'],
        ];
    }
}
