<?php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreEntranceExamRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Auth::check(); // Admin only in production
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'applicant_application_info_id' => 'required|exists:applicant_application_info,id',
            'appli   cant_personal_data_id' => 'required|exists:applicant_personal_data,id',
            'exam_scheduled_date'           => 'required|date|after_or_equal:today',
            'exam_time'                     => 'required|date_format:H:i',
            'exam_venue'                    => 'required|string|max:255',
            'exam_room_number'              => 'required|string|max:50',
            'seat_number'                   => 'required|string|max:20',
            'passing_score'                 => 'nullable|numeric|min:0|max:100',
        ];
    }

    /**
     * Get custom messages for validation errors.
     */
    public function messages(): array
    {
        return [
            'exam_scheduled_date.after_or_equal' => 'Exam date must be in the future             .',
            'exam_time.date_format'              => 'Exam time must be in HH:MM format.',
        ];
    }
}
