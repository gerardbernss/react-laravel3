import { type BreadcrumbItem } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export interface Subject {
    id: number;
    code: string;
    name: string;
    units: number;
    type: string;
    pivot: {
        teacher: string | null;
        schedule: string | null;
        room: string | null;
    };
}

export interface EnrolledStudent {
    id: number;
    enrollment_date: string;
    status: string;
    student: {
        id: number;
        student_id_number: string;
        personal_data: {
            first_name: string | null;
            last_name: string | null;
            middle_name: string | null;
        } | null;
    };
}

export interface AvailableStudent {
    id: number;
    student_id_number: string;
    personal_data: {
        first_name: string | null;
        last_name: string | null;
    } | null;
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
    current_enrollment: number;
    schedule: string | null;
    is_active: boolean;
    created_at: string;
    subjects: Subject[];
}

export function studentFullName(
    pd: { first_name: string | null; last_name: string | null; middle_name?: string | null } | null,
) {
    if (!pd) return '—';
    return [pd.last_name, pd.first_name, pd.middle_name].filter(Boolean).join(', ');
}

interface Params {
    blockSection: BlockSection;
    enrolledStudents: EnrolledStudent[];
    availableStudents: AvailableStudent[];
}

export function useBlockSectionShow({ blockSection, enrolledStudents, availableStudents }: Params) {
    const { delete: destroy, processing } = useForm();

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [activeTab, setActiveTab] = useState<'students' | 'subjects'>('students');
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [addSearch, setAddSearch] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [addProcessing, setAddProcessing] = useState(false);
    const [studentsPage, setStudentsPage] = useState(1);
    const [studentsPageSize, setStudentsPageSize] = useState(10);
    const [subjectsPage, setSubjectsPage] = useState(1);
    const [subjectsPageSize, setSubjectsPageSize] = useState(10);
    const [studentSearch, setStudentSearch] = useState('');
    const [enrollmentToRemove, setEnrollmentToRemove] = useState<EnrolledStudent | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Block Sections', href: '/block-sections' },
        { title: blockSection.code, href: `/block-sections/${blockSection.id}` },
    ];

    const totalUnits = blockSection.subjects.reduce((sum, s) => sum + s.units, 0);
    const isFull = blockSection.current_enrollment >= blockSection.capacity;

    const filteredAvailable = useMemo(() => {
        if (!addSearch.trim()) return availableStudents;
        const q = addSearch.toLowerCase();
        return availableStudents.filter((s) => {
            const name = `${s.personal_data?.last_name ?? ''} ${s.personal_data?.first_name ?? ''}`.toLowerCase();
            return name.includes(q) || s.student_id_number.toLowerCase().includes(q);
        });
    }, [addSearch, availableStudents]);

    const filteredEnrolled = useMemo(() => {
        if (!studentSearch.trim()) return enrolledStudents;
        const q = studentSearch.toLowerCase();
        return enrolledStudents.filter((e) => {
            const name = studentFullName(e.student.personal_data).toLowerCase();
            return name.includes(q) || e.student.student_id_number.toLowerCase().includes(q);
        });
    }, [studentSearch, enrolledStudents]);

    const paginatedEnrolled = useMemo(
        () => filteredEnrolled.slice((studentsPage - 1) * studentsPageSize, studentsPage * studentsPageSize),
        [filteredEnrolled, studentsPage, studentsPageSize],
    );

    const paginatedSubjects = useMemo(
        () => blockSection.subjects.slice((subjectsPage - 1) * subjectsPageSize, subjectsPage * subjectsPageSize),
        [blockSection.subjects, subjectsPage, subjectsPageSize],
    );

    const openAddDialog = () => {
        setAddSearch('');
        setSelectedStudentId(null);
        setShowAddDialog(true);
    };

    const closeAddDialog = () => {
        setShowAddDialog(false);
        setAddSearch('');
        setSelectedStudentId(null);
    };

    const handleAddStudent = () => {
        if (!selectedStudentId) return;
        setAddProcessing(true);
        router.post(
            `/block-sections/${blockSection.id}/add-student`,
            { student_id: selectedStudentId },
            {
                onSuccess: closeAddDialog,
                onFinish: () => setAddProcessing(false),
            },
        );
    };

    const confirmDelete = () => {
        destroy(`/block-sections/${blockSection.id}`, {
            onSuccess: () => setShowDeleteDialog(false),
        });
    };

    const confirmRemove = () => {
        if (!enrollmentToRemove) return;
        router.delete(`/block-sections/${blockSection.id}/students/${enrollmentToRemove.id}`, {
            onSuccess: () => setEnrollmentToRemove(null),
        });
    };

    return {
        processing,
        showDeleteDialog,
        setShowDeleteDialog,
        activeTab,
        setActiveTab,
        showAddDialog,
        closeAddDialog,
        addSearch,
        setAddSearch,
        selectedStudentId,
        setSelectedStudentId,
        addProcessing,
        studentsPage,
        setStudentsPage,
        studentsPageSize,
        setStudentsPageSize,
        subjectsPage,
        setSubjectsPage,
        subjectsPageSize,
        setSubjectsPageSize,
        studentSearch,
        setStudentSearch,
        enrollmentToRemove,
        setEnrollmentToRemove,
        breadcrumbs,
        totalUnits,
        isFull,
        filteredAvailable,
        filteredEnrolled,
        paginatedEnrolled,
        paginatedSubjects,
        openAddDialog,
        handleAddStudent,
        confirmDelete,
        confirmRemove,
    };
}
