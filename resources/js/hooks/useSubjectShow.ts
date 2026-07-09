import { type BreadcrumbItem } from '@/types';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';

export interface BlockSection {
    id: number;
    name: string;
    code: string;
    grade_level: string;
    school_year: string;
    pivot: {
        teacher: string | null;
    };
}

export interface Subject {
    id: number;
    code: string;
    name: string;
    description: string | null;
    units: number;
    type: string;
    grade_level: string | null;
    semester: string | null;
    default_schedule: { display: string; room: string | null } | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    block_sections: BlockSection[];
}

interface Params {
    subject: Subject;
}

export function useSubjectShow({ subject }: Params) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Subjects', href: '/admin/subjects' },
        { title: subject.code, href: `/admin/subjects/${subject.id}` },
    ];

    const { delete: destroy, processing } = useForm();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const confirmDelete = () => {
        destroy(`/admin/subjects/${subject.id}`, {
            onSuccess: () => setShowDeleteDialog(false),
        });
    };

    return { breadcrumbs, processing, showDeleteDialog, setShowDeleteDialog, confirmDelete };
}
