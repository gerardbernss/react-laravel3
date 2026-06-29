<?php

namespace App\Http\Requests\Admin;

use App\Models\Permission;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StorePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('create', Permission::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:permissions,name'],
            'description' => ['nullable', 'string'],
        ];
    }
}
