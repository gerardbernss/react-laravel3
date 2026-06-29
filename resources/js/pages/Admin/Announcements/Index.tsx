import { AppBadge } from '@/components/AppBadge';
import { AppTable } from '@/components/AppTable';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TablePagination } from '@/components/ui/table-pagination';
import { BODY_TEXT, FILTER_CARD, PAGE_PADDING, PAGE_TITLE, SECTION_HEADING, TABLE_ROW_ACTION, TABLE_ROW_ACTION_DANGER } from '@/constants/ui';
import { useAnnouncementList, type Announcement } from '@/hooks/useAnnouncementList';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Megaphone, Pencil, Plus, Search, Trash2, X } from 'lucide-react';

interface Props {
    announcements: Announcement[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Announcements', href: '/admin/announcements' },
];

const AUDIENCE_COLOR: Record<string, 'blue' | 'yellow' | 'gray'> = {
    students: 'blue',
    applicants: 'yellow',
};

function formatDate(dt: string | null) {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('en-PH', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

export default function Index({ announcements }: Props) {
    const {
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
    } = useAnnouncementList(announcements);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Announcements" />

            <div className={PAGE_PADDING}>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Megaphone className="h-7 w-7 text-primary" />
                        <h1 className={PAGE_TITLE}>Announcements</h1>
                    </div>
                    <Link href="/admin/announcements/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Announcement
                        </Button>
                    </Link>
                </div>

                <div className={`mb-6 ${FILTER_CARD}`}>
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

                {filtered.length > 0 ? (
                    <AppTable
                        footer={
                            <TablePagination
                                total={filtered.length}
                                pageSize={pageSize}
                                currentPage={currentPage}
                                onPageChange={setCurrentPage}
                                onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
                            />
                        }
                    >
                        <AppTable.Head>
                            <AppTable.Th>Title</AppTable.Th>
                            <AppTable.Th center>Status</AppTable.Th>
                            <AppTable.Th center>Audience</AppTable.Th>
                            <AppTable.Th>Publish Start</AppTable.Th>
                            <AppTable.Th>Publish End</AppTable.Th>
                            <AppTable.Th>Created By</AppTable.Th>
                            <AppTable.Th center>Actions</AppTable.Th>
                        </AppTable.Head>
                        <AppTable.Body>
                            {paginated.map((a) => (
                                <AppTable.Row key={a.announcement_id}>
                                    <AppTable.Td>
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
                                    </AppTable.Td>
                                    <AppTable.Td className="text-center">
                                        <AppBadge status={a.status.charAt(0).toUpperCase() + a.status.slice(1)} />
                                    </AppTable.Td>
                                    <AppTable.Td className="text-center">
                                        <AppBadge
                                            status={a.target_audience === 'all' ? 'Everyone' : a.target_audience.charAt(0).toUpperCase() + a.target_audience.slice(1)}
                                            color={AUDIENCE_COLOR[a.target_audience] ?? 'gray'}
                                        />
                                    </AppTable.Td>
                                    <AppTable.Td className="text-gray-600">{formatDate(a.publish_start)}</AppTable.Td>
                                    <AppTable.Td className="text-gray-600">{formatDate(a.publish_end)}</AppTable.Td>
                                    <AppTable.Td className="text-gray-600">{a.creator?.name ?? '—'}</AppTable.Td>
                                    <AppTable.Td>
                                        <div className="flex justify-center gap-1">
                                            <Link href={`/admin/announcements/${a.announcement_id}/edit`}>
                                                <button className={TABLE_ROW_ACTION}>
                                                    <Pencil className="h-3 w-3" /> Edit
                                                </button>
                                            </Link>
                                            <button
                                                onClick={() => setDeleteDialog({ open: true, id: a.announcement_id, title: a.title })}
                                                disabled={processing}
                                                className={TABLE_ROW_ACTION_DANGER}
                                            >
                                                <Trash2 className="h-3 w-3" /> Delete
                                            </button>
                                        </div>
                                    </AppTable.Td>
                                </AppTable.Row>
                            ))}
                        </AppTable.Body>
                    </AppTable>
                ) : (
                    <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
                        <Megaphone className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className={`mt-4 ${SECTION_HEADING}`}>No announcements found</h3>
                        <p className={`mt-2 ${BODY_TEXT}`}>
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
