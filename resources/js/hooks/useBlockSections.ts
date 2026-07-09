import { useForm } from '@inertiajs/react';
import { type FormEvent, useMemo, useState } from 'react';

export interface BlockSectionSubject {
    id: number;
    code: string;
    name: string;
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
    is_active: boolean;
    subjects: BlockSectionSubject[];
}

export type BlockSectionSortKey = 'name' | 'grade_level' | 'school_year' | 'status';

function nextSchoolYear(year: string): string {
    const match = year.match(/^(\d{4})-(\d{4})$/);
    if (!match) return '';
    const start = Number(match[1]) + 1;
    const end = Number(match[2]) + 1;
    return `${start}-${end}`;
}

export const GRADE_LEVELS = [
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
];

/**
 * Filter, sort, and paginate the block sections list; also handles single delete and bulk copy-to-next-year
 * (auto-advancing the school year) via Inertia router.
 */
export function useBlockSections(blockSections: BlockSection[], schoolYears: string[]) {
    const { delete: destroy, processing } = useForm();

    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; name: string }>({
        open: false, id: 0, name: '',
    });

    const [showCopyDialog, setShowCopyDialog] = useState(false);
    const copyForm = useForm({
        from_school_year: schoolYears[schoolYears.length - 1] ?? '',
        to_school_year: '',
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGradeLevel, setSelectedGradeLevel] = useState('');
    const [selectedSchoolYear, setSelectedSchoolYear] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortConfig, setSortConfig] = useState<{ key: BlockSectionSortKey | null; direction: 'asc' | 'desc' }>({
        key: null,
        direction: 'asc',
    });

    const hasFilters = !!(searchQuery || selectedGradeLevel || selectedSchoolYear || selectedStatus);

    const filteredSections = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return blockSections.filter((s) => {
            const matchesSearch = !q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
            const matchesGrade = !selectedGradeLevel || s.grade_level === selectedGradeLevel;
            const matchesYear = !selectedSchoolYear || s.school_year === selectedSchoolYear;
            const matchesStatus = !selectedStatus || (selectedStatus === 'active' ? s.is_active : !s.is_active);
            return matchesSearch && matchesGrade && matchesYear && matchesStatus;
        });
    }, [blockSections, searchQuery, selectedGradeLevel, selectedSchoolYear, selectedStatus]);

    const sortedSections = useMemo(() => {
        if (!sortConfig.key) return filteredSections;
        return [...filteredSections].sort((a, b) => {
            const vals: Record<BlockSectionSortKey, [string, string]> = {
                name:         [a.name, b.name],
                grade_level:  [a.grade_level, b.grade_level],
                school_year:  [a.school_year, b.school_year],
                status:       [a.is_active ? 'active' : 'inactive', b.is_active ? 'active' : 'inactive'],
            };
            const [aVal, bVal] = vals[sortConfig.key!];
            return aVal.localeCompare(bVal) * (sortConfig.direction === 'asc' ? 1 : -1);
        });
    }, [filteredSections, sortConfig]);

    const paginatedSections = useMemo(
        () => sortedSections.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [sortedSections, currentPage, pageSize],
    );

    const toggleSort = (key: BlockSectionSortKey) => {
        setSortConfig((prev) =>
            prev.key === key
                ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                : { key, direction: 'asc' },
        );
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedGradeLevel('');
        setSelectedSchoolYear('');
        setSelectedStatus('');
        setCurrentPage(1);
    };

    const confirmDelete = () => {
        destroy(`/admin/block-sections/${deleteDialog.id}`, {
            onSuccess: () => setDeleteDialog({ open: false, id: 0, name: '' }),
        });
    };

    const setFromSchoolYear = (year: string) => {
        copyForm.setData('from_school_year', year);
        copyForm.setData('to_school_year', nextSchoolYear(year));
    };

    const openCopyDialog = () => {
        copyForm.reset();
        setFromSchoolYear(schoolYears[schoolYears.length - 1] ?? '');
        setShowCopyDialog(true);
    };

    const handleCopySubmit = (e: FormEvent) => {
        e.preventDefault();
        copyForm.post('/admin/block-sections/copy-year', {
            onSuccess: () => setShowCopyDialog(false),
        });
    };

    return {
        processing,
        deleteDialog,
        setDeleteDialog,
        showCopyDialog,
        setShowCopyDialog,
        copyForm,
        searchQuery,
        setSearchQuery,
        selectedGradeLevel,
        setSelectedGradeLevel,
        selectedSchoolYear,
        setSelectedSchoolYear,
        selectedStatus,
        setSelectedStatus,
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        sortConfig,
        hasFilters,
        sortedSections,
        paginatedSections,
        toggleSort,
        clearFilters,
        confirmDelete,
        setFromSchoolYear,
        openCopyDialog,
        handleCopySubmit,
    };
}
