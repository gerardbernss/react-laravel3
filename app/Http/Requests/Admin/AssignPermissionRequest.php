<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class AssignPermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('assignPermission', $this->route('role'));
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'permission_id' => ['required', 'exists:permissions,id'],
        ];
    }
}
