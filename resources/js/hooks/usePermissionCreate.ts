import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

/** Manage the permission create form, posting to /admin/permissions. The slug auto-derives from the name but can be overridden. */
export function usePermissionCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
        description: '',
    });

    const handleNameChange = (name: string) => {
        setData((prev) => ({
            ...prev,
            name,
            // Only auto-derive when the slug hasn't been manually edited
            slug: prev.slug === toSlug(prev.name) ? toSlug(name) : prev.slug,
        }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/admin/permissions');
    };

    return { data, setData, processing, errors, handleSubmit, handleNameChange };
}

function toSlug(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}
