import { type Role } from '@/types';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';

interface Params {
    role: Role;
}

export function useRoleShow({ role }: Params) {
    const { delete: destroy, processing } = useForm();
    const [removeDialog, setRemoveDialog] = useState<{ open: boolean; userId: number; userName: string }>({
        open: false,
        userId: 0,
        userName: '',
    });

    const isSuperAdmin = role.slug === 'super-admin';

    const handleRemoveRole = (userId: number, userName: string) => {
        setRemoveDialog({ open: true, userId, userName });
    };

    const confirmRemoveRole = () => {
        destroy(`/users/${removeDialog.userId}/remove-role`, {
            data: { role_id: role.id } as any,
            onSuccess: () => setRemoveDialog({ open: false, userId: 0, userName: '' }),
        });
    };

    return { isSuperAdmin, processing, removeDialog, setRemoveDialog, handleRemoveRole, confirmRemoveRole };
}
