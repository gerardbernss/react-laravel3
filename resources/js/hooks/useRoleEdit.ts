import { type Role } from '@/types';
import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

interface Params {
    role: Role;
}

/** Manage the role edit form with permission checkbox assignment, PUTting to /admin/roles/:id; guards the super-admin role from modification. */
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
