<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('user'));
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email,'.$this->route('user')->id],
            'password' => ['nullable', 'string', 'min:8'],
            'role_id' => ['nullable', 'exists:roles,id'],
            'roles' => ['nullable', 'array'],
            'roles.*' => ['exists:roles,id'],
        ];
    }
}
