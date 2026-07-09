import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

export function useRoleCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        is_active: true,
        permissions: [] as number[],
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/admin/roles');
    };

    const handlePermissionChange = (permissionId: number, checked: boolean) => {
        setData('permissions', checked ? [...data.permissions, permissionId] : data.permissions.filter((id) => id !== permissionId));
    };

    return { data, setData, processing, errors, handleSubmit, handlePermissionChange };
}
