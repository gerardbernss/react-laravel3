import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { TablePagination } from '@/components/ui/table-pagination';
import { Megaphone, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';

interface Announcement {
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

interface Props {
    announcements: Announcement[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Announcements', href: '/admin/announcements' },
];

const statusColors: Record<string, string> = {
    active:    'bg-green-100 text-green-800',
    scheduled: 'bg-blue-100 text-blue-800',
    expired:   'bg-gray-100 text-gray-600',
    draft:     'bg-yellow-100 text-yellow-800',
};

function formatDate(dt: string | null) {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('en-PH', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

export default function Index({ announcements }: Props) {
    const { delete: destroy, processing } = useForm();
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; title: string }>({
        open: false, id: 0, title: '',
    });

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [audienceFilter, setAudienceFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const filtered = useMemo(() => {
        return announcements.filter((a) => {
            const matchesSearch = !search || a.title.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
            const matchesAudience = audienceFilter === 'all' || a.target_audience === audienceFilter;
            return matchesSearch && matchesStatus && matchesAudience;
        });
    }, [announcements, search, statusFilter, audienceFilter]);

    const totalPages = Math.ceil(filtered.length / pageSize);

    const paginated = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, currentPage, pageSize]);

    const hasFilters = search || statusFilter !== 'all' || audienceFilter !== 'all';

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Announcements" />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <Megaphone className="h-7 w-7 text-primary" />
                            <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
                        </div>
                    </div>
                    <Link href="/admin/announcements/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Announcement
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-4">
                        <div className="relative md:col-span-2">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search by title..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                                className="pl-10"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                <SelectItem value="expired">Expired</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={audienceFilter} onValueChange={(v) => { setAudienceFilter(v); setCurrentPage(1); }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Audience" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Audiences</SelectItem>
                                <SelectItem value="students">Students</SelectItem>
                                <SelectItem value="applicants">Applicants</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {hasFilters && (
                        <div className="mt-3 flex items-center gap-2">
                            <span className="text-sm text-gray-500">Active filters:</span>
                            <Button variant="ghost" size="sm" onClick={clearFilters}>
                                <X className="mr-1 h-3 w-3" />
                                Clear all
                            </Button>
                        </div>
                    )}
                </div>

                {/* Table */}
                {filtered.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                        <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 z-10 bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Title</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Audience</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Publish Start</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Publish End</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Created By</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {paginated.map((a) => (
                                        <tr key={a.announcement_id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-gray-900">{a.title}</p>
                                                {a.attachment && (
                                                    <a
                                                        href={`/storage/${a.attachment}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-blue-600 hover:underline"
                                                    >
                                                        View attachment
                                                    </a>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge className={statusColors[a.status]}>
                                                    {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge className={
                                                    a.target_audience === 'students'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : a.target_audience === 'applicants'
                                                            ? 'bg-orange-100 text-orange-800'
                                                            : 'bg-gray-100 text-gray-700'
                                                }>
                                                    {a.target_audience === 'all' ? 'Everyone' : a.target_audience.charAt(0).toUpperCase() + a.target_audience.slice(1)}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{formatDate(a.publish_start)}</td>
                                            <td className="px-4 py-3 text-gray-600">{formatDate(a.publish_end)}</td>
                                            <td className="px-4 py-3 text-gray-600">{a.creator?.name ?? '—'}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center gap-1">
                                                    <Link href={`/admin/announcements/${a.announcement_id}/edit`}>
                                                        <button className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted">
                                                            <Pencil className="h-3 w-3" /> Edit
                                                        </button>
                                                    </Link>
                                                    <button
                                                        onClick={() => setDeleteDialog({ open: true, id: a.announcement_id, title: a.title })}
                                                        disabled={processing}
                                                        className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50"
                                                    >
                                                        <Trash2 className="h-3 w-3" /> Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <TablePagination
                            total={filtered.length}
                            pageSize={pageSize}
                            currentPage={currentPage}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
                        />
                    </div>
                ) : (
                    <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
                        <Megaphone className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">No announcements found</h3>
                        <p className="mt-2 text-gray-600">
                            {hasFilters
                                ? 'No announcements match your filters. Try adjusting your search criteria.'
                                : 'Get started by creating your first announcement.'}
                        </p>
                        {!hasFilters && (
                            <Link href="/admin/announcements/create">
                                <Button className="mt-4">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Announcement
                                </Button>
                            </Link>
                        )}
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, id: 0, title: '' })}
                onConfirm={confirmDelete}
                title="Delete Announcement"
                description={`Are you sure you want to delete "${deleteDialog.title}"? This action cannot be undone.`}
                confirmLabel="Delete"
                processingLabel="Deleting..."
                processing={processing}
            />
        </AppLayout>
    );
}
