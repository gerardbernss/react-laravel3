<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class AssignRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('assignRole', $this->route('user'));
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'role_id' => ['required', 'exists:roles,id'],
        ];
    }
}
