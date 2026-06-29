<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreStudentRequest extends FormRequest
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
        return [
            'last_name' => ['required', 'string', 'max:100'],
            'first_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'suffix' => ['nullable', 'string', 'max:20'],
            'learner_reference_number' => ['nullable', 'string', 'max:50'],
            'gender' => ['required', 'in:Male,Female,Other'],
            'citizenship' => ['required', 'string', 'max:100'],
            'religion' => ['required', 'string', 'max:100'],
            'date_of_birth' => ['required', 'date', 'before:today'],
            'place_of_birth' => ['nullable', 'string', 'max:255'],
            'has_sibling' => ['nullable', 'boolean'],
            'email' => ['required', 'email', 'max:255', 'unique:student_personal_data,email'],
            'alt_email' => ['nullable', 'email', 'max:255'],
            'mobile_number' => ['required', 'string', 'max:20'],
            'present_brgy' => ['required', 'string', 'max:255'],
            'present_city' => ['required', 'string', 'max:255'],
            'present_province' => ['required', 'string', 'max:255'],
            'present_zip' => ['required', 'string', 'max:10'],
            'present_street' => ['nullable', 'string', 'max:255'],
            'permanent_brgy' => ['nullable', 'string', 'max:255'],
            'permanent_city' => ['nullable', 'string', 'max:255'],
            'permanent_province' => ['nullable', 'string', 'max:255'],
            'permanent_zip' => ['nullable', 'string', 'max:10'],
            'permanent_street' => ['nullable', 'string', 'max:255'],
            'stopped_studying' => ['nullable', 'string', 'max:50'],
            'accelerated' => ['nullable', 'string', 'max:50'],
            'health_conditions' => ['nullable'],
            'student_id_number' => ['nullable', 'string', 'max:50', 'unique:students,student_id_number'],
            'current_year_level' => ['required', 'string', 'max:50'],
            'current_school_year' => ['required', 'string', 'max:20'],
            'current_semester' => ['nullable', 'string', 'max:30'],
            'enrollment_status' => ['nullable', 'string', 'max:20'],
            'father_lname' => ['nullable', 'string', 'max:100'],
            'father_fname' => ['nullable', 'string', 'max:100'],
            'father_mname' => ['nullable', 'string', 'max:100'],
            'father_living' => ['nullable', 'string', 'max:20'],
            'father_contact_no' => ['nullable', 'string', 'max:20'],
            'father_email' => ['nullable', 'email', 'max:255'],
            'father_occupation' => ['nullable', 'string', 'max:255'],
            'mother_lname' => ['nullable', 'string', 'max:100'],
            'mother_fname' => ['nullable', 'string', 'max:100'],
            'mother_mname' => ['nullable', 'string', 'max:100'],
            'mother_living' => ['nullable', 'string', 'max:20'],
            'mother_contact_no' => ['nullable', 'string', 'max:20'],
            'mother_email' => ['nullable', 'email', 'max:255'],
            'mother_occupation' => ['nullable', 'string', 'max:255'],
            'guardian_lname' => ['nullable', 'string', 'max:100'],
            'guardian_fname' => ['nullable', 'string', 'max:100'],
            'guardian_mname' => ['nullable', 'string', 'max:100'],
            'guardian_relationship' => ['nullable', 'string', 'max:100'],
            'guardian_contact_no' => ['nullable', 'string', 'max:20'],
            'guardian_email' => ['nullable', 'email', 'max:255'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_relationship' => ['nullable', 'string', 'max:100'],
            'emergency_mobile_phone' => ['nullable', 'string', 'max:20'],
            'emergency_home_phone' => ['nullable', 'string', 'max:20'],
            'emergency_email' => ['nullable', 'email', 'max:255'],
            'siblings' => ['nullable', 'array'],
            'siblings.*.sibling_full_name' => ['required_with:siblings', 'string', 'max:255'],
            'siblings.*.sibling_grade_level' => ['nullable', 'string', 'max:50'],
            'siblings.*.sibling_id_number' => ['nullable', 'string', 'max:50'],
        ];
    }
}
