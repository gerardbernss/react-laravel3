<?php

namespace App\Http\Requests\Student;

use App\Repositories\StudentRepository;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class AssignStudentIdRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) Auth::user();
    }

    public function rules(StudentRepository $studentRepository): array
    {
        $studentId = $this->input('applicant_id')
            ? $studentRepository->findIdByApplicantId((int) $this->input('applicant_id'))
            : null;

        return [
            'applicant_id' => ['required', 'integer', 'exists:applicants,id'],
            'student_number' => ['required', 'string', Rule::unique('students', 'student_id_number')->ignore($studentId)],
        ];
    }
}
