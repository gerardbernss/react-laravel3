<?php
namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class StoreApplicantRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Personal Data
            'last_name'                 => 'required|string|max:255',
            'first_name'                => 'required|string|max:255',
            'middle_name'               => 'nullable|string|max:255',
            'suffix'                    => 'nullable|string|max:255',
            'learner_reference_number'  => 'nullable|string|max:255',
            'gender'                    => 'required|string|in:Male,Female',
            'citizenship'               => 'required|string|max:255',
            'religion'                  => 'nullable|string|max:255',
            'date_of_birth'             => 'required|date',
            'place_of_birth'            => 'required|string|max:255',
            'has_sibling'               => 'boolean',
            'email'                     => 'required|email|max:255',
            'alt_email'                 => 'nullable|email|max:255',
            'mobile_number'             => 'required|string|max:20',

            // Addresses
            'present_street'            => 'nullable|string|max:255',
            'present_brgy'              => 'nullable|string|max:255',
            'present_city'              => 'nullable|string|max:255',
            'present_province'          => 'nullable|string|max:255',
            'present_zip'               => 'nullable|string|max:20',
            'permanent_street'          => 'nullable|string|max:255',
            'permanent_brgy'            => 'nullable|string|max:255',
            'permanent_city'            => 'nullable|string|max:255',
            'permanent_province'        => 'nullable|string|max:255',
            'permanent_zip'             => 'nullable|string|max:20',

            // Academic History
            'stopped_studying'          => 'nullable|string',
            'accelerated'               => 'nullable|string',
            'health_conditions'         => 'nullable', // Array or string
            'has_doctors_note'          => 'boolean',
            'doctors_note_file'         => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',

            // Family Background - Father
            'father_lname'              => 'nullable|string|max:255',
            'father_fname'              => 'nullable|string|max:255',
            'father_mname'              => 'nullable|string|max:255',
            'father_living'             => 'nullable|string',
            'father_citizenship'        => 'nullable|string|max:255',
            'father_religion'           => 'nullable|string|max:255',
            'father_highest_educ'       => 'nullable|string|max:255',
            'father_occupation'         => 'nullable|string|max:255',
            'father_income'             => 'nullable|string|max:255',
            'father_business_emp'       => 'nullable|string|max:255',
            'father_business_address'   => 'nullable|string|max:255',
            'father_contact_no'         => 'nullable|string|max:20',
            'father_email'              => 'nullable|email|max:255',
            'father_slu_employee'       => 'boolean',
            'father_slu_dept'           => 'nullable|string|max:255',

            // Family Background - Mother
            'mother_lname'              => 'nullable|string|max:255',
            'mother_fname'              => 'nullable|string|max:255',
            'mother_mname'              => 'nullable|string|max:255',
            'mother_living'             => 'nullable|string',
            'mother_citizenship'        => 'nullable|string|max:255',
            'mother_religion'           => 'nullable|string|max:255',
            'mother_highest_educ'       => 'nullable|string|max:255',
            'mother_occupation'         => 'nullable|string|max:255',
            'mother_income'             => 'nullable|string|max:255',
            'mother_business_emp'       => 'nullable|string|max:255',
            'mother_business_address'   => 'nullable|string|max:255',
            'mother_contact_no'         => 'nullable|string|max:20',
            'mother_email'              => 'nullable|email|max:255',
            'mother_slu_employee'       => 'boolean',
            'mother_slu_dept'           => 'nullable|string|max:255',

            // Family Background - Guardian
            'guardian_lname'            => 'nullable|string|max:255',
            'guardian_fname'            => 'nullable|string|max:255',
            'guardian_mname'            => 'nullable|string|max:255',
            'guardian_relationship'     => 'nullable|string|max:255',
            'guardian_citizenship'      => 'nullable|string|max:255',
            'guardian_religion'         => 'nullable|string|max:255',
            'guardian_highest_educ'     => 'nullable|string|max:255',
            'guardian_occupation'       => 'nullable|string|max:255',
            'guardian_income'           => 'nullable|string|max:255',
            'guardian_business_emp'     => 'nullable|string|max:255',
            'guardian_business_address' => 'nullable|string|max:255',
            'guardian_contact_no'       => 'nullable|string|max:20',
            'guardian_email'            => 'nullable|email|max:255',
            'guardian_slu_employee'     => 'boolean',
            'guardian_slu_dept'         => 'nullable|string|max:255',

            // Emergency Contact
            'emergency_contact_name'    => 'required|string|max:255',
            'emergency_relationship'    => 'required|string|max:255',
            'emergency_home_phone'      => 'nullable|string|max:20',
            'emergency_mobile_phone'    => 'required|string|max:20',
            'emergency_email'           => 'nullable|email|max:255',

                                                       // Siblings
            'siblings'                  => 'nullable', // Array or JSON string

                                                                     // Application Info
            'application_number'        => 'nullable|string|max:20', // Admin might provide
            'application_date'          => 'required|date',
            'application_status'        => 'nullable|string',
            'school_year'               => 'required|string|max:20',
            'semester'                  => 'nullable|string|max:20',
            'year_level'                => 'required|string|max:50',
            'strand'                    => 'nullable|string|max:50',
            'classification'            => 'nullable|string|max:50',
            'learning_mode'             => 'nullable|string|max:50',
            'accomplished_by_name'      => 'nullable|string|max:255',

                                                       // Schools
            'schools'                   => 'nullable', // Array or JSON string

            // Files
            'certificate_of_enrollment' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'birth_certificate'         => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'latest_report_card_front'  => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'latest_report_card_back'   => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ];
    }
}
