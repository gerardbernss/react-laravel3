import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';
import { type Permission } from '@/types';

interface Params {
    permission: Permission;
}

export function usePermissionEdit({ permission }: Params) {
    const { data, setData, put, processing, errors } = useForm({
        name: permission.name ?? '',
        description: permission.description ?? '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(`/admin/permissions/${permission.id}`);
    };

    return { data, setData, processing, errors, handleSubmit };
}
