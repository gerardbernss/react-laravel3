import { type Permission } from '@/types';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';

interface Params {
    permission: Permission;
}

export function usePermissionShow({ permission }: Params) {
    const { delete: destroy, processing } = useForm();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const confirmDelete = () => {
        destroy(`/admin/permissions/${permission.id}`, {
            onSuccess: () => setShowDeleteDialog(false),
        });
    };

    return { processing, showDeleteDialog, setShowDeleteDialog, confirmDelete };
}
