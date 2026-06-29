<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEmployeeRequest extends FormRequest
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
        $employeeId = $this->route('employee')->id;

        return [
            'user_id' => ['nullable', 'exists:users,id', 'unique:employees,user_id,' . $employeeId],
            'employee_uid' => ['required', 'string', 'max:50', 'unique:employees,employee_uid,' . $employeeId],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'email' => ['required', 'email', 'unique:employees,email,' . $employeeId],
            'department' => ['required', 'string', 'max:100'],
            'position' => ['required', 'string', 'max:100'],
            'employment_type' => ['required', 'in:regular,part_time,contractual'],
            'hire_date' => ['required', 'date'],
            'is_active' => ['boolean'],
        ];
    }
}
