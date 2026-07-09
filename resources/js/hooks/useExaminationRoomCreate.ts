import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

/** Manage the examination room create form, posting to /admin/examination-rooms. */
export function useExaminationRoomCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        building: '',
        capacity: 30,
        floor: '',
        is_active: true,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/admin/examination-rooms');
    };

    return { data, setData, processing, errors, handleSubmit };
}
