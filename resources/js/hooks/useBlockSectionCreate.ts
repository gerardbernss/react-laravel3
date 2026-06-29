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

const currentYear = new Date().getFullYear();
export const schoolYears = Array.from({ length: 5 }, (_, i) => `${currentYear + i - 1}-${currentYear + i}`);

interface Params {
    subjects: Subject[];
}

export function useBlockSectionCreate({ subjects }: Params) {
    const [assignedSubjects, setAssignedSubjects] = useState<SubjectAssignment[]>([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        code: '',
        grade_level: '',
        school_year: schoolYears[1],
        semester: '',
        adviser: '',
        room: '',
        capacity: 40,
        schedule: '',
        is_active: true,
        subjects: [] as SubjectAssignment[],
    });

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
        post('/block-sections');
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
    };
}
