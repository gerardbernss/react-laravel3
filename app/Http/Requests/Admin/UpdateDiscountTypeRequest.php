<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDiscountTypeRequest extends FormRequest
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
            'code' => ['required', 'string', 'max:20', 'unique:discount_types,code,' . $this->route('discountType')->id],
            'discount_type' => ['required', 'in:percentage,fixed_amount'],
            'value' => ['required', 'numeric', 'min:0'],
            'applies_to' => ['required', 'in:tuition_only,all_fees,miscellaneous_only'],
            'requires_verification' => ['boolean'],
            'is_stackable' => ['boolean'],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ];
    }
}
