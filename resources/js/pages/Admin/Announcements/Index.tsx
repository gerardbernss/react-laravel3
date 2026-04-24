import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit, Megaphone, Plus, Search, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';

interface Announcement {
    announcement_id: number;
    title: string;
    content: string;
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
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const filtered = useMemo(() => {
        return announcements.filter((a) => {
            const matchesSearch = !search || a.title.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [announcements, search, statusFilter]);

    const totalPages = Math.ceil(filtered.length / pageSize);

    const paginated = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, currentPage, pageSize]);

    const hasFilters = search || statusFilter !== 'all';

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('all');
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
                    <div className="grid gap-4 md:grid-cols-3">
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
                                            <td className="px-4 py-3 text-gray-600">{formatDate(a.publish_start)}</td>
                                            <td className="px-4 py-3 text-gray-600">{formatDate(a.publish_end)}</td>
                                            <td className="px-4 py-3 text-gray-600">{a.creator?.name ?? '—'}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center gap-1">
                                                    <Link href={`/admin/announcements/${a.announcement_id}/edit`}>
                                                        <Button variant="outline" size="sm">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setDeleteDialog({ open: true, id: a.announcement_id, title: a.title })}
                                                        disabled={processing}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between border-t bg-white px-4 py-3">
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-700">Rows per page:</span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                                    className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </select>
                                <span className="text-sm text-gray-600">
                                    {filtered.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
                                    {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                                    <ChevronsLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="px-3 py-1 text-sm">Page {currentPage} of {totalPages || 1}</span>
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0}>
                                    <ChevronsRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
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
