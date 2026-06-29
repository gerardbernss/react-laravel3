import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

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
}

interface Params {
    discountType: DiscountType;
}

export function useDiscountTypeEdit({ discountType }: Params) {
    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Discounts', href: '/admin/discount-types' },
        { title: discountType.name, href: `/admin/discount-types/${discountType.id}` },
        { title: 'Edit', href: `/admin/discount-types/${discountType.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: discountType.name,
        code: discountType.code,
        discount_type: discountType.discount_type,
        value: discountType.value,
        applies_to: discountType.applies_to,
        requires_verification: discountType.requires_verification,
        is_stackable: discountType.is_stackable,
        description: discountType.description ?? '',
        is_active: discountType.is_active,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(`/admin/discount-types/${discountType.id}`);
    };

    return { data, setData, processing, errors, handleSubmit, breadcrumbs };
}
