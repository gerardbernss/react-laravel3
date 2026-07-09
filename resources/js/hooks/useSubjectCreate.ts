import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

/** Manage the subject create form, posting to /admin/subjects. */
export function useSubjectCreate() {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
        name: '',
        description: '',
        units: 3,
        type: 'Core',
        grade_level: '',
        semester: '',
        user_id: null as number | null,
        is_active: true,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/admin/subjects');
    };

    return { data, setData, processing, errors, handleSubmit };
}
