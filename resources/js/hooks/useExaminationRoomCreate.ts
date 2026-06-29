import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

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
        post('/examination-rooms');
    };

    return { data, setData, processing, errors, handleSubmit };
}
