import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TablePagination } from '@/components/ui/table-pagination';
import { FILTER_CARD, PAGE_PADDING, TABLE_HEADER_CELL } from '@/constants/ui';
import { getStatusBadgeProps, handleCalendarChange } from '@/hooks/useAdmissionsIndex';
import { EVALUATION_COLUMNS, useEvaluation, type Applicant, type ApplicantColumnKey } from '@/hooks/useEvaluation';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { CalendarIcon, ChevronDown, ChevronUp, Search } from 'lucide-react';
import type { DropdownNavProps, DropdownProps } from 'react-day-picker';
import { HiEye, HiPlus, HiTrash } from 'react-icons/hi';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Evaluation/Assessment', href: dashboard().url },
];

function SortIcon({ col, sortConfig }: {
    col: ApplicantColumnKey;
    sortConfig: { key: ApplicantColumnKey | null; direction: 'asc' | 'desc' };
}) {
    if (sortConfig.key !== col) return null;
    return sortConfig.direction === 'asc'
        ? <ChevronUp className="h-3.5 w-3.5" />
        : <ChevronDown className="h-3.5 w-3.5" />;
}

interface ApplicantRowProps {
    row: Applicant;
    visibleColumns: ApplicantColumnKey[];
    selectedRows: number[];
    onSelectRow: (id: number) => void;
    onDeleteClick: (id: number) => void;
}

function ApplicantRow({ row, visibleColumns, selectedRows, onSelectRow, onDeleteClick }: ApplicantRowProps) {
    const { variant, label } = getStatusBadgeProps(row.application_status);
    return (
        <tr className={`border-b border-gray-200 transition-all hover:bg-slate-50 ${selectedRows.includes(row.id) ? 'bg-blue-50' : ''}`}>
            <td className="px-4 py-3">
                <input
                    type="checkbox"
                    checked={selectedRows.includes(row.id)}
                    onChange={() => onSelectRow(row.id)}
                    className="h-4 w-4 cursor-pointer rounded border-gray-300"
                />
            </td>
            {visibleColumns.includes('id') && <td className="px-4 py-3 font-medium text-gray-900">{row.id}</td>}
            {visibleColumns.includes('first_name') && <td className="px-4 py-3 font-medium text-gray-900">{row.first_name}</td>}
            {visibleColumns.includes('last_name') && <td className="px-4 py-3 font-medium text-gray-900">{row.last_name}</td>}
            {visibleColumns.includes('email') && <td className="px-4 py-3 text-gray-600">{row.email}</td>}
            {visibleColumns.includes('gender') && <td className="px-4 py-3 text-gray-900">{row.gender}</td>}
            {visibleColumns.includes('strand') && <td className="px-4 py-3 text-gray-900">{row.strand}</td>}
            {visibleColumns.includes('application_date') && (
                <td className="px-4 py-3 text-gray-900">
                    {row.application_date
                        ? new Date(row.application_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })
                        : ''}
                </td>
            )}
            {visibleColumns.includes('application_status') && (
                <td className="px-4 py-3">
                    <Badge variant={variant}>{label}</Badge>
                </td>
            )}
            <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                    <Link
                        href={`/admin/applicants/${row.id}/show`}
                        className="rounded-lg p-1.5 text-blue-600 transition-colors hover:bg-blue-50"
                        title="View"
                    >
                        <HiEye size={16} />
                    </Link>
                    <button
                        onClick={() => onDeleteClick(row.id)}
                        className="cursor-pointer rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-50"
                        title="Delete"
                    >
                        <HiTrash size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
}

interface Props {
    applications: Applicant[];
}

