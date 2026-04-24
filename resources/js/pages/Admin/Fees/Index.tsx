import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    Copy, DollarSign, Edit, Plus, Search, Trash2, X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface Fee {
    id: number;
    name: string;
    code: string;
    category: string;
    is_per_unit: boolean;
    is_required: boolean;
    school_level: string;
    school_year: string;
    semester: string;
    amount: number;
    is_active: boolean;
}

interface Props {
    fees: Fee[];
    schoolYears: string[];
    categories: Record<string, string>;
    schoolLevels: Record<string, string>;
    semesters: Record<string, string>;
    filters: {
        school_year?: string;
        semester?: string;
        school_level?: string;
        category?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Fee Management', href: '/admin/fees' },
];

const CATEGORY_COLORS: Record<string, string> = {
    tuition: 'bg-blue-100 text-blue-800',
    miscellaneous: 'bg-purple-100 text-purple-800',
    laboratory: 'bg-orange-100 text-orange-800',
    special: 'bg-pink-100 text-pink-800',
};

const LEVEL_COLORS: Record<string, string> = {
    all: 'bg-gray-100 text-gray-700',
    LES: 'bg-green-100 text-green-800',
    JHS: 'bg-teal-100 text-teal-800',
    SHS: 'bg-indigo-100 text-indigo-800',
};

export default function FeesIndex({ fees, schoolYears, categories, schoolLevels, semesters, filters }: Props) {
    const { delete: destroy, processing } = useForm();

    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState(filters.category ?? 'all');
    const [filterLevel, setFilterLevel] = useState(filters.school_level ?? 'all');
    const [filterYear, setFilterYear] = useState(filters.school_year ?? 'all');
    const [filterSemester, setFilterSemester] = useState(filters.semester ?? 'all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);

    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; name: string }>({ open: false, id: 0, name: '' });
    const [copyModal, setCopyModal] = useState(false);
    const [copySource, setCopySource] = useState('');
    const [copyTarget, setCopyTarget] = useState('');
    const [copyPct, setCopyPct] = useState('0');
    const [copying, setCopying] = useState(false);

    const filtered = useMemo(() => {
        return fees.filter((f) => {
            if (search && !f.name.toLowerCase().includes(search.toLowerCase()) && !f.code.toLowerCase().includes(search.toLowerCase())) return false;
            if (filterCategory !== 'all' && f.category !== filterCategory) return false;
            if (filterLevel !== 'all' && f.school_level !== filterLevel) return false;
            if (filterYear !== 'all' && f.school_year !== filterYear) return false;
            if (filterSemester !== 'all' && f.semester !== filterSemester) return false;
            if (filterStatus === 'active' && !f.is_active) return false;
            if (filterStatus === 'inactive' && f.is_active) return false;
            return true;
        });
    }, [fees, search, filterCategory, filterLevel, filterYear, filterSemester, filterStatus]);

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paginated = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, currentPage, pageSize]);

    const hasFilters = search || filterCategory !== 'all' || filterLevel !== 'all' || filterYear !== 'all' || filterSemester !== 'all' || filterStatus !== 'all';

    const clearFilters = () => {
        setSearch(''); setFilterCategory('all'); setFilterLevel('all');
        setFilterYear('all'); setFilterSemester('all'); setFilterStatus('all');
        setCurrentPage(1);
    };

    const confirmDelete = () => {
        destroy(`/admin/fees/${deleteDialog.id}`, {
            onSuccess: () => setDeleteDialog({ open: false, id: 0, name: '' }),
        });
    };

    const handleToggle = (id: number) => {
        router.post(`/admin/fees/${id}/toggle-status`, {}, { preserveScroll: true });
    };

    const handleCopyFromYear = () => {
        if (!copySource || !copyTarget) return;
        setCopying(true);
        router.post('/admin/fees/copy-from-year', {
            source_year: copySource,
            target_year: copyTarget,
            adjust_percentage: parseFloat(copyPct) || 0,
        }, {
            onFinish: () => { setCopying(false); setCopyModal(false); },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Fee Management" />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <DollarSign className="h-7 w-7 text-primary" />
                        <h1 className="text-3xl font-bold text-gray-900">Fee Management</h1>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setCopyModal(true)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy from Year
                        </Button>
                        <Link href="/admin/fees/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Fee
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
                    <div className="grid gap-3 md:grid-cols-6">
                        <div className="relative md:col-span-2">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search name or code..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                                className="pl-10"
                            />
                        </div>
                        <Select value={filterYear} onValueChange={(v) => { setFilterYear(v); setCurrentPage(1); }}>
                            <SelectTrigger><SelectValue placeholder="School Year" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Years</SelectItem>
                                {schoolYears.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filterSemester} onValueChange={(v) => { setFilterSemester(v); setCurrentPage(1); }}>
                            <SelectTrigger><SelectValue placeholder="Semester" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Semesters</SelectItem>
                                {Object.entries(semesters).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filterLevel} onValueChange={(v) => { setFilterLevel(v); setCurrentPage(1); }}>
                            <SelectTrigger><SelectValue placeholder="School Level" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Levels</SelectItem>
                                {Object.entries(schoolLevels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setCurrentPage(1); }}>
                            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {Object.entries(categories).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    {hasFilters && (
                        <div className="mt-3 flex items-center gap-2">
                            <span className="text-sm text-gray-500">Active filters:</span>
                            <Button variant="ghost" size="sm" onClick={clearFilters}>
                                <X className="mr-1 h-3 w-3" /> Clear all
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
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Code</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Category</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Level</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">School Year</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Semester</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Per Unit</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {paginated.map((fee) => (
                                        <tr key={fee.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-mono text-xs font-medium text-gray-700">{fee.code}</td>
                                            <td className="px-4 py-3 font-medium text-gray-900">{fee.name}</td>
                                            <td className="px-4 py-3">
                                                <Badge className={CATEGORY_COLORS[fee.category] ?? ''}>
                                                    {categories[fee.category]}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge className={LEVEL_COLORS[fee.school_level] ?? ''}>
                                                    {schoolLevels[fee.school_level]}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">{fee.school_year}</td>
                                            <td className="px-4 py-3 text-gray-700">{fee.semester}</td>
                                            <td className="px-4 py-3 text-right font-medium text-gray-900">
                                                ₱{Number(fee.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                {fee.is_per_unit && <span className="ml-1 text-xs text-gray-400">/unit</span>}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {fee.is_per_unit
                                                    ? <Badge className="bg-green-100 text-green-800">Yes</Badge>
                                                    : <Badge variant="outline">No</Badge>}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleToggle(fee.id)}
                                                    className="cursor-pointer"
                                                >
                                                    <Badge className={fee.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                                                        {fee.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center gap-1">
                                                    <Link href={`/admin/fees/${fee.id}/edit`}>
                                                        <Button variant="outline" size="sm">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setDeleteDialog({ open: true, id: fee.id, name: fee.name })}
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
                                    className="rounded-md border border-gray-300 px-3 py-1 text-sm"
                                >
                                    {[10, 15, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                                </select>
                                <span className="text-sm text-gray-600">
                                    {filtered.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft className="h-4 w-4" /></Button>
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                                <span className="px-3 py-1 text-sm">Page {currentPage} of {totalPages || 1}</span>
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}><ChevronRight className="h-4 w-4" /></Button>
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages}><ChevronsRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
                        <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">No fees found</h3>
                        <p className="mt-2 text-gray-600">
                            {hasFilters ? 'No fees match your filters.' : 'Get started by adding your first fee.'}
                        </p>
                        {!hasFilters && (
                            <Link href="/admin/fees/create">
                                <Button className="mt-4"><Plus className="mr-2 h-4 w-4" />Add Fee</Button>
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {/* Copy from Year Modal */}
            {copyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                        <h2 className="mb-4 text-lg font-semibold">Copy Fees from School Year</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium">Source School Year</label>
                                <select
                                    value={copySource}
                                    onChange={(e) => setCopySource(e.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                >
                                    <option value="">Select year...</option>
                                    {schoolYears.map((y) => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Target School Year</label>
                                <Input
                                    placeholder="e.g. 2025-2026"
                                    value={copyTarget}
                                    onChange={(e) => setCopyTarget(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Adjustment (%)</label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={copyPct}
                                    onChange={(e) => setCopyPct(e.target.value)}
                                />
                                <p className="mt-1 text-xs text-gray-500">Positive = increase, negative = decrease. Leave 0 for no change.</p>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setCopyModal(false)}>Cancel</Button>
                            <Button onClick={handleCopyFromYear} disabled={copying || !copySource || !copyTarget}>
                                {copying ? 'Copying...' : 'Copy Fees'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, id: 0, name: '' })}
                onConfirm={confirmDelete}
                title="Delete Fee"
                description={`Are you sure you want to delete "${deleteDialog.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                processingLabel="Deleting..."
                processing={processing}
            />
        </AppLayout>
    );
}
