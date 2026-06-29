<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAnnouncementRequest extends FormRequest
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
        return [
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'target_audience' => ['required', 'in:all,students,applicants'],
            'attachment' => ['nullable', 'file', 'max:10240'],
            'publish_start' => ['nullable', 'date'],
            'publish_end' => ['nullable', 'date', 'after_or_equal:publish_start'],
        ];
    }
}
