import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

export function usePermissionCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/admin/permissions');
    };

    return { data, setData, processing, errors, handleSubmit };
}
