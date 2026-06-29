import { useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export interface Subject {
    id: number;
    code: string;
    name: string;
    description: string | null;
    units: number;
    type: string;
    grade_level: string | null;
    semester: string | null;
    default_schedule: { display: string; room: string | null } | null;
    is_active: boolean;
    created_at: string;
}

export type SubjectSortKey = 'code' | 'name' | 'type' | 'units' | 'grade_level' | 'status';

export function useSubjects(subjects: Subject[]) {
    const { delete: destroy, processing } = useForm();

    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; name: string }>({
        open: false, id: 0, name: '',
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGradeLevel, setSelectedGradeLevel] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortConfig, setSortConfig] = useState<{ key: SubjectSortKey | null; direction: 'asc' | 'desc' }>({
        key: null,
        direction: 'asc',
    });

    const hasFilters = !!(searchQuery || selectedGradeLevel || selectedType || selectedStatus);

    const filteredItems = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return subjects.filter((s) => {
            const matchesSearch = !q || s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
            const matchesGrade = !selectedGradeLevel || s.grade_level === selectedGradeLevel;
            const matchesType = !selectedType || s.type === selectedType;
            const matchesStatus = !selectedStatus || (selectedStatus === 'active' ? s.is_active : !s.is_active);
            return matchesSearch && matchesGrade && matchesType && matchesStatus;
        });
    }, [subjects, searchQuery, selectedGradeLevel, selectedType, selectedStatus]);

    const sortedItems = useMemo(() => {
        if (!sortConfig.key) return filteredItems;
        return [...filteredItems].sort((a, b) => {
            const vals: Record<SubjectSortKey, [string, string]> = {
                code:        [a.code, b.code],
                name:        [a.name, b.name],
                type:        [a.type, b.type],
                units:       [String(a.units), String(b.units)],
                grade_level: [a.grade_level ?? '', b.grade_level ?? ''],
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

    const toggleSort = (key: SubjectSortKey) => {
        setSortConfig((prev) =>
            prev.key === key
                ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                : { key, direction: 'asc' },
        );
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedGradeLevel('');
        setSelectedType('');
        setSelectedStatus('');
        setCurrentPage(1);
    };

    const confirmDelete = () => {
        destroy(`/subjects/${deleteDialog.id}`, {
            onSuccess: () => setDeleteDialog({ open: false, id: 0, name: '' }),
        });
    };

    return {
        processing,
        deleteDialog,
        setDeleteDialog,
        searchQuery,
        setSearchQuery,
        selectedGradeLevel,
        setSelectedGradeLevel,
        selectedType,
        setSelectedType,
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
