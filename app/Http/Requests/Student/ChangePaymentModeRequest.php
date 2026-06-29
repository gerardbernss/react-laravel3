<?php

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class ChangePaymentModeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) Auth::guard('student')->user();
    }

    public function rules(): array
    {
        return [
            'mode_of_payment' => ['required', 'in:cash,check,bank_transfer,gcash,maya'],
        ];
    }
}
