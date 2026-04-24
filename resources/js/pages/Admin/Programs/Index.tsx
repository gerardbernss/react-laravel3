import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ChevronsLeft,
    ChevronsRight,
    Edit,
    GraduationCap,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface Program {
    id: number;
    code: string;
    description: string;
    school: string;
    is_active: boolean;
    max_load: number;
    created_at: string;
}

interface Props {
    programs: Program[];
    schools: Record<string, string>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Programs', href: '/programs' },
];

type SortKey = 'code' | 'description' | 'school' | 'max_load' | 'status';

export default function Index({ programs, schools }: Props) {
    const { delete: destroy, processing } = useForm();
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; name: string }>({ open: false, id: 0, name: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSchool, setSelectedSchool] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });

    const filteredItems = useMemo(() => {
        return programs.filter((p) => {
            const q = searchQuery.toLowerCase();
            const matchesSearch = !q || p.code.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
            const matchesSchool = !selectedSchool || p.school === selectedSchool;
            const matchesStatus = !selectedStatus || (selectedStatus === 'active' ? p.is_active : !p.is_active);
            return matchesSearch && matchesSchool && matchesStatus;
        });
    }, [programs, searchQuery, selectedSchool, selectedStatus]);

    const sortedItems = useMemo(() => {
        if (!sortConfig.key) return filteredItems;
        return [...filteredItems].sort((a, b) => {
            let aVal = '';
            let bVal = '';
            if (sortConfig.key === 'code') { aVal = a.code; bVal = b.code; }
            else if (sortConfig.key === 'description') { aVal = a.description; bVal = b.description; }
            else if (sortConfig.key === 'school') { aVal = a.school; bVal = b.school; }
            else if (sortConfig.key === 'max_load') { aVal = String(a.max_load); bVal = String(b.max_load); }
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
        setSelectedSchool('');
        setSelectedStatus('');
        setCurrentPage(1);
    };

    const hasFilters = searchQuery || selectedSchool || selectedStatus;

    const confirmDelete = () => {
        destroy(`/programs/${deleteDialog.id}`, {
            onSuccess: () => setDeleteDialog({ open: false, id: 0, name: '' }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Courses/Programs" />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <GraduationCap className="h-7 w-7 text-primary" />
                            <h1 className="text-3xl font-bold text-gray-900">Programs</h1>
                        </div>
                    </div>
                    <Link href="/programs/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Program
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
                                placeholder="Search by code or description..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                        <Select value={selectedSchool || 'all'} onValueChange={(v) => { setSelectedSchool(v === 'all' ? '' : v); setCurrentPage(1); }}>
                            <SelectTrigger className="w-56"><SelectValue placeholder="School" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Schools</SelectItem>
                                {Object.entries(schools).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                                    <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500" onClick={() => toggleSort('code')}>
                                        Code <SortIcon col="code" />
                                    </th>
                                    <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500" onClick={() => toggleSort('description')}>
                                        Description <SortIcon col="description" />
                                    </th>
                                    <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500" onClick={() => toggleSort('school')}>
                                        School <SortIcon col="school" />
                                    </th>
                                    <th className="cursor-pointer px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500" onClick={() => toggleSort('max_load')}>
                                        Max Load <SortIcon col="max_load" />
                                    </th>
                                    <th className="cursor-pointer px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500" onClick={() => toggleSort('status')}>
                                        Status <SortIcon col="status" />
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center">
                                            <GraduationCap className="mx-auto h-10 w-10 text-gray-300" />
                                            <p className="mt-2 text-gray-500">
                                                {hasFilters ? 'No programs match your filters.' : 'No programs found.'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : paginatedItems.map((program) => (
                                    <tr key={program.id} className="border-b border-gray-200 transition-all hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">{program.code}</td>
                                        <td className="px-4 py-3 text-gray-900">{program.description}</td>
                                        <td className="px-4 py-3 text-gray-600">{program.school}</td>
                                        <td className="px-4 py-3 text-center">{program.max_load}</td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge className={program.is_active ? 'bg-green-100 text-green-800' : ''}>
                                                {program.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-center gap-1">
                                                <Link href={`/programs/${program.id}/edit`}>
                                                    <Button variant="outline" size="sm"><Edit className="h-4 w-4" /></Button>
                                                </Link>
                                                <Button
                                                    variant="outline" size="sm"
                                                    onClick={() => setDeleteDialog({ open: true, id: program.id, name: program.code })}
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

                    {/* Pagination Bar */}
                    <div className="flex items-center justify-between border-t bg-white px-4 py-3">
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-700">Rows per page:</span>
                            <select
                                value={pageSize}
                                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                                className="rounded-lg border border-gray-300 px-3 py-1 text-sm focus:outline-none"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                            <span className="text-sm text-gray-700">
                                {sortedItems.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, sortedItems.length)} of {sortedItems.length}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40">
                                <ChevronsLeft className="h-4 w-4" />
                            </button>
                            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40">
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <span className="px-4 py-2 text-sm font-medium">Page {currentPage} of {totalPages || 1}</span>
                            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40">
                                <ChevronRight className="h-4 w-4" />
                            </button>
                            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40">
                                <ChevronsRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, id: 0, name: '' })}
                onConfirm={confirmDelete}
                title="Delete Program"
                description={`Are you sure you want to delete "${deleteDialog.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                processingLabel="Deleting..."
                processing={processing}
            />
        </AppLayout>
    );
}
