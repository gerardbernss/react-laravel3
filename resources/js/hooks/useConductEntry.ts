import { type BreadcrumbItem } from '@/types';
import { router } from '@inertiajs/react';
import { useState } from 'react';

export interface ConductCriteria {
    id: number;
    name: string;
    max_score: number;
}

export interface ConductCategory {
    id: number;
    name: string;
    criteria: ConductCriteria[];
}

export interface StudentRow {
    enrollment_id: number;
    student_id_number: string | null;
    last_name: string | null;
    first_name: string | null;
    middle_name: string | null;
    grades: Record<number, number | null>;
}

export interface BlockSectionData {
    id: number;
    code: string;
    name: string;
    school_year: string | null;
}

interface Params {
    blockSection: BlockSectionData;
    quarter: string;
    categories: ConductCategory[];
    students: StudentRow[];
}

export function useConductEntry({ blockSection, quarter, categories, students }: Params) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Gradebook', href: '/gradebook' },
        { title: blockSection.code, href: `/gradebook/${blockSection.id}` },
        { title: `Conduct ${quarter}`, href: `/gradebook/${blockSection.id}/conduct/${quarter}` },
    ];

    const allCriteria = categories.flatMap((c) => c.criteria);

    const initGrades = (): Record<number, Record<number, string>> => {
        const g: Record<number, Record<number, string>> = {};
        students.forEach((s) => {
            g[s.enrollment_id] = {};
            allCriteria.forEach((c) => {
                g[s.enrollment_id][c.id] =
                    s.grades[c.id] !== null && s.grades[c.id] !== undefined ? String(s.grades[c.id]) : '';
            });
        });
        return g;
    };

    const [grades, setGrades] = useState<Record<number, Record<number, string>>>(initGrades);
    const [saving, setSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    const updateGrade = (enrollmentId: number, criteriaId: number, value: string) => {
        setGrades((prev) => ({
            ...prev,
            [enrollmentId]: { ...prev[enrollmentId], [criteriaId]: value },
        }));
        setIsDirty(true);
    };

    const save = () => {
        setSaving(true);
        const payload: Record<number, Record<number, number | null>> = {};
        students.forEach((s) => {
            payload[s.enrollment_id] = {};
            allCriteria.forEach((c) => {
                const v = grades[s.enrollment_id]?.[c.id];
                payload[s.enrollment_id][c.id] = v === '' || v === undefined ? null : parseFloat(v);
            });
        });
        router.put(
            `/gradebook/${blockSection.id}/conduct/${quarter}`,
            { grades: payload },
            {
                onSuccess: () => setIsDirty(false),
                onFinish: () => setSaving(false),
            },
        );
    };

    return { breadcrumbs, allCriteria, grades, saving, isDirty, updateGrade, save };
}
