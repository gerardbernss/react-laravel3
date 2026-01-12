<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreApplicationRequest extends FormRequest
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
            'last_name' => 'required|string|max:255',
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'suffix' => 'nullable|string|max:50',
            'learner_reference_number' => 'nullable|string|max:50',
            'gender' => 'required|string|in:Male,Female',
            'citizenship' => 'required|string|max:100',
            'religion' => 'nullable|string|max:100',
            'date_of_birth' => 'required|date|before:today',
            'place_of_birth' => 'required|string|max:255',
            'has_sibling' => 'required|boolean',
            'email' => 'required|email|max:255',
            'alt_email' => 'nullable|email|max:255',
            'mobile_number' => 'required|string|max:20',

            // Address - Present
            'present_street' => 'required|string|max:255',
            'present_brgy' => 'required|string|max:100',
            'present_city' => 'required|string|max:100',
            'present_province' => 'required|string|max:100',
            'present_zip' => 'required|string|max:20',

            // Address - Permanent
            'permanent_street' => 'required|string|max:255',
            'permanent_brgy' => 'required|string|max:100',
            'permanent_city' => 'required|string|max:100',
            'permanent_province' => 'required|string|max:100',
            'permanent_zip' => 'required|string|max:20',

            // Education Status
            'stopped_studying' => 'nullable|string|in:Yes,No',
            'accelerated' => 'nullable|string|in:Yes,No',
            'year_level' => 'required|string|max:50',
            'school_year' => 'required|string|max:20',
            'semester' => 'nullable|string|max:20',
            'strand' => 'nullable|string|max:100',
            'classification' => 'nullable|string|max:100',
            'learning_mode' => 'nullable|string|max:100',

            // Health
            'health_conditions' => 'nullable', // Can be array or string, sanitized in controller
            'has_doctors_note' => 'required|boolean',
            'doctors_note_file' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',

            // Family Background - Fathers (Nullable but validated if present)
            'father_lname' => 'nullable|string|max:255',
            'father_fname' => 'nullable|string|max:255',
            'father_email' => 'nullable|email|max:255',
            'father_contact_no' => 'nullable|string|max:20',

            // Family Background - Mothers
            'mother_lname' => 'nullable|string|max:255',
            'mother_fname' => 'nullable|string|max:255',
            'mother_email' => 'nullable|email|max:255',
            'mother_contact_no' => 'nullable|string|max:20',

            // Family Background - Guardians
            'guardian_lname' => 'nullable|string|max:255',
            'guardian_fname' => 'nullable|string|max:255',
            'guardian_email' => 'nullable|email|max:255',
            'guardian_contact_no' => 'nullable|string|max:20',

            // Arrays
            'siblings' => 'nullable', // Processed in controller, but could be 'array'
            'schools' => 'nullable', // Processed in controller

            // Documents
            'certificate_of_enrollment' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'birth_certificate' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'latest_report_card_front' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'latest_report_card_back' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',

            // Application Details
            'application_number' => 'nullable|string|max:50', // For manual override or updates
            'accomplished_by_name' => 'nullable|string|max:255',
            'application_date' => 'required|date',
        ];
    }
}
