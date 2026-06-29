import { type BreadcrumbItem } from '@/types';
import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export interface BlockSection {
    id: number;
    code: string;
    name: string;
    grade_level: string | null;
    strand: string | null;
    school_year: string | null;
    semester: string | null;
}

export interface Subject {
    id: number;
    code: string;
    name: string;
}

export interface AttendanceRecord {
    date: string;
    total_marked: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    attendance_rate: number | null;
}

interface Params {
    blockSection: BlockSection;
    selectedSubjectId: number;
    dateFrom: string | null;
    dateTo: string | null;
    records: AttendanceRecord[];
}

export function useAttendanceHistory({ blockSection, selectedSubjectId, dateFrom, dateTo, records }: Params) {
    const [fromVal, setFromVal] = useState(dateFrom ?? '');
    const [toVal, setToVal] = useState(dateTo ?? '');
    const [subjectVal, setSubjectVal] = useState(String(selectedSubjectId));
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const paginated = useMemo(
        () => records.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [records, currentPage, pageSize],
    );

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Attendance', href: '/attendance' },
        ...(blockSection.grade_level
            ? [{ title: blockSection.grade_level, href: `/attendance/grade/${encodeURIComponent(blockSection.grade_level)}` }]
            : []),
        { title: blockSection.code, href: `/attendance/${blockSection.id}` },
        { title: 'History', href: `/attendance/${blockSection.id}/history` },
    ];

    const applyFilters = () => {
        router.get(
            `/attendance/${blockSection.id}/history`,
            { subject_id: subjectVal, date_from: fromVal || undefined, date_to: toVal || undefined },
            { preserveState: true, replace: true },
        );
    };

    const clearFilters = () => {
        setFromVal('');
        setToVal('');
        router.get(`/attendance/${blockSection.id}/history`, { subject_id: subjectVal }, { preserveState: false, replace: true });
    };

    const hasDateFilter = !!(fromVal || toVal);

    return {
        fromVal,
        setFromVal,
        toVal,
        setToVal,
        subjectVal,
        setSubjectVal,
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        paginated,
        breadcrumbs,
        applyFilters,
        clearFilters,
        hasDateFilter,
    };
}
