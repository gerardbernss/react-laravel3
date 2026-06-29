<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class RemoveRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('removeRole', $this->route('user'));
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
