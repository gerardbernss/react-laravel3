import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    BookOpen,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ChevronsLeft,
    ChevronsRight,
    Edit,
    Eye,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface Subject {
    id: number;
    code: string;
    name: string;
    description: string | null;
    units: number;
    type: string;
    grade_level: string | null;
    semester: string | null;
    default_schedule: { display: string; room: string | null } | null;
    is_active: boolean;
    created_at: string;
}

interface Props {
    subjects: Subject[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Subjects', href: '/subjects' },
];

const gradeLevels = [
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
];

const subjectTypes = ['Core', 'Major', 'Minor', 'Elective', 'Specialized'];

type SortKey = 'code' | 'name' | 'type' | 'units' | 'grade_level' | 'status';

export default function Index({ subjects }: Props) {
    const { delete: destroy, processing } = useForm();
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; name: string }>({ open: false, id: 0, name: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGradeLevel, setSelectedGradeLevel] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });

    const filteredItems = useMemo(() => {
        return subjects.filter((s) => {
            const q = searchQuery.toLowerCase();
            const matchesSearch = !q || s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
            const matchesGrade = !selectedGradeLevel || s.grade_level === selectedGradeLevel;
            const matchesType = !selectedType || s.type === selectedType;
            const matchesStatus = !selectedStatus || (selectedStatus === 'active' ? s.is_active : !s.is_active);
            return matchesSearch && matchesGrade && matchesType && matchesStatus;
        });
    }, [subjects, searchQuery, selectedGradeLevel, selectedType, selectedStatus]);

    const sortedItems = useMemo(() => {
        if (!sortConfig.key) return filteredItems;
        return [...filteredItems].sort((a, b) => {
            let aVal = '';
            let bVal = '';
            if (sortConfig.key === 'code') { aVal = a.code; bVal = b.code; }
            else if (sortConfig.key === 'name') { aVal = a.name; bVal = b.name; }
            else if (sortConfig.key === 'type') { aVal = a.type; bVal = b.type; }
            else if (sortConfig.key === 'units') { aVal = String(a.units); bVal = String(b.units); }
            else if (sortConfig.key === 'grade_level') { aVal = a.grade_level ?? ''; bVal = b.grade_level ?? ''; }
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
        setSelectedGradeLevel('');
        setSelectedType('');
        setSelectedStatus('');
        setCurrentPage(1);
    };

    const hasFilters = searchQuery || selectedGradeLevel || selectedType || selectedStatus;

    const confirmDelete = () => {
        destroy(`/subjects/${deleteDialog.id}`, {
            onSuccess: () => setDeleteDialog({ open: false, id: 0, name: '' }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Subjects" />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <BookOpen className="h-7 w-7 text-primary" />
                            <h1 className="text-3xl font-bold text-gray-900">Subjects</h1>
                        </div>
                    </div>
                    <Link href="/subjects/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Subject
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
                                placeholder="Search by code or name..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                        <Select value={selectedGradeLevel || 'all'} onValueChange={(v) => { setSelectedGradeLevel(v === 'all' ? '' : v); setCurrentPage(1); }}>
                            <SelectTrigger className="w-40"><SelectValue placeholder="Grade Level" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Grade Levels</SelectItem>
                                {gradeLevels.map((level) => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={selectedType || 'all'} onValueChange={(v) => { setSelectedType(v === 'all' ? '' : v); setCurrentPage(1); }}>
                            <SelectTrigger className="w-36"><SelectValue placeholder="Type" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                {subjectTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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
                                    <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500" onClick={() => toggleSort('name')}>
                                        Name <SortIcon col="name" />
                                    </th>
                                    <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500" onClick={() => toggleSort('type')}>
                                        Type <SortIcon col="type" />
                                    </th>
                                    <th className="cursor-pointer px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500" onClick={() => toggleSort('units')}>
                                        Units <SortIcon col="units" />
                                    </th>
                                    <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500" onClick={() => toggleSort('grade_level')}>
                                        Grade Level <SortIcon col="grade_level" />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Schedule</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Room</th>
                                    <th className="cursor-pointer px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500" onClick={() => toggleSort('status')}>
                                        Status <SortIcon col="status" />
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-12 text-center">
                                            <BookOpen className="mx-auto h-10 w-10 text-gray-300" />
                                            <p className="mt-2 text-gray-500">
                                                {hasFilters ? 'No subjects match your filters.' : 'No subjects found.'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : paginatedItems.map((subject) => (
                                    <tr key={subject.id} className="border-b border-gray-200 transition-all hover:bg-slate-50">
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
                                        <td className="px-4 py-3 text-gray-600">{subject.default_schedule?.display ?? '—'}</td>
                                        <td className="px-4 py-3 text-gray-600">{subject.default_schedule?.room ?? '—'}</td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge className={subject.is_active ? 'bg-green-100 text-green-800' : ''}>
                                                {subject.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-center gap-1">
                                                <Link href={`/subjects/${subject.id}`}>
                                                    <Button variant="outline" size="sm"><Eye className="h-4 w-4" /></Button>
                                                </Link>
                                                <Link href={`/subjects/${subject.id}/edit`}>
                                                    <Button variant="outline" size="sm"><Edit className="h-4 w-4" /></Button>
                                                </Link>
                                                <Button
                                                    variant="outline" size="sm"
                                                    onClick={() => setDeleteDialog({ open: true, id: subject.id, name: subject.name })}
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
                title="Delete Subject"
                description={`Are you sure you want to delete "${deleteDialog.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                processingLabel="Deleting..."
                processing={processing}
            />
        </AppLayout>
    );
}
