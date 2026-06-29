<?php

namespace App\Http\Requests\Admissions;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class WithdrawApplicantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) Auth::user();
    }

    public function rules(): array
    {
        return [
            'withdrawal_type' => ['required', 'in:during_enrollment,after_classes'],
            'refund_amount' => ['required', 'numeric', 'min:0'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
