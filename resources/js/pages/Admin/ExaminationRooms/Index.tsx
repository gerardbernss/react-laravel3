import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { TablePagination } from '@/components/ui/table-pagination';
import {
    Building2,
    ChevronDown,
    ChevronUp,
    Eye,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface Room {
    id: number;
    name: string;
    building: string | null;
    capacity: number;
    floor: string | null;
    description: string | null;
    facilities: string | null;
    is_active: boolean;
    created_at: string;
}

interface Props {
    rooms: Room[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Examination Rooms', href: '/examination-rooms' },
];

type SortKey = 'name' | 'building' | 'floor' | 'capacity' | 'status';

export default function Index({ rooms }: Props) {
    const { delete: destroy, processing } = useForm();
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; name: string }>({ open: false, id: 0, name: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });

    const filteredItems = useMemo(() => {
        return rooms.filter((r) => {
            const q = searchQuery.toLowerCase();
            const matchesSearch = !q || r.name.toLowerCase().includes(q) || (r.building ?? '').toLowerCase().includes(q);
            const matchesStatus = !selectedStatus || (selectedStatus === 'active' ? r.is_active : !r.is_active);
            return matchesSearch && matchesStatus;
        });
    }, [rooms, searchQuery, selectedStatus]);

    const sortedItems = useMemo(() => {
        if (!sortConfig.key) return filteredItems;
        return [...filteredItems].sort((a, b) => {
            let aVal = '';
            let bVal = '';
            if (sortConfig.key === 'name') { aVal = a.name; bVal = b.name; }
            else if (sortConfig.key === 'building') { aVal = a.building ?? ''; bVal = b.building ?? ''; }
            else if (sortConfig.key === 'floor') { aVal = a.floor ?? ''; bVal = b.floor ?? ''; }
            else if (sortConfig.key === 'capacity') { aVal = String(a.capacity); bVal = String(b.capacity); }
            else if (sortConfig.key === 'status') { aVal = a.is_active ? 'active' : 'inactive'; bVal = b.is_active ? 'active' : 'inactive'; }
            return aVal.localeCompare(bVal) * (sortConfig.direction === 'asc' ? 1 : -1);
        });
    }, [filteredItems, sortConfig]);

    const totalPages = Math.ceil(sortedItems.length / pageSize);
    const paginatedItems = useMemo(
        () => sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [sortedItems, currentPage, pageSize],
    );

    const toggleSort = (key: SortKey) =>
        setSortConfig((prev) =>
            prev.key === key ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' },
        );

    const SortIcon = ({ col }: { col: SortKey }) =>
        sortConfig.key !== col ? (
            <ChevronUp className="ml-1 inline h-3 w-3 opacity-30" />
        ) : sortConfig.direction === 'asc' ? (
            <ChevronUp className="ml-1 inline h-3 w-3" />
        ) : (
            <ChevronDown className="ml-1 inline h-3 w-3" />
        );

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedStatus('');
        setCurrentPage(1);
    };

    const hasFilters = searchQuery || selectedStatus;

    const confirmDelete = () => {
        destroy(`/examination-rooms/${deleteDialog.id}`, {
            onSuccess: () => setDeleteDialog({ open: false, id: 0, name: '' }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Examination Rooms" />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <Building2 className="h-7 w-7 text-primary" />
                            <h1 className="text-3xl font-bold text-gray-900">Examination Rooms</h1>
                        </div>
                    </div>
                    <Link href="/examination-rooms/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Room
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Search</label>
                        <div className="mb-3 flex h-10 w-full items-center rounded-lg border border-gray-300 bg-white md:w-[400px]">
                            <span className="pl-3 pr-2 text-gray-500"><Search className="h-4 w-4" /></span>
                            <input
                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                                placeholder="Search by name or building..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
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
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                    <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 z-10 bg-gray-50">
                                <tr>
                                    <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100" onClick={() => toggleSort('name')}>
                                        Room Name <SortIcon col="name" />
                                    </th>
                                    <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100" onClick={() => toggleSort('building')}>
                                        Building <SortIcon col="building" />
                                    </th>
                                    <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100" onClick={() => toggleSort('floor')}>
                                        Floor <SortIcon col="floor" />
                                    </th>
                                    <th className="cursor-pointer px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100" onClick={() => toggleSort('capacity')}>
                                        Capacity <SortIcon col="capacity" />
                                    </th>
                                    <th className="cursor-pointer px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100" onClick={() => toggleSort('status')}>
                                        Status <SortIcon col="status" />
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center">
                                            <Building2 className="mx-auto h-10 w-10 text-gray-300" />
                                            <p className="mt-2 text-gray-500">
                                                {hasFilters ? 'No rooms match your filters.' : 'No examination rooms found.'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : paginatedItems.map((room) => (
                                    <tr key={room.id} className="border-b border-gray-200 transition-all hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900">{room.name}</p>
                                            {room.facilities && <p className="line-clamp-1 text-xs text-gray-500">{room.facilities}</p>}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{room.building || '—'}</td>
                                        <td className="px-4 py-3 text-gray-600">{room.floor || '—'}</td>
                                        <td className="px-4 py-3 text-center font-medium">{room.capacity}</td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge className={room.is_active ? 'bg-green-100 text-green-800' : ''}>
                                                {room.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-center gap-1">
                                                <Link href={`/examination-rooms/${room.id}`}>
                                                    <button className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted">
                                                        <Eye className="h-3 w-3" /> View
                                                    </button>
                                                </Link>
                                                <Link href={`/examination-rooms/${room.id}/edit`}>
                                                    <button className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted">
                                                        <Pencil className="h-3 w-3" /> Edit
                                                    </button>
                                                </Link>
                                                <button
                                                    onClick={() => setDeleteDialog({ open: true, id: room.id, name: room.name })}
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
