import { ConfirmDialog } from '@/components/confirm-dialog';
import { AppBadge } from '@/components/app-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TablePagination } from '@/components/ui/table-pagination';
import { BODY_TEXT, CARD, FILTER_CARD, PAGE_PADDING, PAGE_TITLE, TABLE_HEADER_CELL, TABLE_HEADER_CELL_CENTER, TABLE_ROW, TABLE_ROW_ACTION, TABLE_ROW_ACTION_DANGER } from '@/constants/ui';
import { usePrograms, type Program, type ProgramSortKey } from '@/hooks/usePrograms';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ChevronDown, ChevronUp, GraduationCap, Pencil, Plus, Search, Trash2 } from 'lucide-react';

interface Props {
    programs: Program[];
    schools: Record<string, string>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Programs', href: '/programs' },
];

function SortIcon({ col, sortConfig }: { col: ProgramSortKey; sortConfig: { key: ProgramSortKey | null; direction: 'asc' | 'desc' } }) {
    if (sortConfig.key !== col) return <ChevronUp className="ml-1 inline h-3 w-3 opacity-30" />;
    return sortConfig.direction === 'asc'
        ? <ChevronUp className="ml-1 inline h-3 w-3" />
        : <ChevronDown className="ml-1 inline h-3 w-3" />;
}

interface ProgramRowProps {
    program: Program;
    processing: boolean;
    onDelete: (id: number, name: string) => void;
}

function ProgramRow({ program, processing, onDelete }: ProgramRowProps) {
    return (
        <tr className={TABLE_ROW}>
            <td className="px-4 py-3 font-medium text-gray-900">{program.code}</td>
            <td className="px-4 py-3 text-gray-900">{program.description}</td>
            <td className="px-4 py-3 text-gray-600">{program.school}</td>
            <td className="px-4 py-3 text-center">{program.max_load}</td>
            <td className="px-4 py-3 text-center">
                <AppBadge status={program.is_active ? 'active' : 'inactive'} />
            </td>
            <td className="px-4 py-3">
                <div className="flex justify-center gap-1">
                    <Link href={`/programs/${program.id}/edit`}>
                        <button className={TABLE_ROW_ACTION}>
                            <Pencil className="h-3 w-3" /> Edit
                        </button>
                    </Link>
                    <button
                        onClick={() => onDelete(program.id, program.code)}
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

export default function Index({ programs, schools }: Props) {
    const {
        processing,
        deleteDialog,
        setDeleteDialog,
        searchQuery,
        setSearchQuery,
        selectedSchool,
        setSelectedSchool,
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
    } = usePrograms(programs);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Courses/Programs" />

            <div className={PAGE_PADDING}>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <GraduationCap className="h-7 w-7 text-primary" />
                        <h1 className={PAGE_TITLE}>Programs</h1>
                    </div>
                    <Link href="/programs/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Program
                        </Button>
                    </Link>
                </div>

                <div className={`mb-6 ${FILTER_CARD}`}>
                    <div className="mb-3">
                        <label className="mb-1 block text-xs font-medium text-gray-600">Search</label>
                        <div className="relative w-full md:w-[400px]">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search by code or description..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="pl-10"
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

                <div className={`overflow-hidden ${CARD}`}>
                    <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 z-10 bg-gray-50">
                                <tr>
                                    <th className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('code')}>
                                        Code <SortIcon col="code" sortConfig={sortConfig} />
                                    </th>
                                    <th className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('description')}>
                                        Description <SortIcon col="description" sortConfig={sortConfig} />
                                    </th>
                                    <th className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('school')}>
                                        School <SortIcon col="school" sortConfig={sortConfig} />
                                    </th>
                                    <th className={`${TABLE_HEADER_CELL_CENTER} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('max_load')}>
                                        Max Load <SortIcon col="max_load" sortConfig={sortConfig} />
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
                                            <GraduationCap className="mx-auto h-10 w-10 text-gray-300" />
                                            <p className={`mt-2 ${BODY_TEXT}`}>
                                                {hasFilters ? 'No programs match your filters.' : 'No programs found.'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : paginatedItems.map((program) => (
                                    <ProgramRow
                                        key={program.id}
                                        program={program}
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
                title="Delete Program"
                description={`Are you sure you want to delete "${deleteDialog.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                processingLabel="Deleting..."
                processing={processing}
            />
        </AppLayout>
    );
}
