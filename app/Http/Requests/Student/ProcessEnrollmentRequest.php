<?php

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class ProcessEnrollmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) Auth::guard('student')->user();
    }

    public function rules(): array
    {
        return [
            'discount_ids' => ['nullable', 'array'],
            'discount_ids.*' => ['exists:discount_types,id'],
            'total_amount' => ['required', 'numeric', 'min:0'],
            'mode_of_payment' => ['nullable', 'in:cash,check,bank_transfer,gcash,maya'],
            'payment_plan' => ['required', 'in:full,installment'],
        ];
    }
}
