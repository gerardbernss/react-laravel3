import { useMemo, useState } from 'react';

export interface Student {
    enrollment_id: number;
    student_id_number: string | null;
    last_name: string | null;
    first_name: string | null;
    middle_name: string | null;
    grade: string | number | null;
    grade_status: string | null;
    present_count: number;
    absent_count: number;
    late_count: number;
    excused_count: number;
    total_sessions: number;
    attendance_rate: number | null;
}

export interface BlockSection {
    id: number;
    code: string;
    name: string;
    grade_level: string | null;
    strand: string | null;
}

export interface Subject {
    id: number;
    code: string;
    name: string;
}

export interface Statistics {
    total_students: number;
    graded_count: number;
    passed_count: number;
    avg_attendance: number | null;
}

interface Params {
    blockSection: BlockSection;
    students: Student[];
}

/** Paginate the student roster for a faculty's block section and compose the section label. */
export function useMyStudentsShow({ blockSection, students }: Params) {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const paginated = useMemo(
        () => students.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [students, currentPage, pageSize],
    );

    const sectionLabel = [blockSection.code, blockSection.grade_level, blockSection.strand].filter(Boolean).join(' · ');

    return { currentPage, setCurrentPage, pageSize, setPageSize, paginated, sectionLabel };
}
