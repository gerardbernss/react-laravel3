import users from '@/routes/users';
import { useForm } from '@inertiajs/react';
import { type FormEvent, useState } from 'react';

export function useUserCreate() {
    const [hideAlert, setHideAlert] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        role_id: null as number | null,
        roles: [] as number[],
    });

    const handleSubmit = (e: FormEvent) => {
        setHideAlert(false);
        e.preventDefault();
        post(users.store.url());
    };

    const handleRoleChange = (roleId: number, checked: boolean) => {
        setData('roles', checked ? [...data.roles, roleId] : data.roles.filter((id) => id !== roleId));
    };

    return { hideAlert, setHideAlert, data, setData, processing, errors, handleSubmit, handleRoleChange };
}
