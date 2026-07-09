import { AppBadge } from '@/components/AppBadge';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TablePagination } from '@/components/ui/table-pagination';
import { BODY_TEXT, CARD, HELPER_TEXT, LABEL_TEXT, PAGE_PADDING, PAGE_TITLE, SECTION_HEADING, TABLE_HEADER_CELL, TABLE_HEADER_CELL_CENTER, TABLE_ROW_ACTION, TABLE_ROW_ACTION_DANGER } from '@/constants/ui';
import { getSchoolYearOptions } from '@/lib/school-year';
import { useFees, type Fee, type FeeFilters } from '@/hooks/useFees';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Copy, DollarSign, Pencil, Plus, Search, Trash2, X } from 'lucide-react';

interface Props {
    fees: Fee[];
    schoolYears: string[];
    categories: Record<string, string>;
    schoolLevels: Record<string, string>;
    semesters: Record<string, string>;
    filters: FeeFilters;
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

interface FeeRowProps {
    fee: Fee;
    categories: Record<string, string>;
    schoolLevels: Record<string, string>;
    processing: boolean;
    onToggle: (id: number) => void;
    onDelete: (id: number, name: string) => void;
}

function FeeRow({ fee, categories, schoolLevels, processing, onToggle, onDelete }: FeeRowProps) {
    return (
        <tr className="hover:bg-gray-50">
            <td className="px-4 py-3 font-mono text-xs font-medium text-gray-700">{fee.code}</td>
            <td className="px-4 py-3 font-medium text-gray-900">{fee.name}</td>
            <td className="px-4 py-3">
                <Badge className={CATEGORY_COLORS[fee.category] ?? ''}>{categories[fee.category]}</Badge>
            </td>
            <td className="px-4 py-3">
                <Badge className={LEVEL_COLORS[fee.school_level] ?? ''}>{schoolLevels[fee.school_level]}</Badge>
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
                <button onClick={() => onToggle(fee.id)} className="cursor-pointer">
                    <AppBadge status={fee.is_active ? 'active' : 'inactive'}>
                        {fee.is_active ? 'Active' : 'Inactive'}
                    </AppBadge>
                </button>
            </td>
            <td className="px-4 py-3">
                <div className="flex justify-center gap-1">
                    <Link href={`/admin/fees/${fee.id}/edit`}>
                        <button className={TABLE_ROW_ACTION} disabled={processing}>
                            <Pencil className="h-3 w-3" /> Edit
                        </button>
                    </Link>
                    <button
                        onClick={() => onDelete(fee.id, fee.name)}
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

interface CopyFeeDialogProps {
    open: boolean;
    onClose: () => void;
    schoolYears: string[];
    copySource: string;
    setCopySource: (v: string) => void;
    copyTarget: string;
    setCopyTarget: (v: string) => void;
    copyPct: string;
    setCopyPct: (v: string) => void;
    copying: boolean;
    onCopy: () => void;
}

function CopyFeeDialog({ open, onClose, schoolYears, copySource, setCopySource, copyTarget, setCopyTarget, copyPct, setCopyPct, copying, onCopy }: CopyFeeDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Copy Fees from School Year</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label className={LABEL_TEXT}>Source School Year</Label>
                        <Select value={copySource} onValueChange={setCopySource}>
                            <SelectTrigger className="mt-1"><SelectValue placeholder="Select year..." /></SelectTrigger>
                            <SelectContent>
                                {schoolYears.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className={LABEL_TEXT}>Target School Year</Label>
                        <Select value={copyTarget} onValueChange={setCopyTarget}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {getSchoolYearOptions().map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className={LABEL_TEXT}>Adjustment (%)</Label>
                        <Input
                            type="number"
                            placeholder="0"
                            value={copyPct}
                            onChange={(e) => setCopyPct(e.target.value)}
                            className="mt-1"
                        />
                        <p className={`mt-1 ${HELPER_TEXT}`}>Positive = increase, negative = decrease. Leave 0 for no change.</p>
                    </div>
                </div>
                <div className="flex justify-end gap-2 border-t pt-4">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={onCopy} disabled={copying || !copySource || !copyTarget}>
                        {copying ? 'Copying...' : 'Copy Fees'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/** Admin fees list — filterable by school year, level, semester, and category with create and delete actions. */
export default function FeesIndex({ fees, schoolYears, categories, schoolLevels, semesters, filters }: Props) {
    const {
        processing,
        deleteDialog,
        setDeleteDialog,
        search,
        setSearch,
        filterCategory,
        setFilterCategory,
        filterLevel,
        setFilterLevel,
        filterYear,
        setFilterYear,
        filterSemester,
        setFilterSemester,
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        copyModal,
        setCopyModal,
        copySource,
        setCopySource,
        copyTarget,
        setCopyTarget,
        copyPct,
        setCopyPct,
        copying,
        hasFilters,
        filtered,
        paginated,
        clearFilters,
        confirmDelete,
        handleToggle,
        handleCopyFromYear,
    } = useFees(fees, filters);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Fee Management" />

            <div className={PAGE_PADDING}>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className={PAGE_TITLE}>Fee Management</h1>
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

                <div className="mb-6">
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
                            <span className={BODY_TEXT}>Active filters:</span>
                            <Button variant="ghost" size="sm" onClick={clearFilters}>
                                <X className="mr-1 h-3 w-3" /> Clear all
                            </Button>
                        </div>
                    )}
                </div>

                {filtered.length > 0 ? (
                    <div className={`overflow-hidden ${CARD}`}>
                        <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 z-10 bg-gray-50">
                                    <tr>
                                        <th className={TABLE_HEADER_CELL}>Code</th>
                                        <th className={TABLE_HEADER_CELL}>Name</th>
                                        <th className={TABLE_HEADER_CELL}>Category</th>
                                        <th className={TABLE_HEADER_CELL}>Level</th>
                                        <th className={TABLE_HEADER_CELL}>School Year</th>
                                        <th className={TABLE_HEADER_CELL}>Semester</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                                        <th className={TABLE_HEADER_CELL_CENTER}>Per Unit</th>
                                        <th className={TABLE_HEADER_CELL_CENTER}>Status</th>
                                        <th className={TABLE_HEADER_CELL_CENTER}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {paginated.map((fee) => (
                                        <FeeRow
                                            key={fee.id}
                                            fee={fee}
                                            categories={categories}
                                            schoolLevels={schoolLevels}
                                            processing={processing}
                                            onToggle={handleToggle}
                                            onDelete={(id, name) => setDeleteDialog({ open: true, id, name })}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <TablePagination
                            total={filtered.length}
                            pageSize={pageSize}
                            currentPage={currentPage}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
                            pageSizeOptions={[10, 15, 25, 50]}
                        />
                    </div>
                ) : (
                    <div className={`${CARD} p-12 text-center`}>
                        <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className={`mt-4 ${SECTION_HEADING}`}>No fees found</h3>
                        <p className={`mt-2 ${BODY_TEXT}`}>
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

            <CopyFeeDialog
                open={copyModal}
                onClose={() => setCopyModal(false)}
                schoolYears={schoolYears}
                copySource={copySource}
                setCopySource={setCopySource}
                copyTarget={copyTarget}
                setCopyTarget={setCopyTarget}
                copyPct={copyPct}
                setCopyPct={setCopyPct}
                copying={copying}
                onCopy={handleCopyFromYear}
            />

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
