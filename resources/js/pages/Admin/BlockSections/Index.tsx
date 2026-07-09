import { ConfirmDialog } from '@/components/confirm-dialog';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TablePagination } from '@/components/ui/table-pagination';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AppBadge } from '@/components/AppBadge';
import { BODY_TEXT, CARD, LABEL_TEXT, PAGE_PADDING, PAGE_TITLE, TABLE_HEADER_CELL, TABLE_HEADER_CELL_CENTER, TABLE_ROW, TABLE_ROW_ACTION, TABLE_ROW_ACTION_DANGER } from '@/constants/ui';
import { GRADE_LEVELS, useBlockSections, type BlockSection, type BlockSectionSortKey } from '@/hooks/useBlockSections';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ChevronDown, ChevronUp, Copy, Eye, LayoutGrid, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';

interface Props {
    blockSections: BlockSection[];
    schoolYears: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Block Sections', href: '/admin/block-sections' },
];

function SortIcon({ col, sortConfig }: { col: BlockSectionSortKey; sortConfig: { key: BlockSectionSortKey | null; direction: 'asc' | 'desc' } }) {
    if (sortConfig.key !== col) return <ChevronUp className="ml-1 inline h-3 w-3 opacity-30" />;
    return sortConfig.direction === 'asc'
        ? <ChevronUp className="ml-1 inline h-3 w-3" />
        : <ChevronDown className="ml-1 inline h-3 w-3" />;
}

interface BlockSectionRowProps {
    section: BlockSection;
    processing: boolean;
    onDelete: (id: number, name: string) => void;
}

function BlockSectionRow({ section, processing, onDelete }: BlockSectionRowProps) {
    return (
        <tr className={TABLE_ROW}>
            <td className="px-4 py-3">
                <p className="font-medium text-gray-900">{section.name}</p>
                <p className="text-xs text-gray-500">{section.code}</p>
            </td>
            <td className="px-4 py-3 text-gray-600">{section.grade_level}</td>
            <td className="px-4 py-3">
                <p className="text-gray-900">{section.school_year}</p>
                {section.semester && <p className="text-xs text-gray-500">{section.semester}</p>}
            </td>
            <td className="px-4 py-3 text-center">
                <Badge variant="outline">{section.subjects?.length || 0}</Badge>
            </td>
            <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className={section.current_enrollment >= section.capacity ? 'text-red-600' : ''}>
                        {section.current_enrollment}/{section.capacity}
                    </span>
                </div>
            </td>
            <td className="px-4 py-3 text-center">
                <AppBadge status={section.is_active ? 'Active' : 'Inactive'} />
            </td>
            <td className="px-4 py-3">
                <div className="flex justify-center gap-1">
                    <Link href={`/admin/block-sections/${section.id}`}>
                        <button className={TABLE_ROW_ACTION}>
                            <Eye className="h-3 w-3" /> View
                        </button>
                    </Link>
                    <Link href={`/admin/block-sections/${section.id}/edit`}>
                        <button className={TABLE_ROW_ACTION}>
                            <Pencil className="h-3 w-3" /> Edit
                        </button>
                    </Link>
                    <button
                        onClick={() => onDelete(section.id, section.name)}
                        disabled={processing || section.current_enrollment > 0}
                        className={TABLE_ROW_ACTION_DANGER}
                    >
                        <Trash2 className="h-3 w-3" /> Delete
                    </button>
                </div>
            </td>
        </tr>
    );
}

interface CopyDialogProps {
    open: boolean;
    onClose: () => void;
    schoolYears: string[];
    copyForm: ReturnType<typeof useBlockSections>['copyForm'];
    setFromSchoolYear: (year: string) => void;
    onSubmit: (e: React.FormEvent) => void;
}

