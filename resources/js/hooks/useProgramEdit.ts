import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

export interface Program {
    id: number;
    code: string;
    description: string;
    school: string;
    is_active: boolean;
    max_load: number;
}

interface Params {
    program: Program;
}

export function useProgramEdit({ program }: Params) {
    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Programs', href: '/admin/programs' },
        { title: program.code, href: `/admin/programs/${program.id}/edit` },
        { title: 'Edit', href: `/admin/programs/${program.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm({
        code: program.code,
        description: program.description,
        school: program.school,
        is_active: program.is_active,
        max_load: program.max_load,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(`/admin/programs/${program.id}`);
    };

    return { breadcrumbs, data, setData, processing, errors, handleSubmit };
}
