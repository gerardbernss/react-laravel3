import { useForm } from '@inertiajs/react';
import { type FormEvent, useState } from 'react';

export interface Subject {
    id: number;
    code: string;
    name: string;
    units: number;
    semester: string | null;
}

export interface SubjectAssignment {
    subject_id: number;
}

export interface BlockSection {
    id: number;
    name: string;
    code: string;
    grade_level: string;
    school_year: string;
    semester: string | null;
    adviser: string | null;
    room: string | null;
    capacity: number;
    schedule: string | null;
    is_active: boolean;
    subjects: Subject[];
}

const currentYear = new Date().getFullYear();
export const schoolYears = Array.from({ length: 5 }, (_, i) => `${currentYear + i - 1}-${currentYear + i}`);

interface Params {
    blockSection: BlockSection;
    subjects: Subject[];
}

/**
 * Manage the block section edit form with dynamic subject assignment —
 * filters incompatible-semester subjects and PUTs to /admin/block-sections/:id.
 */
export function useBlockSectionEdit({ blockSection, subjects }: Params) {
    const initialAssigned: SubjectAssignment[] = blockSection.subjects.map((s) => ({ subject_id: s.id }));

    const [assignedSubjects, setAssignedSubjects] = useState<SubjectAssignment[]>(initialAssigned);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

    const { data, setData, put, processing, errors } = useForm({
        name: blockSection.name,
        code: blockSection.code,
        grade_level: blockSection.grade_level,
        school_year: blockSection.school_year,
        semester: blockSection.semester ?? '',
        adviser: blockSection.adviser ?? '',
        room: blockSection.room ?? '',
        capacity: blockSection.capacity,
        schedule: blockSection.schedule ?? '',
        is_active: blockSection.is_active,
        subjects: initialAssigned,
    });

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Block Sections', href: '/admin/block-sections' },
        { title: blockSection.code, href: `/admin/block-sections/${blockSection.id}` },
        { title: 'Edit', href: `/admin/block-sections/${blockSection.id}/edit` },
    ];

    const semesterCompatible = (s: Subject) =>
        !data.semester || !s.semester || s.semester === 'Full Year' || s.semester === data.semester;

    const availableSubjects = subjects.filter(
        (s) => semesterCompatible(s) && !assignedSubjects.some((a) => a.subject_id === s.id),
    );

    const getSubjectById = (id: number) => subjects.find((s) => s.id === id);

    const handleAddSubject = () => {
        if (!selectedSubjectId) return;
        const subjectId = parseInt(selectedSubjectId);
        if (assignedSubjects.some((s) => s.subject_id === subjectId)) {
            alert('This subject is already added.');
            return;
        }
        const updated = [...assignedSubjects, { subject_id: subjectId }];
        setAssignedSubjects(updated);
        setData('subjects', updated);
        setSelectedSubjectId('');
    };

    const handleRemoveSubject = (subjectId: number) => {
        const updated = assignedSubjects.filter((s) => s.subject_id !== subjectId);
        setAssignedSubjects(updated);
        setData('subjects', updated);
    };

    const handleSemesterChange = (v: string) => {
        setData('semester', v);
        const compatible = assignedSubjects.filter((a) => {
            const s = subjects.find((sub) => sub.id === a.subject_id);
            return !s || !s.semester || s.semester === 'Full Year' || s.semester === v;
        });
        if (compatible.length !== assignedSubjects.length) {
            setAssignedSubjects(compatible);
            setData('subjects', compatible);
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(`/admin/block-sections/${blockSection.id}`);
    };

    return {
        data,
        setData,
        processing,
        errors,
        assignedSubjects,
        selectedSubjectId,
        setSelectedSubjectId,
        availableSubjects,
        getSubjectById,
        handleAddSubject,
        handleRemoveSubject,
        handleSemesterChange,
        handleSubmit,
        breadcrumbs,
    };
}
