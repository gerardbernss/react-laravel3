import { useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export interface ScheduleSubject {
    id: number;
    code: string;
    name: string;
}

export interface ScheduleBlockSection {
    id: number;
    code: string;
    name: string;
}

export interface ScheduleTeacher {
    id: number;
    name: string;
}

export interface SubjectSchedule {
    id: number;
    subject_id: number;
    block_section_id: number | null;
    days: string;
    time: string;
    room: string | null;
    code: string | null;
    display: string;
    subject: ScheduleSubject;
    block_section: ScheduleBlockSection | null;
    teacher: ScheduleTeacher | null;
}

export type SubjectScheduleSortKey = 'subject' | 'section' | 'days';

/** Filter, sort, and paginate the subject schedules list, and delete a schedule via Inertia. */
export function useSubjectSchedules(schedules: SubjectSchedule[]) {
    const { delete: destroy, processing } = useForm();

    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; label: string }>({
        open: false, id: 0, label: '',
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortConfig, setSortConfig] = useState<{ key: SubjectScheduleSortKey | null; direction: 'asc' | 'desc' }>({
        key: null,
        direction: 'asc',
    });

    const hasFilters = !!searchQuery;

    const filteredItems = useMemo(() => {
        const q = searchQuery.toLowerCase();
        if (!q) return schedules;
        return schedules.filter((s) =>
            s.subject.code.toLowerCase().includes(q) ||
            s.subject.name.toLowerCase().includes(q) ||
            (s.block_section?.code.toLowerCase().includes(q) ?? false) ||
            (s.block_section?.name.toLowerCase().includes(q) ?? false)
        );
    }, [schedules, searchQuery]);

    const sortedItems = useMemo(() => {
        if (!sortConfig.key) return filteredItems;
        return [...filteredItems].sort((a, b) => {
            const vals: Record<SubjectScheduleSortKey, [string, string]> = {
                subject: [a.subject.code, b.subject.code],
                section: [a.block_section?.code ?? '', b.block_section?.code ?? ''],
                days: [a.days, b.days],
            };
            const [aVal, bVal] = vals[sortConfig.key!];
            return aVal.localeCompare(bVal) * (sortConfig.direction === 'asc' ? 1 : -1);
        });
    }, [filteredItems, sortConfig]);

    const paginatedItems = useMemo(
        () => sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [sortedItems, currentPage, pageSize],
    );

    const toggleSort = (key: SubjectScheduleSortKey) => {
        setSortConfig((prev) =>
            prev.key === key
                ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                : { key, direction: 'asc' },
        );
    };

    const clearFilters = () => {
        setSearchQuery('');
        setCurrentPage(1);
    };

    const confirmDelete = () => {
        destroy(`/admin/subject-schedules/${deleteDialog.id}`, {
            onSuccess: () => setDeleteDialog({ open: false, id: 0, label: '' }),
        });
    };

    return {
        processing,
        deleteDialog,
        setDeleteDialog,
        searchQuery,
        setSearchQuery,
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        sortConfig,
        hasFilters,
        sortedItems,
        paginatedItems,
        toggleSort,
        clearFilters,
        confirmDelete,
    };
}