/** Admissions evaluation and assessment list for staff — sortable, filterable table of college applicants with bulk delete and export. */
export default function Index({ applications }: Props) {
    const {
        searchQuery, setSearchQuery,
        selectedGender, setSelectedGender,
        selectedStatus, setSelectedStatus,
        selectedStrand, setSelectedStrand,
        deleteDialogOpen, setDeleteDialogOpen,
        dateRange, setDateRange,
        sortConfig,
        currentPage, setCurrentPage,
        pageSize, setPageSize,
        selectedRows,
        visibleColumns,
        showBulkDeleteDialog, setShowBulkDeleteDialog,
        sortedApplicants,
        paginatedApplicants,
        handleDeleteClick,
        handleDeleteConfirm,
        handleDeleteCancel,
        handleSort,
        handleSelectAll,
        handleSelectRow,
        handleBulkDelete,
        confirmBulkDelete,
        toggleColumnVisibility,
        handleExport,
        clearFilters,
    } = useEvaluation(applications);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Evaluation/Assessment" />

            <div className={PAGE_PADDING}>
                <h1 className="mb-6 text-3xl font-bold text-gray-900">Evaluation/Assessment</h1>

                <div className={`mb-4 ${FILTER_CARD}`}>
                    <div className="mb-3 grid w-full grid-cols-1 items-start gap-3 md:grid-cols-[1fr_auto]">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">Search</label>
                            <div className="relative w-full md:w-[400px]">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Search by ID, Name, Email, or Applicant No."
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col items-start md:items-end">
                            <div className="hidden h-4 md:block" />
                            <Link
                                href="/admin/applicants/create"
                                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-md transition-all hover:bg-primary/90 hover:shadow-lg"
                            >
                                <HiPlus size={18} />
                                Add New Applicant
                            </Link>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-end gap-3 md:justify-between">
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="flex flex-col">
                                <label className="mb-1 text-xs font-medium text-gray-600">Gender</label>
                                <Select value={selectedGender} onValueChange={(v) => { setSelectedGender(v); setCurrentPage(1); }}>
                                    <SelectTrigger className={`h-10 w-[150px] bg-white shadow-sm ${selectedGender !== 'all' ? 'border-2 border-gray-400 font-bold text-gray-900' : 'border border-gray-300 text-gray-700'}`}>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col">
                                <label className="mb-1 text-xs font-medium text-gray-600">Application Status</label>
                                <Select value={selectedStatus} onValueChange={(v) => { setSelectedStatus(v); setCurrentPage(1); }}>
                                    <SelectTrigger className="h-10 w-[150px] border border-gray-300 bg-white shadow-sm">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="active">Enrolled</SelectItem>
                                            <SelectItem value="inactive">Exam Taken</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col">
                                <label className="mb-1 text-xs font-medium text-gray-600">Application Date</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={`h-10 w-[350px] justify-start text-left text-sm font-normal bg-white shadow-sm hover:bg-gray-50 ${dateRange ? 'border-2 border-gray-400 font-bold text-gray-900' : 'border border-gray-300 text-gray-700'}`}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dateRange?.from ? (
                                                dateRange.to
                                                    ? <>{format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}</>
                                                    : format(dateRange.from, 'LLL dd, y')
                                            ) : (
                                                <span>Pick a date range</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={dateRange?.from}
                                            selected={dateRange}
                                            onSelect={(range) => { setDateRange(range); setCurrentPage(1); }}
                                            numberOfMonths={2}
                                            captionLayout="dropdown"
                                            startMonth={new Date(1980, 0)}
                                            endMonth={new Date()}
                                            hideNavigation
                                            classNames={{ month_caption: 'mx-0' }}
                                            components={{
                                                DropdownNav: (props: DropdownNavProps) => (
                                                    <div className="flex w-full items-center gap-2">{props.children}</div>
                                                ),
                                                Dropdown: (props: DropdownProps) => (
                                                    <Select
                                                        value={String(props.value)}
                                                        onValueChange={(value) => {
                                                            if (props.onChange) handleCalendarChange(value, props.onChange);
                                                        }}
                                                    >
                                                        <SelectTrigger className="h-8 w-fit font-medium first:grow">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="max-h-[min(26rem,var(--radix-select-content-available-height))]">
                                                            {props.options?.map((option) => (
                                                                <SelectItem key={option.value} value={String(option.value)} disabled={option.disabled}>
                                                                    {option.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ),
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="flex flex-col">
                                <label className="mb-1 text-xs font-medium text-gray-600">Program/Strand</label>
                                <Select value={selectedStrand} onValueChange={(v) => { setSelectedStrand(v); setCurrentPage(1); }}>
                                    <SelectTrigger className={`h-10 w-[450px] bg-white shadow-sm ${selectedStrand !== 'all' ? 'border-2 border-gray-400 font-bold text-gray-900' : 'border border-gray-300 text-gray-700'}`}>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="Laboratory Elementary School">Laboratory Elementary</SelectItem>
                                        <SelectItem value="Junior High School">Junior High School</SelectItem>
                                        <SelectItem value="Accountancy and Business Management">Accountancy and Business Management</SelectItem>
                                        <SelectItem value="Humanities and Social Sciences">Humanities and Social Sciences</SelectItem>
                                        <SelectItem value="Science, Technology, Engineering, and Mathematics">
                                            Science, Technology, Engineering, and Mathematics
                                        </SelectItem>
                                        <SelectItem value="General Academics">General Academics</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button variant="ghost" onClick={clearFilters} className="h-10 text-sm text-gray-700 hover:underline active:bg-gray-300">
                                Clear
                            </Button>
                        </div>

                        <div className="mt-3 flex items-end gap-2 md:mt-0">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="h-10 border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                                        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                        </svg>
                                        Columns
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-56" align="end">
                                    <div className="space-y-2">
                                        <h4 className="mb-2 text-sm font-semibold">Toggle Columns</h4>
                                        {EVALUATION_COLUMNS.map((column) => (
                                            <div key={String(column.key)} className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={`col-${String(column.key)}`}
                                                    checked={visibleColumns.includes(column.key)}
                                                    onChange={() => toggleColumnVisibility(column.key)}
                                                    className="h-4 w-4 rounded border-gray-300"
                                                />
                                                <label htmlFor={`col-${String(column.key)}`} className="text-sm">{column.label}</label>
                                            </div>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <Button
                                variant="outline"
                                className="h-10 border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                                onClick={handleExport}
                            >
                                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Export
                            </Button>
                        </div>
                    </div>
                </div>

                {selectedRows.length > 0 && (
                    <div className="mb-4 flex items-center gap-3 rounded-lg bg-blue-50 p-3">
                        <span className="text-sm font-medium text-gray-700">{selectedRows.length} row(s) selected</span>
                        <button
                            onClick={handleBulkDelete}
                            className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive/90"
                        >
                            Delete Selected
                        </button>
                    </div>
                )}

                <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                    <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 z-10 bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={paginatedApplicants.length > 0 && selectedRows.length === paginatedApplicants.length}
                                            onChange={handleSelectAll}
                                            className="h-4 w-4 cursor-pointer rounded border-gray-300"
                                        />
                                    </th>
                                    {EVALUATION_COLUMNS.filter((col) => visibleColumns.includes(col.key)).map((column) => (
                                        <th
                                            key={String(column.key)}
                                            onClick={() => handleSort(column.key)}
                                            className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                {column.label}
                                                <SortIcon col={column.key} sortConfig={sortConfig} />
                                            </div>
                                        </th>
                                    ))}
                                    <th className={TABLE_HEADER_CELL}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedApplicants.map((row) => (
                                    <ApplicantRow
                                        key={row.id}
                                        row={row}
                                        visibleColumns={visibleColumns}
                                        selectedRows={selectedRows}
                                        onSelectRow={handleSelectRow}
                                        onDeleteClick={handleDeleteClick}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <TablePagination
                    total={sortedApplicants.length}
                    pageSize={pageSize}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
                />
            </div>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Applicant</DialogTitle>
                        <DialogDescription>Are you sure you want to delete this applicant? This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button className="mr-2" type="button" variant="outline" onClick={handleDeleteCancel}>Cancel</Button>
                        <Button type="button" variant="destructive" onClick={handleDeleteConfirm}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={showBulkDeleteDialog}
                onClose={() => setShowBulkDeleteDialog(false)}
                onConfirm={confirmBulkDelete}
                title="Delete Selected Applicants"
                description={`Are you sure you want to delete ${selectedRows.length} selected applicant(s)? This action cannot be undone.`}
                confirmLabel="Delete All"
                processingLabel="Deleting..."
            />
        </AppLayout>
    );
}
