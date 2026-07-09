import { ConfirmDialog } from '@/components/confirm-dialog';
import { AppBadge } from '@/components/AppBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TablePagination } from '@/components/ui/table-pagination';
import { BODY_TEXT, CARD, PAGE_PADDING, PAGE_TITLE, TABLE_HEADER_CELL, TABLE_HEADER_CELL_CENTER, TABLE_ROW, TABLE_ROW_ACTION, TABLE_ROW_ACTION_DANGER } from '@/constants/ui';
import { useSubjects, type Subject, type SubjectSortKey } from '@/hooks/useSubjects';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { BookOpen, ChevronDown, ChevronUp, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';

interface Props {
    subjects: Subject[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Subjects', href: '/admin/subjects' },
];

const GRADE_LEVELS = [
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
];

const SUBJECT_TYPES = ['Core', 'Major', 'Minor', 'Elective', 'Specialized'];

function SortIcon({ col, sortConfig }: { col: SubjectSortKey; sortConfig: { key: SubjectSortKey | null; direction: 'asc' | 'desc' } }) {
    if (sortConfig.key !== col) return <ChevronUp className="ml-1 inline h-3 w-3 opacity-30" />;
    return sortConfig.direction === 'asc'
        ? <ChevronUp className="ml-1 inline h-3 w-3" />
        : <ChevronDown className="ml-1 inline h-3 w-3" />;
}

interface SubjectRowProps {
    subject: Subject;
    processing: boolean;
    onDelete: (id: number, name: string) => void;
}

function SubjectRow({ subject, processing, onDelete }: SubjectRowProps) {
    return (
        <tr className={TABLE_ROW}>
            <td className="px-4 py-3 font-medium text-gray-900">{subject.code}</td>
            <td className="px-4 py-3">
                <p className="font-medium text-gray-900">{subject.name}</p>
                {subject.description && (
                    <p className="line-clamp-1 text-xs text-gray-500">{subject.description}</p>
                )}
            </td>
            <td className="px-4 py-3">
                <Badge variant="outline">{subject.type}</Badge>
            </td>
            <td className="px-4 py-3 text-center">{subject.units}</td>
            <td className="px-4 py-3 text-gray-600">{subject.grade_level || '—'}</td>
            <td className="px-4 py-3">
                {subject.semester
                    ? <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{subject.semester}</span>
                    : <span className="text-xs text-gray-400">Any</span>}
            </td>
            <td className="px-4 py-3 text-center">
                <AppBadge status={subject.is_active ? 'active' : 'inactive'} />
            </td>
            <td className="px-4 py-3">
                <div className="flex justify-center gap-1">
                    <Link href={`/admin/subjects/${subject.id}`}>
                        <button className={TABLE_ROW_ACTION}>
                            <Eye className="h-3 w-3" /> View
                        </button>
                    </Link>
                    <Link href={`/admin/subjects/${subject.id}/edit`}>
                        <button className={TABLE_ROW_ACTION}>
                            <Pencil className="h-3 w-3" /> Edit
                        </button>
                    </Link>
                    <button
                        onClick={() => onDelete(subject.id, subject.name)}
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

/** Admin subjects list with search, sort, and delete actions. */
export default function Index({ subjects }: Props) {
    const {
        processing,
        deleteDialog,
        setDeleteDialog,
        searchQuery,
        setSearchQuery,
        selectedGradeLevel,
        setSelectedGradeLevel,
        selectedType,
        setSelectedType,
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
    } = useSubjects(subjects);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Subjects" />

            <div className={PAGE_PADDING}>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className={PAGE_TITLE}>Subjects</h1>
                    <Link href="/admin/subjects/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Subject
                        </Button>
                    </Link>
                </div>

                <div className="mb-6 flex flex-wrap items-end gap-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Search</label>
                        <div className="relative w-full sm:w-[300px]">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search by code or name..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <Select value={selectedGradeLevel || 'all'} onValueChange={(v) => { setSelectedGradeLevel(v === 'all' ? '' : v); setCurrentPage(1); }}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="Grade Level" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Grade Levels</SelectItem>
                            {GRADE_LEVELS.map((level) => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={selectedType || 'all'} onValueChange={(v) => { setSelectedType(v === 'all' ? '' : v); setCurrentPage(1); }}>
                        <SelectTrigger className="w-36"><SelectValue placeholder="Type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {SUBJECT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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

                <div className={`overflow-hidden ${CARD}`}>
                    <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 z-10 bg-gray-50">
                                <tr>
                                    <th className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('code')}>
                                        Code <SortIcon col="code" sortConfig={sortConfig} />
                                    </th>
                                    <th className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('name')}>
                                        Name <SortIcon col="name" sortConfig={sortConfig} />
                                    </th>
                                    <th className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('type')}>
                                        Type <SortIcon col="type" sortConfig={sortConfig} />
                                    </th>
                                    <th className={`${TABLE_HEADER_CELL_CENTER} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('units')}>
                                        Units <SortIcon col="units" sortConfig={sortConfig} />
                                    </th>
                                    <th className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('grade_level')}>
                                        Grade Level <SortIcon col="grade_level" sortConfig={sortConfig} />
                                    </th>
                                    <th className={TABLE_HEADER_CELL}>Semester</th>
                                    <th className={`${TABLE_HEADER_CELL_CENTER} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('status')}>
                                        Status <SortIcon col="status" sortConfig={sortConfig} />
                                    </th>
                                    <th className={TABLE_HEADER_CELL_CENTER}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center">
                                            <BookOpen className="mx-auto h-10 w-10 text-gray-300" />
                                            <p className={`mt-2 ${BODY_TEXT}`}>
                                                {hasFilters ? 'No subjects match your filters.' : 'No subjects found.'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : paginatedItems.map((subject) => (
                                    <SubjectRow
                                        key={subject.id}
                                        subject={subject}
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
                title="Delete Subject"
                description={`Are you sure you want to delete "${deleteDialog.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                processingLabel="Deleting..."
                processing={processing}
            />
        </AppLayout>
    );
}
