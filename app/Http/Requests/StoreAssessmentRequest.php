<?php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreAssessmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Auth::check();
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'applicant_application_info_id' => 'required|exists:applicant_application_info,id',
            'applicant_personal_data_id'    => 'required|exists:applicant_personal_data,id',
            'assessment_type'               => 'required|string|max:255',
            'assessment_date'               => 'required|date',
            'score'                         => 'required|numeric|min:0',
            'total_score'                   => 'nullable|numeric|min:0',
            'assessed_by'                   => 'required|string|max:255',
            'assessor_remarks'              => 'nullable|string',
            'feedback'                      => 'nullable|string',
        ];
    }
}
