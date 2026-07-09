import { type Permission } from '@/types';
import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

interface Params {
    permission: Permission;
}

/** Manage the permission edit form, PUTting to /admin/permissions/:id. Slug is editable and defaults to the existing value. */
export function usePermissionEdit({ permission }: Params) {
    const { data, setData, put, processing, errors } = useForm({
        name: permission.name ?? '',
        slug: permission.slug ?? '',
        description: permission.description ?? '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(`/admin/permissions/${permission.id}`);
    };

    return { data, setData, processing, errors, handleSubmit };
}
