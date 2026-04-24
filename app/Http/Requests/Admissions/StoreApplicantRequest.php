<?php

namespace App\Http\Requests\Admissions;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreApplicantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) Auth::user();
    }

    public function rules(): array
    {
        return [
            // Application Info
            'application_date'           => 'required|date',
            'school_year'                => 'required|string|max:20',
            'application_number'         => 'nullable|string|max:20|unique:applicants,application_number',
            'application_status'         => 'nullable|string|in:Pending,For Exam,Exam Taken,Enrolled',
            'year_level'                 => 'required|string|max:50',
            'semester'                   => 'required|string|max:20',
            'strand'                     => 'required|string|max:100',
            'classification'             => 'required|string|max:50',
            'learning_mode'              => 'required|string|max:50',
            'accomplished_by_name'       => 'nullable|string|max:255',

            // Personal Data
            'last_name'                  => 'required|string|min:2|max:100',
            'first_name'                 => 'required|string|min:2|max:100',
            'middle_name'                => 'nullable|string|max:100',
            'suffix'                     => 'nullable|string|max:20',
            'learner_reference_number'   => 'nullable|string|max:50',
            'gender'                     => 'required|string|in:Male,Female',
            'citizenship'                => 'required|string|min:2|max:100',
            'religion'                   => 'required|string|max:100',
            'date_of_birth'              => 'required|date|before:today',
            'place_of_birth'             => 'nullable|string|max:255',
            'has_sibling'                => 'nullable|boolean',
            'email'                      => 'required|email|max:255',
            'alt_email'                  => 'nullable|email|max:255',
            'mobile_number'              => 'required|string|max:20',
            'present_street'             => 'nullable|string|max:255',
            'present_brgy'               => 'required|string|max:255',
            'present_city'               => 'required|string|max:255',
            'present_province'           => 'required|string|max:255',
            'present_zip'                => 'required|string|max:10',
            'permanent_street'           => 'nullable|string|max:255',
            'permanent_brgy'             => 'required|string|max:255',
            'permanent_city'             => 'required|string|max:255',
            'permanent_province'         => 'required|string|max:255',
            'permanent_zip'              => 'required|string|max:10',
            'stopped_studying'           => 'nullable|string|max:50',
            'accelerated'                => 'nullable|string|max:50',
            'health_conditions'          => 'nullable',

            // Family Background
            'father_lname'               => 'required|string|min:2|max:100',
            'father_fname'               => 'required|string|min:2|max:100',
            'father_mname'               => 'required|string|min:2|max:100',
            'father_living'              => 'required|string|max:20',
            'father_citizenship'         => 'nullable|string|max:100',
            'father_religion'            => 'nullable|string|max:100',
            'father_highest_educ'        => 'nullable|string|max:100',
            'father_occupation'          => 'nullable|string|max:255',
            'father_income'              => 'nullable|string|max:50',
            'father_business_emp'        => 'nullable|string|max:255',
            'father_business_address'    => 'nullable|string|max:255',
            'father_contact_no'          => 'nullable|string|max:20',
            'father_email'               => 'nullable|email|max:255',
            'father_slu_employee'        => 'nullable|boolean',
            'father_slu_dept'            => 'nullable|string|max:255',

            'mother_lname'               => 'required|string|min:2|max:100',
            'mother_fname'               => 'required|string|min:2|max:100',
            'mother_mname'               => 'required|string|min:2|max:100',
            'mother_living'              => 'required|string|max:20',
            'mother_citizenship'         => 'nullable|string|max:100',
            'mother_religion'            => 'nullable|string|max:100',
            'mother_highest_educ'        => 'nullable|string|max:100',
            'mother_occupation'          => 'nullable|string|max:255',
            'mother_income'              => 'nullable|string|max:50',
            'mother_business_emp'        => 'nullable|string|max:255',
            'mother_business_address'    => 'nullable|string|max:255',
            'mother_contact_no'          => 'nullable|string|max:20',
            'mother_email'               => 'nullable|email|max:255',
            'mother_slu_employee'        => 'nullable|boolean',
            'mother_slu_dept'            => 'nullable|string|max:255',

            'guardian_lname'             => 'required|string|min:2|max:100',
            'guardian_fname'             => 'required|string|min:2|max:100',
            'guardian_mname'             => 'required|string|min:2|max:100',
            'guardian_relationship'      => 'nullable|string|max:100',
            'guardian_citizenship'       => 'nullable|string|max:100',
            'guardian_religion'          => 'nullable|string|max:100',
            'guardian_highest_educ'      => 'nullable|string|max:100',
            'guardian_occupation'        => 'nullable|string|max:255',
            'guardian_income'            => 'nullable|string|max:50',
            'guardian_business_emp'      => 'nullable|string|max:255',
            'guardian_business_address'  => 'nullable|string|max:255',
            'guardian_contact_no'        => 'required|string|max:20',
            'guardian_email'             => 'nullable|email|max:255',
            'guardian_slu_employee'      => 'nullable|boolean',
            'guardian_slu_dept'          => 'nullable|string|max:255',

            'emergency_contact_name'     => 'required|string|min:2|max:255',
            'emergency_relationship'     => 'required|string|max:100',
            'emergency_home_phone'       => 'nullable|string|max:20',
            'emergency_mobile_phone'     => 'required|string|max:20',
            'emergency_email'            => 'nullable|email|max:255',

            // Siblings
            'siblings'                   => 'nullable',
            'siblings.*.sibling_full_name'   => 'required_with:siblings|string|min:2|max:255',
            'siblings.*.sibling_grade_level' => 'nullable|string|max:50',
            'siblings.*.sibling_id_number'   => 'nullable|string|max:50',

            // Schools
            'schools'                    => 'nullable',
            'schools.*.school_name'      => 'required_with:schools|string|min:2|max:255',
            'schools.*.school_address'   => 'nullable|string|max:255',
            'schools.*.from_grade'       => 'nullable|string|max:50',
            'schools.*.to_grade'         => 'nullable|string|max:50',
            'schools.*.from_year'        => 'nullable|string|max:10',
            'schools.*.to_year'          => 'nullable|string|max:10',
            'schools.*.honors_awards'    => 'nullable|string|max:255',
            'schools.*.general_average'  => 'nullable|string|max:10',
            'schools.*.class_rank'       => 'nullable|string|max:10',
            'schools.*.class_size'       => 'nullable|string|max:10',

            // Document Uploads - with file type validation for security
            'certificate_of_enrollment'  => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'birth_certificate'          => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'latest_report_card_front'   => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'latest_report_card_back'    => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'doctors_note_file'          => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ];
    }

    public function messages(): array
    {
        return [
            'application_number.unique'             => 'This application number is already taken.',
            'email.email'                           => 'Please enter a valid email address.',
            'date_of_birth.before'                  => 'Date of birth must be before today.',
            'certificate_of_enrollment.mimes'       => 'Only JPG, PNG, and PDF files are allowed.',
            'certificate_of_enrollment.max'         => 'File size must not exceed 5MB.',
            'birth_certificate.mimes'               => 'Only JPG, PNG, and PDF files are allowed.',
            'birth_certificate.max'                 => 'File size must not exceed 5MB.',
            'latest_report_card_front.mimes'        => 'Only JPG, PNG, and PDF files are allowed.',
            'latest_report_card_front.max'          => 'File size must not exceed 5MB.',
            'latest_report_card_back.mimes'         => 'Only JPG, PNG, and PDF files are allowed.',
            'latest_report_card_back.max'           => 'File size must not exceed 5MB.',
            'doctors_note_file.mimes'               => 'Only JPG, PNG, and PDF files are allowed.',
            'doctors_note_file.max'                 => 'File size must not exceed 5MB.',
        ];
    }
}
