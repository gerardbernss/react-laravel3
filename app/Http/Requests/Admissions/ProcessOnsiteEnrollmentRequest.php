<?php

namespace App\Http\Requests\Admissions;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class ProcessOnsiteEnrollmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) Auth::user();
    }

    public function rules(): array
    {
        return [
            'student_id_number' => ['required', 'string', Rule::unique('applicants', 'student_id_number')->ignore($this->route('applicant'))],
            'payment_plan' => ['required', 'in:full,installment'],
            'mode_of_payment' => ['nullable', 'in:cash,check,bank_transfer,gcash,maya'],
            'discount_ids' => ['nullable', 'array'],
            'discount_ids.*' => ['integer', 'exists:discount_types,id'],
        ];
    }
}
