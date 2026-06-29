import { useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export interface Program {
    id: number;
    code: string;
    description: string;
    school: string;
    is_active: boolean;
    max_load: number;
    created_at: string;
}

export type ProgramSortKey = 'code' | 'description' | 'school' | 'max_load' | 'status';

export function usePrograms(programs: Program[]) {
    const { delete: destroy, processing } = useForm();

    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; name: string }>({
        open: false, id: 0, name: '',
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSchool, setSelectedSchool] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortConfig, setSortConfig] = useState<{ key: ProgramSortKey | null; direction: 'asc' | 'desc' }>({
        key: null,
        direction: 'asc',
    });

    const hasFilters = !!(searchQuery || selectedSchool || selectedStatus);

    const filteredItems = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return programs.filter((p) => {
            const matchesSearch = !q || p.code.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
            const matchesSchool = !selectedSchool || p.school === selectedSchool;
            const matchesStatus = !selectedStatus || (selectedStatus === 'active' ? p.is_active : !p.is_active);
            return matchesSearch && matchesSchool && matchesStatus;
        });
    }, [programs, searchQuery, selectedSchool, selectedStatus]);

    const sortedItems = useMemo(() => {
        if (!sortConfig.key) return filteredItems;
        return [...filteredItems].sort((a, b) => {
            const vals: Record<ProgramSortKey, [string, string]> = {
                code:        [a.code, b.code],
                description: [a.description, b.description],
                school:      [a.school, b.school],
                max_load:    [String(a.max_load), String(b.max_load)],
                status:      [a.is_active ? 'active' : 'inactive', b.is_active ? 'active' : 'inactive'],
            };
            const [aVal, bVal] = vals[sortConfig.key!];
            return aVal.localeCompare(bVal) * (sortConfig.direction === 'asc' ? 1 : -1);
        });
    }, [filteredItems, sortConfig]);

    const paginatedItems = useMemo(
        () => sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [sortedItems, currentPage, pageSize],
    );

    const toggleSort = (key: ProgramSortKey) => {
        setSortConfig((prev) =>
            prev.key === key
                ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                : { key, direction: 'asc' },
        );
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedSchool('');
        setSelectedStatus('');
        setCurrentPage(1);
    };

    const confirmDelete = () => {
        destroy(`/programs/${deleteDialog.id}`, {
            onSuccess: () => setDeleteDialog({ open: false, id: 0, name: '' }),
        });
    };

    return {
        processing,
        deleteDialog,
        setDeleteDialog,
        searchQuery,
        setSearchQuery,
        selectedSchool,
        setSelectedSchool,
        selectedStatus,
        setSelectedStatus,
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
