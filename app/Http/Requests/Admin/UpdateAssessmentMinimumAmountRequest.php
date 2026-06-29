<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAssessmentMinimumAmountRequest extends FormRequest
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
        $max = (float) $this->route('assessment')->net_amount;

        return [
            'minimum_amount' => ['required', 'numeric', 'min:0', 'max:' . $max],
        ];
    }
}
