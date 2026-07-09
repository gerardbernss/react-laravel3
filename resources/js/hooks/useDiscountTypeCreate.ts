import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

/** Manage the discount type create form, posting to /admin/discount-types. */
export function useDiscountTypeCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        code: '',
        discount_type: 'percentage',
        value: '',
        applies_to: 'tuition_only',
        requires_verification: true,
        is_stackable: false,
        description: '',
        is_active: true,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/admin/discount-types');
    };

    return { data, setData, processing, errors, handleSubmit };
}
