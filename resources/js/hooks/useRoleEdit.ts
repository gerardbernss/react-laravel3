import { type Role } from '@/types';
import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

interface Params {
    role: Role;
}

export function useRoleEdit({ role }: Params) {
    const { data, setData, put, processing, errors } = useForm({
        name: role.name ?? '',
        description: role.description ?? '',
        is_active: role.is_active ?? true,
        permissions: role.permissions?.map((p) => p.id) ?? [],
    });

    const isSuperAdmin = role.slug === 'super-admin';

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(`/admin/roles/${role.id}`);
    };

    const handlePermissionChange = (permissionId: number, checked: boolean) => {
        setData('permissions', checked ? [...data.permissions, permissionId] : data.permissions.filter((id) => id !== permissionId));
    };

    return { data, setData, processing, errors, isSuperAdmin, handleSubmit, handlePermissionChange };
}
