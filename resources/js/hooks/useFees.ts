import { getSchoolYearOptions } from '@/lib/school-year';
import { router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export interface Fee {
    id: number;
    name: string;
    code: string;
    category: string;
    is_per_unit: boolean;
    is_required: boolean;
    school_level: string;
    school_year: string;
    semester: string;
    amount: number;
    is_active: boolean;
}

export interface FeeFilters {
    school_year?: string;
    semester?: string;
    school_level?: string;
    category?: string;
}

/**
 * Filter and paginate the fees list; also handle single delete, active/inactive toggle,
 * and bulk copy-from-year with optional percentage adjustment.
 */
export function useFees(fees: Fee[], filters: FeeFilters) {
    const { delete: destroy, processing } = useForm();

    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; name: string }>({
        open: false, id: 0, name: '',
    });

    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState(filters.category ?? 'all');
    const [filterLevel, setFilterLevel] = useState(filters.school_level ?? 'all');
    const [filterYear, setFilterYear] = useState(filters.school_year ?? 'all');
    const [filterSemester, setFilterSemester] = useState(filters.semester ?? 'all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);

    const [copyModal, setCopyModal] = useState(false);
    const [copySource, setCopySource] = useState('');
    const [copyTarget, setCopyTarget] = useState(getSchoolYearOptions()[0]);
    const [copyPct, setCopyPct] = useState('0');
    const [copying, setCopying] = useState(false);

    const hasFilters =
        !!(search || filterCategory !== 'all' || filterLevel !== 'all' ||
           filterYear !== 'all' || filterSemester !== 'all' || filterStatus !== 'all');

    const filtered = useMemo(() => {
        return fees.filter((f) => {
            const q = search.toLowerCase();
            if (q && !f.name.toLowerCase().includes(q) && !f.code.toLowerCase().includes(q)) return false;
            if (filterCategory !== 'all' && f.category !== filterCategory) return false;
            if (filterLevel !== 'all' && f.school_level !== filterLevel) return false;
            if (filterYear !== 'all' && f.school_year !== filterYear) return false;
            if (filterSemester !== 'all' && f.semester !== filterSemester) return false;
            if (filterStatus === 'active' && !f.is_active) return false;
            if (filterStatus === 'inactive' && f.is_active) return false;
            return true;
        });
    }, [fees, search, filterCategory, filterLevel, filterYear, filterSemester, filterStatus]);

    const paginated = useMemo(
        () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [filtered, currentPage, pageSize],
    );

    const clearFilters = () => {
        setSearch('');
        setFilterCategory('all');
        setFilterLevel('all');
        setFilterYear('all');
        setFilterSemester('all');
        setFilterStatus('all');
        setCurrentPage(1);
    };

    const confirmDelete = () => {
        destroy(`/admin/fees/${deleteDialog.id}`, {
            onSuccess: () => setDeleteDialog({ open: false, id: 0, name: '' }),
        });
    };

    const handleToggle = (id: number) => {
        router.post(`/admin/fees/${id}/toggle-status`, {}, { preserveScroll: true });
    };

    const handleCopyFromYear = () => {
        if (!copySource || !copyTarget) return;
        setCopying(true);
        router.post(
            '/admin/fees/copy-from-year',
            { source_year: copySource, target_year: copyTarget, adjust_percentage: parseFloat(copyPct) || 0 },
            { onFinish: () => { setCopying(false); setCopyModal(false); } },
        );
    };

    return {
        processing,
        deleteDialog,
        setDeleteDialog,
        search,
        setSearch,
        filterCategory,
        setFilterCategory,
        filterLevel,
        setFilterLevel,
        filterYear,
        setFilterYear,
        filterSemester,
        setFilterSemester,
        filterStatus,
        setFilterStatus,
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        copyModal,
        setCopyModal,
        copySource,
        setCopySource,
        copyTarget,
        setCopyTarget,
        copyPct,
        setCopyPct,
        copying,
        hasFilters,
        filtered,
        paginated,
        clearFilters,
        confirmDelete,
        handleToggle,
        handleCopyFromYear,
    };
}
