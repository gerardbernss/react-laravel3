<?php

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class ApplicantUpdatePersonalInfoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) Auth::guard('student')->user();
    }

    public function rules(): array
    {
        $personalData = Auth::guard('student')->user()?->personalData;

        return [
            'email' => ['required', 'email', 'max:255', Rule::unique('applicant_personal_data', 'email')->ignore($personalData?->id)],
            'alt_email' => ['nullable', 'email', 'max:255'],
            'mobile_number' => ['nullable', 'string', 'max:20'],
            'present_street' => ['nullable', 'string', 'max:255'],
            'present_brgy' => ['nullable', 'string', 'max:255'],
            'present_city' => ['nullable', 'string', 'max:255'],
            'present_province' => ['nullable', 'string', 'max:255'],
            'present_zip' => ['nullable', 'string', 'max:10'],
            'permanent_street' => ['nullable', 'string', 'max:255'],
            'permanent_brgy' => ['nullable', 'string', 'max:255'],
            'permanent_city' => ['nullable', 'string', 'max:255'],
            'permanent_province' => ['nullable', 'string', 'max:255'],
            'permanent_zip' => ['nullable', 'string', 'max:10'],
            'stopped_studying' => ['nullable', 'string', 'max:255'],
            'accelerated' => ['nullable', 'string', 'max:255'],
            'health_conditions' => ['nullable', 'array'],
            'health_conditions.*' => ['string'],
            'has_doctors_note' => ['nullable', 'string'],
            'doctors_note_file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'father_lname' => ['nullable', 'string', 'max:100'],
            'father_fname' => ['nullable', 'string', 'max:100'],
            'father_mname' => ['nullable', 'string', 'max:100'],
            'father_living' => ['nullable', 'string', 'max:20'],
            'father_citizenship' => ['nullable', 'string', 'max:100'],
            'father_religion' => ['nullable', 'string', 'max:100'],
            'father_highest_educ' => ['nullable', 'string', 'max:100'],
            'father_occupation' => ['nullable', 'string', 'max:255'],
            'father_income' => ['nullable', 'numeric'],
            'father_business_emp' => ['nullable', 'string', 'max:255'],
            'father_business_address' => ['nullable', 'string', 'max:255'],
            'father_contact_no' => ['nullable', 'string', 'max:20'],
            'father_email' => ['nullable', 'email', 'max:255'],
            'father_slu_employee' => ['nullable', 'string'],
            'father_slu_dept' => ['nullable', 'string', 'max:255'],
            'mother_lname' => ['nullable', 'string', 'max:100'],
            'mother_fname' => ['nullable', 'string', 'max:100'],
            'mother_mname' => ['nullable', 'string', 'max:100'],
            'mother_living' => ['nullable', 'string', 'max:20'],
            'mother_citizenship' => ['nullable', 'string', 'max:100'],
            'mother_religion' => ['nullable', 'string', 'max:100'],
            'mother_highest_educ' => ['nullable', 'string', 'max:100'],
            'mother_occupation' => ['nullable', 'string', 'max:255'],
            'mother_income' => ['nullable', 'numeric'],
            'mother_business_emp' => ['nullable', 'string', 'max:255'],
            'mother_business_address' => ['nullable', 'string', 'max:255'],
            'mother_contact_no' => ['nullable', 'string', 'max:20'],
            'mother_email' => ['nullable', 'email', 'max:255'],
            'mother_slu_employee' => ['nullable', 'string'],
            'mother_slu_dept' => ['nullable', 'string', 'max:255'],
            'guardian_lname' => ['nullable', 'string', 'max:100'],
            'guardian_fname' => ['nullable', 'string', 'max:100'],
            'guardian_mname' => ['nullable', 'string', 'max:100'],
            'guardian_relationship' => ['nullable', 'string', 'max:100'],
            'guardian_citizenship' => ['nullable', 'string', 'max:100'],
            'guardian_religion' => ['nullable', 'string', 'max:100'],
            'guardian_highest_educ' => ['nullable', 'string', 'max:100'],
            'guardian_occupation' => ['nullable', 'string', 'max:255'],
            'guardian_income' => ['nullable', 'numeric'],
            'guardian_business_emp' => ['nullable', 'string', 'max:255'],
            'guardian_business_address' => ['nullable', 'string', 'max:255'],
            'guardian_contact_no' => ['nullable', 'string', 'max:20'],
            'guardian_email' => ['nullable', 'email', 'max:255'],
            'guardian_slu_employee' => ['nullable', 'string'],
            'guardian_slu_dept' => ['nullable', 'string', 'max:255'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_relationship' => ['nullable', 'string', 'max:100'],
            'emergency_home_phone' => ['nullable', 'string', 'max:20'],
            'emergency_mobile_phone' => ['nullable', 'string', 'max:20'],
            'emergency_email' => ['nullable', 'email', 'max:255'],
            'siblings' => ['nullable', 'array'],
            'siblings.*.sibling_full_name' => ['required_with:siblings', 'string', 'max:255'],
            'siblings.*.sibling_grade_level' => ['nullable', 'string', 'max:50'],
            'siblings.*.sibling_id_number' => ['nullable', 'string', 'max:50'],
            'schools' => ['nullable', 'array'],
            'schools.*.school_name' => ['required_with:schools', 'string', 'max:255'],
            'schools.*.school_address' => ['nullable', 'string', 'max:255'],
            'schools.*.from_grade' => ['nullable', 'string', 'max:50'],
            'schools.*.to_grade' => ['nullable', 'string', 'max:50'],
            'schools.*.from_year' => ['nullable', 'string', 'max:10'],
            'schools.*.to_year' => ['nullable', 'string', 'max:10'],
            'schools.*.honors_awards' => ['nullable', 'string', 'max:255'],
            'schools.*.general_average' => ['nullable', 'string', 'max:10'],
            'schools.*.class_rank' => ['nullable', 'string', 'max:10'],
            'schools.*.class_size' => ['nullable', 'string', 'max:10'],
            'certificate_of_enrollment' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'birth_certificate' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'latest_report_card_front' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'latest_report_card_back' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ];
    }
}
