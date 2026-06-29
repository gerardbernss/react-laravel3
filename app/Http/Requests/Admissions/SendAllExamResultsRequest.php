<?php

namespace App\Http\Requests\Admissions;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class SendAllExamResultsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) Auth::user();
    }

    public function rules(): array
    {
        return [
            'scope' => ['required', 'in:all,new'],
        ];
    }
}
