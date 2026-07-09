import { AppBadge } from '@/components/AppBadge';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TablePagination } from '@/components/ui/table-pagination';
import { BODY_TEXT, CARD, LABEL_TEXT, PAGE_PADDING, PAGE_TITLE, TABLE_HEADER_CELL, TABLE_HEADER_CELL_CENTER, TABLE_ROW, TABLE_ROW_ACTION, TABLE_ROW_ACTION_DANGER } from '@/constants/ui';
import { useExaminationRooms, type ExaminationRoom, type RoomSortKey } from '@/hooks/useExaminationRooms';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Building2, ChevronDown, ChevronUp, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';

interface Props {
    rooms: ExaminationRoom[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Examination Rooms', href: '/admin/examination-rooms' },
];

function SortIcon({ col, sortConfig }: { col: RoomSortKey; sortConfig: { key: RoomSortKey | null; direction: 'asc' | 'desc' } }) {
    if (sortConfig.key !== col) return <ChevronUp className="ml-1 inline h-3 w-3 opacity-30" />;
    return sortConfig.direction === 'asc'
        ? <ChevronUp className="ml-1 inline h-3 w-3" />
        : <ChevronDown className="ml-1 inline h-3 w-3" />;
}

interface RoomRowProps {
    room: ExaminationRoom;
    processing: boolean;
    onDelete: (id: number, name: string) => void;
}

function RoomRow({ room, processing, onDelete }: RoomRowProps) {
    return (
        <tr className={TABLE_ROW}>
            <td className="px-4 py-3">
                <p className="font-medium text-gray-900">{room.name}</p>
                {room.facilities && <p className="line-clamp-1 text-xs text-gray-500">{room.facilities}</p>}
            </td>
            <td className="px-4 py-3 text-gray-600">{room.building || '—'}</td>
            <td className="px-4 py-3 text-gray-600">{room.floor || '—'}</td>
            <td className="px-4 py-3 text-center font-medium">{room.capacity}</td>
            <td className="px-4 py-3 text-center">
                <AppBadge status={room.is_active ? 'active' : 'inactive'}>
                    {room.is_active ? 'Active' : 'Inactive'}
                </AppBadge>
            </td>
            <td className="px-4 py-3">
                <div className="flex justify-center gap-1">
                    <Link href={`/admin/examination-rooms/${room.id}`}>
                        <button className={TABLE_ROW_ACTION}>
                            <Eye className="h-3 w-3" /> View
                        </button>
                    </Link>
                    <Link href={`/admin/examination-rooms/${room.id}/edit`}>
                        <button className={TABLE_ROW_ACTION}>
                            <Pencil className="h-3 w-3" /> Edit
                        </button>
                    </Link>
                    <button
                        onClick={() => onDelete(room.id, room.name)}
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

/** Admin examination rooms list with search and delete actions. */
export default function Index({ rooms }: Props) {
    const {
        processing,
        deleteDialog,
        setDeleteDialog,
        searchQuery,
        setSearchQuery,
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
    } = useExaminationRooms(rooms);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Examination Rooms" />

            <div className={PAGE_PADDING}>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className={PAGE_TITLE}>Examination Rooms</h1>
                    <Link href="/admin/examination-rooms/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Room
                        </Button>
                    </Link>
                </div>

                <div className="mb-6 flex flex-wrap items-end gap-3">
                    <div>
                        <label className={`mb-1 block ${LABEL_TEXT}`}>Search</label>
                        <div className="relative w-full sm:w-[300px]">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search by name or building..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <Select value={selectedStatus || 'all'} onValueChange={(v) => { setSelectedStatus(v === 'all' ? '' : v); setCurrentPage(1); }}>
                        <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                    {hasFilters && <Button variant="ghost" onClick={clearFilters}>Clear</Button>}
                </div>

                <div className={`overflow-hidden ${CARD}`}>
                    <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 z-10 bg-gray-50">
                                <tr>
                                    <th className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('name')}>
                                        Room Name <SortIcon col="name" sortConfig={sortConfig} />
                                    </th>
                                    <th className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('building')}>
                                        Building <SortIcon col="building" sortConfig={sortConfig} />
                                    </th>
                                    <th className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('floor')}>
                                        Floor <SortIcon col="floor" sortConfig={sortConfig} />
                                    </th>
                                    <th className={`${TABLE_HEADER_CELL_CENTER} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('capacity')}>
                                        Capacity <SortIcon col="capacity" sortConfig={sortConfig} />
                                    </th>
                                    <th className={`${TABLE_HEADER_CELL_CENTER} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('status')}>
                                        Status <SortIcon col="status" sortConfig={sortConfig} />
                                    </th>
                                    <th className={TABLE_HEADER_CELL_CENTER}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center">
                                            <Building2 className="mx-auto h-10 w-10 text-gray-300" />
                                            <p className={`mt-2 ${BODY_TEXT}`}>
                                                {hasFilters ? 'No rooms match your filters.' : 'No examination rooms found.'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : paginatedItems.map((room) => (
                                    <RoomRow
                                        key={room.id}
                                        room={room}
                                        processing={processing}
                                        onDelete={(id, name) => setDeleteDialog({ open: true, id, name })}
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
                onClose={() => setDeleteDialog({ open: false, id: 0, name: '' })}
                onConfirm={confirmDelete}
                title="Delete Examination Room"
                description={`Are you sure you want to delete "${deleteDialog.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                processingLabel="Deleting..."
                processing={processing}
            />
        </AppLayout>
    );
}
