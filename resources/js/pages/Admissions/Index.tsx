import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TablePagination } from '@/components/ui/table-pagination';
import { CARD, FILTER_CARD, PAGE_PADDING, PAGE_TITLE, TABLE_HEADER_CELL, TABLE_HEADER_CELL_CENTER } from '@/constants/ui';
import {
    APPLICANT_COLUMNS,
    getStatusBadgeProps,
    handleCalendarChange,
    useAdmissionsIndex,
    type Applicant,
} from '@/hooks/useAdmissionsIndex';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { Briefcase, CalendarIcon, ChevronDown, ChevronUp, Columns, Download, Eye, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { type DropdownNavProps, type DropdownProps } from 'react-day-picker';

interface Props {
    applications: Applicant[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Evaluation/Assessment', href: dashboard().url },
];

interface ApplicantTableRowProps {
    row: Applicant;
    visibleColumns: (keyof Applicant)[];
    selectedRows: number[];
    onSelect: (id: number) => void;
    onDelete: (id: number) => void;
}

function ApplicantTableRow({ row, visibleColumns, selectedRows, onSelect, onDelete }: ApplicantTableRowProps) {
    const { variant, label } = getStatusBadgeProps(row.application_status);
    return (
        <tr
            className={`border-b border-gray-200 transition-all hover:bg-slate-50 ${selectedRows.includes(row.id) ? 'bg-blue-50' : ''}`}
        >
            <td className="px-4 py-3">
                <input
                    type="checkbox"
                    checked={selectedRows.includes(row.id)}
                    onChange={() => onSelect(row.id)}
                    className="h-4 w-4 cursor-pointer rounded border-gray-300"
                />
            </td>
            {visibleColumns.includes('application_number') && (
                <td className="px-4 py-3 font-medium text-gray-900">{row.application_number}</td>
            )}
            {visibleColumns.includes('first_name') && (
                <td className="px-4 py-3 font-medium text-gray-900">{row.first_name}</td>
            )}
            {visibleColumns.includes('last_name') && (
                <td className="px-4 py-3 font-medium text-gray-900">{row.last_name}</td>
            )}
            {visibleColumns.includes('email') && (
                <td className="px-4 py-3 text-gray-600">{row.email}</td>
            )}
            {visibleColumns.includes('gender') && (
                <td className="px-4 py-3 text-gray-900">{row.gender}</td>
            )}
            {visibleColumns.includes('strand') && (
                <td className="px-4 py-3 text-gray-900">{row.strand}</td>
            )}
            {visibleColumns.includes('application_date') && (
                <td className="px-4 py-3 text-gray-900">
                    {row.application_date
                        ? new Date(row.application_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: '2-digit',
                          })
                        : ''}
                </td>
            )}
            {visibleColumns.includes('application_status') && (
                <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant={variant}>{label}</Badge>
                        {row.application_status === 'Exam Passed' && (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                Ready to Enroll
                            </span>
                        )}
                    </div>
                </td>
            )}
            <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                    <Link href={`/admissions/applicants/${row.id}/show`}>
                        <Button variant="outline" size="sm" title="View">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Link href={`/admissions/applicants/${row.id}/edit`}>
                        <Button variant="outline" size="sm" title="Edit">
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(row.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </td>
        </tr>
    );
}

export default function Index({ applications }: Props) {
    const {
        searchQuery, setSearchQuery,
        selectedGender, setSelectedGender,
        selectedStatus, setSelectedStatus,
        selectedStrand, setSelectedStrand,
        dateRange, setDateRange,
        deleteDialogOpen,
        showBulkDeleteDialog, setShowBulkDeleteDialog,
        sortConfig,
        currentPage, setCurrentPage,
        pageSize, setPageSize,
        selectedRows,
        visibleColumns,
        sortedApplicants,
        paginatedApplicants,
        handleSort,
        handleSelectAll,
        handleSelectRow,
        handleDeleteClick,
        handleDeleteConfirm,
        handleDeleteCancel,
        handleBulkDelete,
        confirmBulkDelete,
        toggleColumnVisibility,
        clearFilters,
        handleExport,
    } = useAdmissionsIndex(applications);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Evaluation/Assessment" />

            <div className={PAGE_PADDING}>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Briefcase className="h-7 w-7 text-primary" />
                        <h1 className={PAGE_TITLE}>Evaluation/Assessment</h1>
                    </div>
                    <Link href="/admissions/applicants/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add New Applicant
                        </Button>
                    </Link>
                </div>

                <div className={`mb-6 ${FILTER_CARD}`}>
                    <div className="mb-3">
                        <label className="mb-1 block text-xs font-medium text-gray-600">Search</label>
                        <div className="relative w-full md:w-[400px]">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search by ID, Name, Email, or Applicant No."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="flex flex-col">
                                <label className="mb-1 text-xs font-medium text-gray-600">Gender</label>
                                <Select value={selectedGender} onValueChange={(v) => { setSelectedGender(v); setCurrentPage(1); }}>
                                    <SelectTrigger className="h-10 w-[150px]">
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
                                    <SelectTrigger className="h-10 w-[150px]">
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
                                            className="h-10 w-[350px] justify-start text-left text-sm font-normal"
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dateRange?.from ? (
                                                dateRange.to ? (
                                                    <>{format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}</>
                                                ) : (
                                                    format(dateRange.from, 'LLL dd, y')
                                                )
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
                                                                <SelectItem
                                                                    key={option.value}
                                                                    value={String(option.value)}
                                                                    disabled={option.disabled}
                                                                >
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
                                    <SelectTrigger className="h-10 w-[300px]">
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

                            <Button variant="ghost" onClick={clearFilters} className="h-10">
                                Clear
                            </Button>
                        </div>

                        <div className="mt-3 flex items-end gap-2 md:mt-0">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="h-10">
                                        <Columns className="mr-2 h-4 w-4" />
                                        Columns
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-56" align="end">
                                    <div className="space-y-2">
                                        <h4 className="mb-2 text-sm font-semibold">Toggle Columns</h4>
                                        {APPLICANT_COLUMNS.map((column) => (
                                            <div key={String(column.key)} className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={String(column.key)}
                                                    checked={visibleColumns.includes(column.key)}
                                                    onChange={() => toggleColumnVisibility(column.key)}
                                                    className="h-4 w-4 rounded border-gray-300"
                                                />
                                                <label htmlFor={String(column.key)} className="text-sm">
                                                    {column.label}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <Button variant="outline" className="h-10" onClick={handleExport}>
                                <Download className="mr-2 h-4 w-4" />
                                Export
                            </Button>
                        </div>
                    </div>
                </div>

                {selectedRows.length > 0 && (
                    <div className="mb-4 flex items-center gap-3 rounded-lg bg-blue-50 p-3">
                        <span className="text-sm font-medium text-gray-700">{selectedRows.length} row(s) selected</span>
                        <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                            Delete Selected
                        </Button>
                    </div>
                )}

                <div className={`overflow-hidden ${CARD}`}>
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
                                    {APPLICANT_COLUMNS.filter((col) => visibleColumns.includes(col.key)).map((column) => (
                                        <th
                                            key={String(column.key)}
                                            onClick={() => handleSort(column.key)}
                                            className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                {column.label}
                                                {sortConfig.key === column.key &&
                                                    (sortConfig.direction === 'asc'
                                                        ? <ChevronUp className="h-3.5 w-3.5" />
                                                        : <ChevronDown className="h-3.5 w-3.5" />)}
                                            </div>
                                        </th>
                                    ))}
                                    <th className={TABLE_HEADER_CELL_CENTER}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedApplicants.length === 0 ? (
                                    <tr>
                                        <td colSpan={visibleColumns.length + 2} className="py-16 text-center">
                                            <Users className="mx-auto h-12 w-12 text-gray-300" />
                                            <p className="mt-3 text-sm text-gray-400">No applicants found.</p>
                                        </td>
                                    </tr>
                                ) : paginatedApplicants.map((row) => (
                                    <ApplicantTableRow
                                        key={row.id}
                                        row={row}
                                        visibleColumns={visibleColumns}
                                        selectedRows={selectedRows}
                                        onSelect={handleSelectRow}
                                        onDelete={handleDeleteClick}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <TablePagination
                        total={sortedApplicants.length}
                        pageSize={pageSize}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
                    />
                </div>
            </div>

            <ConfirmDialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                title="Delete Applicant"
                description="Are you sure you want to delete this applicant? This action cannot be undone."
                confirmLabel="Delete"
                processingLabel="Deleting..."
            />
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
