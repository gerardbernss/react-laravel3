<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAssessmentPaymentRequest extends FormRequest
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
        $assessment = $this->route('assessment');
        $payment = $this->route('payment');
        $maxAmount = $assessment->remaining_balance + (float) $payment->amount_paid;

        return [
            'amount_paid' => ['required', 'numeric', 'min:0.01', 'max:' . $maxAmount],
            'payment_method' => ['required', 'in:cash,check,bank_transfer,gcash,maya'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'payment_date' => ['required', 'date', 'before_or_equal:today'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
