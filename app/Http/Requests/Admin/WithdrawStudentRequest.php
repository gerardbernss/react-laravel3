<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class WithdrawStudentRequest extends FormRequest
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
            'withdrawal_type' => ['required', 'in:during_enrollment,after_classes'],
            'refund_amount' => ['required', 'numeric', 'min:0'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
