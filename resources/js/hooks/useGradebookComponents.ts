import { router, useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

export interface GradeComponent {
    id: number;
    name: string;
    hps: number;
    weight: number;
    order: number;
}

export interface BlockSectionData {
    id: number;
    code: string;
    name: string;
    school_year: string | null;
}

export interface SubjectData {
    id: number;
    code: string;
    name: string;
}

interface Params {
    blockSection: BlockSectionData;
    subject: SubjectData;
    quarter: string;
    weightTotal: number;
}

/**
 * Manage the gradebook component setup page — add new grade components and delete existing ones,
 * with weight validation to ensure the total reaches exactly 100%.
 */
export function useGradebookComponents({ blockSection, subject, quarter, weightTotal }: Params) {
    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Gradebook', href: '/teacher/gradebook' },
        { title: blockSection.code, href: `/teacher/gradebook/${blockSection.id}` },
        { title: `${subject.code} ${quarter}`, href: `/teacher/gradebook/${blockSection.id}/${subject.id}/${quarter}/components` },
    ];

    const { data, setData, post, processing, errors, reset } = useForm({
        block_section_id: blockSection.id,
        subject_id: subject.id,
        grading_quarter: quarter,
        name: '',
        hps: '',
        weight: '',
    });

    const weightOk = Math.abs(weightTotal - 100) < 0.01;
    const remainingWeight = Math.max(0, 100 - weightTotal);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post('/teacher/gradebook/components', {
            onSuccess: () => reset('name', 'hps', 'weight'),
        });
    };

    const deleteComponent = (id: number) => {
        if (!confirm('Delete this component? All scores for it will be lost.')) return;
        router.delete(`/teacher/gradebook/components/${id}`);
    };

    return { breadcrumbs, data, setData, processing, errors, weightOk, remainingWeight, submit, deleteComponent };
}
