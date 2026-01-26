<?php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateEntranceExamResultRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return (bool) Auth::user();
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'raw_score'           => 'required|numeric|min:0',
            'total_marks'         => 'nullable|numeric|min:0',
            'passing_score'       => 'nullable|numeric|min:0',
            'invigilator_name'    => 'required|string|max:255',
            'invigilator_remarks' => 'nullable|string|max:1000',
            'exam_remarks'        => 'nullable|string|max:1000',
            'section_scores'      => 'nullable|array',
            'section_scores.*'    => 'nullable|numeric|min:0',
            'subject_scores'      => 'nullable|array',
            'subject_scores.*'    => 'nullable|numeric|min:0',
        ];
    }
}
