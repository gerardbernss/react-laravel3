import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

export function useProgramCreate() {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
        description: '',
        school: 'Senior High School',
        is_active: true,
        max_load: 30,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/programs');
    };

    return { data, setData, processing, errors, handleSubmit };
}
