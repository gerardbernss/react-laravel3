<?php
namespace App\Http\Requests\Admissions;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StorePortalCredentialRequest extends FormRequest
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
            'applicant_personal_data_id'    => 'required|exists:applicant_personal_data,id|unique:portal_credentials,applicant_personal_data_id',
            'applicant_application_info_id' => 'required|exists:applicant_application_info,id',
            'username'                      => 'nullable|string|max:255|unique:portal_credentials,username',
            'personal_name'                 => 'nullable|string|max:255',
        ];
    }

    /**
     * Get custom messages for validation errors.
     */
    public function messages(): array
    {
        return [
            'applicant_personal_data_id.unique' => 'Portal credentials already exist for this applicant.',
        ];
    }
}
