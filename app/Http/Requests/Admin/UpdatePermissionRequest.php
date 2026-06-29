<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdatePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('permission'));
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:permissions,name,'.$this->route('permission')->id],
            'description' => ['nullable', 'string'],
        ];
    }
}
