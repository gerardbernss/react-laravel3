<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class RemovePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('removePermission', $this->route('role'));
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
