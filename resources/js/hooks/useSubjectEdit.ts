import { type BreadcrumbItem } from '@/types';
import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

export interface Subject {
    id: number;
    code: string;
    name: string;
    description: string | null;
    units: number;
    type: string;
    grade_level: string | null;
    semester: string | null;
    user_id: number | null;
    is_active: boolean;
}

interface Params {
    subject: Subject;
}

/** Manage the subject edit form with breadcrumb trail, PUTting to /admin/subjects/:id. */
export function useSubjectEdit({ subject }: Params) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Subjects', href: '/admin/subjects' },
        { title: subject.code, href: `/admin/subjects/${subject.id}` },
        { title: 'Edit', href: `/admin/subjects/${subject.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm({
        code: subject.code,
        name: subject.name,
        description: subject.description ?? '',
        units: subject.units,
        type: subject.type,
        grade_level: subject.grade_level ?? '',
        semester: subject.semester ?? '',
        user_id: subject.user_id as number | null,
        is_active: subject.is_active,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(`/admin/subjects/${subject.id}`);
    };

    return { breadcrumbs, data, setData, processing, errors, handleSubmit };
}
