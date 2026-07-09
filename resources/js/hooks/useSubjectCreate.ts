import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

export function useSubjectCreate() {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
        name: '',
        description: '',
        units: 3,
        type: 'Core',
        grade_level: '',
        semester: '',
        days: '',
        time: '',
        room: '',
        user_id: null as number | null,
        is_active: true,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/admin/subjects');
    };

    return { data, setData, processing, errors, handleSubmit };
}
