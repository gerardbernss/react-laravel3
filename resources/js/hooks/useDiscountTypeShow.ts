import { useForm } from '@inertiajs/react';
import { useState } from 'react';

export interface DiscountType {
    id: number;
    name: string;
    code: string;
    discount_type: string;
    value: string;
    applies_to: string;
    requires_verification: boolean;
    is_stackable: boolean;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface Params {
    discountType: DiscountType;
}

/** Manage the discount type detail page, including delete confirmation dialog. */
export function useDiscountTypeShow({ discountType }: Params) {
    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Discounts', href: '/admin/discount-types' },
        { title: discountType.name, href: `/admin/discount-types/${discountType.id}` },
    ];

    const { delete: destroy, processing } = useForm();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const confirmDelete = () => {
        destroy(`/admin/discount-types/${discountType.id}`, {
            onSuccess: () => setShowDeleteDialog(false),
        });
    };

    return { breadcrumbs, processing, showDeleteDialog, setShowDeleteDialog, confirmDelete };
}
