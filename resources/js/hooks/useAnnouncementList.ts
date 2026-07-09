import { useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export interface Announcement {
    announcement_id: number;
    title: string;
    content: string;
    target_audience: string;
    attachment: string | null;
    publish_start: string | null;
    publish_end: string | null;
    status: 'draft' | 'scheduled' | 'active' | 'expired';
    created_at: string;
    creator: { id: number; name: string } | null;
}

/**
 * Filter and paginate the announcement list by search query, status, and target audience,
 * and delete an announcement via Inertia.
 */
export function useAnnouncementList(announcements: Announcement[]) {
    const { delete: destroy, processing } = useForm();

    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; title: string }>({
        open: false, id: 0, title: '',
    });
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [audienceFilter, setAudienceFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const filtered = useMemo(
        () =>
            announcements.filter((a) => {
                const matchesSearch = !search || a.title.toLowerCase().includes(search.toLowerCase());
                const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
                const matchesAudience = audienceFilter === 'all' || a.target_audience === audienceFilter;
                return matchesSearch && matchesStatus && matchesAudience;
            }),
        [announcements, search, statusFilter, audienceFilter],
    );

    const paginated = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, currentPage, pageSize]);

    const hasFilters = !!(search || statusFilter !== 'all' || audienceFilter !== 'all');

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setAudienceFilter('all');
        setCurrentPage(1);
    };

    const confirmDelete = () => {
        destroy(`/admin/announcements/${deleteDialog.id}`, {
            onSuccess: () => setDeleteDialog({ open: false, id: 0, title: '' }),
        });
    };

    return {
        processing,
        deleteDialog,
        setDeleteDialog,
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        audienceFilter,
        setAudienceFilter,
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        filtered,
        paginated,
        hasFilters,
        clearFilters,
        confirmDelete,
    };
}
