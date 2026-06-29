<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStudentRequest extends FormRequest
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
        $spd = $this->route('student')->studentPersonalData;

        return [
            'last_name' => ['required', 'string', 'max:100'],
            'first_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'suffix' => ['nullable', 'string', 'max:20'],
            'gender' => ['required', 'in:Male,Female,Other'],
            'citizenship' => ['required', 'string', 'max:100'],
            'religion' => ['required', 'string', 'max:100'],
            'date_of_birth' => ['required', 'date', 'before:today'],
            'place_of_birth' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:student_personal_data,email,' . $spd?->id],
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
            'health_conditions' => ['nullable', 'array'],
            'health_conditions.*' => ['nullable', 'string'],
            'has_doctors_note' => ['nullable', 'boolean'],
            'doctors_note_file' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,doc,docx', 'max:5120'],
            'current_year_level' => ['required', 'string', 'max:50'],
            'current_school_year' => ['required', 'string', 'max:20'],
            'current_semester' => ['nullable', 'string', 'max:30'],
            'enrollment_status' => ['nullable', 'string', 'max:20'],
            'siblings' => ['nullable', 'array'],
            'siblings.*.sibling_full_name' => ['required_with:siblings', 'string', 'max:255'],
            'siblings.*.sibling_grade_level' => ['nullable', 'string', 'max:50'],
            'siblings.*.sibling_id_number' => ['nullable', 'string', 'max:50'],
            'certificate_of_enrollment' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'birth_certificate' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'latest_report_card_front' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'latest_report_card_back' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ];
    }
}
