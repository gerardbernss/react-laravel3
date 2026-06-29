import { usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export interface SemesterPeriod {
    id: number;
    name: string;
    start_month: number;
    end_month: number;
    is_active: boolean;
}

export const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

export function monthName(n: number): string {
    return MONTHS[n - 1] ?? '—';
}

interface PageProps {
    currentSemester?: { name: string; school_year: string };
    [key: string]: unknown;
}

export function useSemesterPeriods(periods: SemesterPeriod[]) {
    const { currentSemester } = usePage<PageProps>().props;
    const [editingId, setEditingId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const currentMonth = new Date().getMonth() + 1;

    const paginated = useMemo(
        () => periods.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [periods, currentPage, pageSize],
    );

    return {
        currentSemester,
        editingId,
        setEditingId,
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        currentMonth,
        paginated,
    };
}
