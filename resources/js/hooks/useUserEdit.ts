import users from '@/routes/admin/users';
import { type BreadcrumbItem } from '@/types';
import { useForm } from '@inertiajs/react';
import { type FormEvent, useState } from 'react';

export interface UserRole {
    id: number;
    name: string;
}

export interface EditUser {
    id: number;
    name: string;
    email: string;
    role_id?: number | null;
    roles?: UserRole[];
}

interface Params {
    user: EditUser;
}

export function useUserEdit({ user }: Params) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Users', href: '/admin/users' },
        { title: 'Edit User', href: `/admin/users/${user.id}/edit` },
    ];

    const [hideAlert, setHideAlert] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        password: '',
        role_id: (user.role_id ?? null) as number | null,
        roles: (user.roles?.map((r) => r.id) ?? []) as number[],
    });

    const handleUpdate = (e: FormEvent) => {
        setHideAlert(false);
        e.preventDefault();
        put(users.update.url(user.id));
    };

    const handleRoleChange = (roleId: number, checked: boolean) => {
        setData('roles', checked ? [...data.roles, roleId] : data.roles.filter((id) => id !== roleId));
    };

    return { breadcrumbs, hideAlert, setHideAlert, data, setData, processing, errors, handleUpdate, handleRoleChange };
}