function CopyDialog({ open, onClose, schoolYears, copyForm, setFromSchoolYear, onSubmit }: CopyDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Copy Sections to New Year</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-gray-500">
                    Clones every section (with its subjects, schedules, and capacity) from one school year into a new one,
                    with enrollment reset to 0. Sections and students already enrolled in the source year are left untouched.
                </p>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="from_school_year" className={LABEL_TEXT}>From School Year *</Label>
                        <Select
                            value={copyForm.data.from_school_year}
                            onValueChange={setFromSchoolYear}
                        >
                            <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select school year" />
                            </SelectTrigger>
                            <SelectContent>
                                {schoolYears.map((year) => (
                                    <SelectItem key={year} value={year}>{year}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={copyForm.errors.from_school_year} className="mt-1" />
                    </div>
                    <div>
                        <Label htmlFor="to_school_year" className={LABEL_TEXT}>To School Year *</Label>
                        <Input
                            id="to_school_year"
                            value={copyForm.data.to_school_year}
                            onChange={(e) => copyForm.setData('to_school_year', e.target.value)}
                            placeholder="e.g., 2026-2027"
                            className="mt-1"
                        />
                        <InputError message={copyForm.errors.to_school_year} className="mt-1" />
                    </div>
                    <div className="flex justify-end gap-2 border-t pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={copyForm.processing}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={copyForm.processing || !copyForm.data.from_school_year || !copyForm.data.to_school_year}
                        >
                            {copyForm.processing ? 'Copying...' : 'Copy Sections'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

/** Admin block sections list — filterable by school year with search, delete, and bulk-copy-to-next-year actions. */
export default function Index({ blockSections, schoolYears }: Props) {
    const {
        processing,
        deleteDialog,
        setDeleteDialog,
        showCopyDialog,
        setShowCopyDialog,
        copyForm,
        searchQuery,
        setSearchQuery,
        selectedGradeLevel,
        setSelectedGradeLevel,
        selectedSchoolYear,
        setSelectedSchoolYear,
        selectedStatus,
        setSelectedStatus,
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        sortConfig,
        hasFilters,
        sortedSections,
        paginatedSections,
        toggleSort,
        clearFilters,
        confirmDelete,
        setFromSchoolYear,
        openCopyDialog,
        handleCopySubmit,
    } = useBlockSections(blockSections, schoolYears);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Block Sections" />

            <div className={PAGE_PADDING}>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className={PAGE_TITLE}>Block Sections</h1>
                    <div className="flex gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" onClick={openCopyDialog}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy Block Sections
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy block sections to recent school year</TooltipContent>
                        </Tooltip>
                        <Link href="/admin/block-sections/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Block Section
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="mb-6 flex flex-wrap items-end gap-3">
                    <div>
                        <label className={`mb-1 block ${LABEL_TEXT}`}>Search</label>
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
                    <Select value={selectedSchoolYear || 'all'} onValueChange={(v) => { setSelectedSchoolYear(v === 'all' ? '' : v); setCurrentPage(1); }}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="School Year" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All School Years</SelectItem>
                            {schoolYears.map((year) => <SelectItem key={year} value={year}>{year}</SelectItem>)}
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
                                    <th className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('name')}>
                                        Section <SortIcon col="name" sortConfig={sortConfig} />
                                    </th>
                                    <th className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('grade_level')}>
                                        Grade Level <SortIcon col="grade_level" sortConfig={sortConfig} />
                                    </th>
                                    <th className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('school_year')}>
                                        School Year <SortIcon col="school_year" sortConfig={sortConfig} />
                                    </th>
                                    <th className={TABLE_HEADER_CELL_CENTER}>Subjects</th>
                                    <th className={TABLE_HEADER_CELL_CENTER}>Enrollment</th>
                                    <th className={`${TABLE_HEADER_CELL_CENTER} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('status')}>
                                        Status <SortIcon col="status" sortConfig={sortConfig} />
                                    </th>
                                    <th className={TABLE_HEADER_CELL_CENTER}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedSections.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center">
                                            <LayoutGrid className="mx-auto h-10 w-10 text-gray-300" />
                                            <p className={`mt-2 ${BODY_TEXT}`}>
                                                {hasFilters ? 'No block sections match your filters.' : 'No block sections found.'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : paginatedSections.map((section) => (
                                    <BlockSectionRow
                                        key={section.id}
                                        section={section}
                                        processing={processing}
                                        onDelete={(id, name) => setDeleteDialog({ open: true, id, name })}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <TablePagination
                        total={sortedSections.length}
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
                title="Delete Block Section"
                description={`Are you sure you want to delete "${deleteDialog.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                processingLabel="Deleting..."
                processing={processing}
            />

            <CopyDialog
                open={showCopyDialog}
                onClose={() => setShowCopyDialog(false)}
                schoolYears={schoolYears}
                copyForm={copyForm}
                setFromSchoolYear={setFromSchoolYear}
                onSubmit={handleCopySubmit}
            />
        </AppLayout>
    );
}
