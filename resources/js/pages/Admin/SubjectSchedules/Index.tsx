import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TablePagination } from '@/components/ui/table-pagination';
import { BODY_TEXT, CARD, PAGE_PADDING, PAGE_TITLE, TABLE_HEADER_CELL, TABLE_HEADER_CELL_CENTER, TABLE_ROW, TABLE_ROW_ACTION, TABLE_ROW_ACTION_DANGER } from '@/constants/ui';
import { useSubjectSchedules, type SubjectSchedule, type SubjectScheduleSortKey } from '@/hooks/useSubjectSchedules';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { CalendarClock, ChevronDown, ChevronUp, Pencil, Plus, Search, Trash2 } from 'lucide-react';

interface Props {
    schedules: SubjectSchedule[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Subject Schedules', href: '/admin/subject-schedules' },
];

function SortIcon({ col, sortConfig }: { col: SubjectScheduleSortKey; sortConfig: { key: SubjectScheduleSortKey | null; direction: 'asc' | 'desc' } }) {
    if (sortConfig.key !== col) return <ChevronUp className="ml-1 inline h-3 w-3 opacity-30" />;
    return sortConfig.direction === 'asc'
        ? <ChevronUp className="ml-1 inline h-3 w-3" />
        : <ChevronDown className="ml-1 inline h-3 w-3" />;
}

interface ScheduleRowProps {
    schedule: SubjectSchedule;
    processing: boolean;
    onDelete: (id: number, label: string) => void;
}

function ScheduleRow({ schedule, processing, onDelete }: ScheduleRowProps) {
    const label = `${schedule.subject.code} (${schedule.block_section?.code ?? 'Default'})`;

    return (
        <tr className={TABLE_ROW}>
            <td className="px-4 py-3 font-medium text-gray-900">{schedule.subject.code}</td>
            <td className="px-4 py-3 text-gray-600">{schedule.subject.name}</td>
            <td className="px-4 py-3">
                {schedule.block_section
                    ? <Badge variant="outline">{schedule.block_section.code}</Badge>
                    : <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">Default</span>}
            </td>
            <td className="px-4 py-3 text-gray-600">{schedule.display}</td>
            <td className="px-4 py-3 text-gray-600">{schedule.room ?? '—'}</td>
            <td className="px-4 py-3 text-gray-600">{schedule.code ?? '—'}</td>
            <td className="px-4 py-3 text-gray-600">{schedule.teacher?.name ?? '—'}</td>
            <td className="px-4 py-3">
                <div className="flex justify-center gap-1">
                    <Link href={`/admin/subject-schedules/${schedule.id}/edit`}>
                        <button className={TABLE_ROW_ACTION}>
                            <Pencil className="h-3 w-3" /> Edit
                        </button>
                    </Link>
                    <button
                        onClick={() => onDelete(schedule.id, label)}
                        disabled={processing}
                        className={TABLE_ROW_ACTION_DANGER}
                    >
                        <Trash2 className="h-3 w-3" /> Delete
                    </button>
                </div>
            </td>
        </tr>
    );
}

/** Admin subject schedules list with search, sort, and delete actions. */
export default function Index({ schedules }: Props) {
    const {
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
    } = useSubjectSchedules(schedules);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Subject Schedules" />

            <div className={PAGE_PADDING}>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className={PAGE_TITLE}>Subject Schedules</h1>
                    <Link href="/admin/subject-schedules/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Schedule
                        </Button>
                    </Link>
                </div>

                <div className="mb-6 flex flex-wrap items-end gap-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Search</label>
                        <div className="relative w-full sm:w-[300px]">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search by subject or section..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    {hasFilters && <Button variant="ghost" onClick={clearFilters}>Clear</Button>}
                </div>

                <div className={`overflow-hidden ${CARD}`}>
                    <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 z-10 bg-gray-50">
                                <tr>
                                    <th className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('subject')}>
                                        Subject <SortIcon col="subject" sortConfig={sortConfig} />
                                    </th>
                                    <th className={TABLE_HEADER_CELL}>Name</th>
                                    <th className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('section')}>
                                        Section <SortIcon col="section" sortConfig={sortConfig} />
                                    </th>
                                    <th className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('days')}>
                                        Days / Time <SortIcon col="days" sortConfig={sortConfig} />
                                    </th>
                                    <th className={TABLE_HEADER_CELL}>Room</th>
                                    <th className={TABLE_HEADER_CELL}>Code</th>
                                    <th className={TABLE_HEADER_CELL}>Teacher</th>
                                    <th className={TABLE_HEADER_CELL_CENTER}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center">
                                            <CalendarClock className="mx-auto h-10 w-10 text-gray-300" />
                                            <p className={`mt-2 ${BODY_TEXT}`}>
                                                {hasFilters ? 'No schedules match your search.' : 'No schedules found.'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : paginatedItems.map((schedule) => (
                                    <ScheduleRow
                                        key={schedule.id}
                                        schedule={schedule}
                                        processing={processing}
                                        onDelete={(id, label) => setDeleteDialog({ open: true, id, label })}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <TablePagination
                        total={sortedItems.length}
                        pageSize={pageSize}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
                    />
                </div>
            </div>

            <ConfirmDialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, id: 0, label: '' })}
                onConfirm={confirmDelete}
                title="Delete Schedule"
                description={`Are you sure you want to delete the schedule for "${deleteDialog.label}"? This action cannot be undone.`}
                confirmLabel="Delete"
                processingLabel="Deleting..."
                processing={processing}
            />
        </AppLayout>
    );
}
