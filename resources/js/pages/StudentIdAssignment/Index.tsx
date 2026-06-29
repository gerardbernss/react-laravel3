import EmailAssignIdButton from '@/components/email-assign-id-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TablePagination } from '@/components/ui/table-pagination';
import { FILTER_CARD, PAGE_PADDING, TABLE_HEADER_CELL } from '@/constants/ui';
import { getStatusBadgeProps, handleCalendarChange } from '@/hooks/useAdmissionsIndex';
import { STUDENT_ID_COLUMNS, useStudentIdAssignment, type Applicant, type ColumnKey } from '@/hooks/useStudentIdAssignment';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { format } from 'date-fns';
import { CalendarIcon, ChevronDown, ChevronUp, IdCard, Search, UserPlus } from 'lucide-react';
import { type DropdownNavProps, type DropdownProps } from 'react-day-picker';

interface Props {
    applications: Applicant[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Student ID Number Assignment', href: dashboard().url },
];

interface ApplicantRowProps {
    row: Applicant;
    visibleColumns: ColumnKey[];
    selectedRowId: number | null;
    onAssignId: (id: number) => void;
}

function ApplicantRow({ row, visibleColumns, selectedRowId, onAssignId }: ApplicantRowProps) {
    const { variant, label } = getStatusBadgeProps(row.application_status);
    return (
        <tr className={`border-b border-gray-200 transition-all hover:bg-slate-50 ${selectedRowId === row.id ? 'bg-blue-50' : ''}`}>
            {visibleColumns.includes('student_id_number') && (
                <td className={`px-4 py-3 font-medium ${row.student_id_number ? 'text-gray-900' : 'text-red-600'}`}>
                    {row.student_id_number || 'Not Assigned'}
                </td>
            )}
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
                              year: 'numeric', month: 'short', day: '2-digit',
                          })
                        : ''}
                </td>
            )}
            {visibleColumns.includes('application_status') && (
                <td className="px-4 py-3">
                    <Badge variant={variant}>{label}</Badge>
                </td>
            )}
            {visibleColumns.includes('actions') && (
                <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onAssignId(row.id)}
                            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted"
                        >
                            <UserPlus className="h-3 w-3" /> Assign ID
                        </button>
                        <div className="group relative inline-block">
                            <div className={!row.student_id_number ? 'pointer-events-none opacity-50' : ''}>
                                <EmailAssignIdButton applicationId={row.id} />
                            </div>
                            {!row.student_id_number && (
                                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded bg-gray-800 px-3 py-1.5 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:block group-hover:opacity-100">
                                    Assign ID number first
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                                </div>
                            )}
                        </div>
                    </div>
                </td>
            )}
        </tr>
    );
}

export default function Index({ applications }: Props) {
    const {
        searchQuery, setSearchQuery,
        selectedGender, setSelectedGender,
        selectedStrand, setSelectedStrand,
        dateRange, setDateRange,
        sortConfig,
        currentPage, setCurrentPage,
        pageSize, setPageSize,
        selectedRowId, setSelectedRowId,
        confirmDialogOpen, setConfirmDialogOpen,
        assignIdValue, setAssignIdValue,
        visibleColumns,
        sortedApplicants,
        paginatedApplicants,
        selectedApplicant,
        handleSort,
        handleSelectRow,
        executeAssignment,
        handleAssignStudentId,
        handleBulkGenerate,
        clearFilters,
    } = useStudentIdAssignment(applications);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Student ID Number Assignment" />

            <div className={PAGE_PADDING}>
                <div className="mb-6 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <IdCard className="h-7 w-7 text-primary" />
                        <h1 className="text-3xl font-bold text-gray-900">Student ID Number Assignment</h1>
                    </div>
                    <Button variant="outline" className="gap-2" onClick={handleBulkGenerate}>
                        <IdCard className="h-4 w-4" />
                        Generate All IDs
                    </Button>
                </div>

                <div className={`mb-6 ${FILTER_CARD}`}>
                    <div className="mb-3">
                        <label className="mb-1 block text-xs font-medium text-gray-600">Search</label>
                        <div className="relative w-full md:w-[400px]">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search by Name, Email, or Application No."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="flex flex-col">
                            <label className="mb-1 text-xs font-medium text-gray-600">Gender</label>
                            <Select value={selectedGender} onValueChange={(v) => { setSelectedGender(v); setCurrentPage(1); }}>
                                <SelectTrigger className="h-10 w-[150px]"><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col">
                            <label className="mb-1 text-xs font-medium text-gray-600">Application Date</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="h-10 w-[300px] justify-start text-left text-sm font-normal">
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
                                <SelectTrigger className="h-10 w-[250px]"><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="Laboratory Elementary School">Laboratory Elementary</SelectItem>
                                    <SelectItem value="Junior High School">Junior High School</SelectItem>
                                    <SelectItem value="Accountancy and Business Management">ABM</SelectItem>
                                    <SelectItem value="Humanities and Social Sciences">HUMSS</SelectItem>
                                    <SelectItem value="Science, Technology, Engineering, and Mathematics">STEM</SelectItem>
                                    <SelectItem value="General Academics">General Academics</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button variant="ghost" className="h-10" onClick={clearFilters}>Clear</Button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                    <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 z-10 bg-gray-50">
                                <tr>
                                    {STUDENT_ID_COLUMNS.filter((col) => visibleColumns.includes(col.key)).map((column) => (
                                        <th
                                            key={String(column.key)}
                                            onClick={() => column.key !== 'actions' && handleSort(column.key as keyof Applicant)}
                                            className={`${TABLE_HEADER_CELL} ${column.key !== 'actions' ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                {column.label}
                                                {column.key !== 'actions' && sortConfig.key === column.key && (
                                                    sortConfig.direction === 'asc'
                                                        ? <ChevronUp className="h-3.5 w-3.5" />
                                                        : <ChevronDown className="h-3.5 w-3.5" />
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedApplicants.length === 0 ? (
                                    <tr>
                                        <td colSpan={visibleColumns.length} className="py-16 text-center">
                                            <IdCard className="mx-auto h-10 w-10 text-gray-300" />
                                            <p className="mt-3 text-sm text-gray-400">No records yet.</p>
                                        </td>
                                    </tr>
                                ) : paginatedApplicants.map((row) => (
                                    <ApplicantRow
                                        key={row.id}
                                        row={row}
                                        visibleColumns={visibleColumns}
                                        selectedRowId={selectedRowId}
                                        onAssignId={handleSelectRow}
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

            <Dialog open={!!selectedApplicant} onOpenChange={(open) => { if (!open) setSelectedRowId(null); }}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-gray-800">
                            <UserPlus className="h-6 w-6 text-gray-700" />
                            Assign Student Number
                        </DialogTitle>
                    </DialogHeader>

                    {selectedApplicant && (
                        <form onSubmit={handleAssignStudentId} className="space-y-6">
                            <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-6">
                                <h3 className="mb-4 text-sm font-medium text-gray-500">Selected Applicant</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="mb-1 text-xs text-gray-500">Application #:</p>
                                        <p className="font-medium text-gray-900">{selectedApplicant.application_number}</p>
                                    </div>
                                    <div>
                                        <p className="mb-1 text-xs text-gray-500">Application Date:</p>
                                        <p className="font-medium text-gray-900">
                                            {selectedApplicant.application_date
                                                ? format(new Date(selectedApplicant.application_date), 'MMM dd, yyyy')
                                                : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="mb-1 text-xs text-gray-500">Name:</p>
                                        <p className="text-md font-bold text-gray-900">
                                            {selectedApplicant.first_name} {selectedApplicant.last_name}
                                        </p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="mb-1 text-xs text-gray-500">Email:</p>
                                        <p className="font-medium text-gray-900">{selectedApplicant.email}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="studentIdInput" className="mb-1 block font-semibold text-gray-700">
                                    Student Number
                                </label>
                                <div className="flex flex-col gap-3">
                                    <Input
                                        id="studentIdInput"
                                        value={assignIdValue}
                                        onChange={(e) => setAssignIdValue(e.target.value)}
                                        placeholder="Enter Student ID"
                                    />
                                    <p className="text-xs text-gray-500">Auto-generated. You can modify if needed.</p>
                                    <div className="mt-2 flex w-full gap-3">
                                        <Button type="button" variant="outline" className="flex-1" onClick={() => setSelectedRowId(null)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" className="flex flex-1 items-center justify-center gap-2 bg-[#073066] hover:bg-[#05509e]">
                                            Assign Student Number
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Overwrite Existing ID?</DialogTitle>
                        <DialogDescription className="pt-2">
                            The student{' '}
                            <span className="font-medium text-gray-900">
                                {selectedApplicant?.first_name} {selectedApplicant?.last_name}
                            </span>{' '}
                            already has the ID <span className="font-medium text-gray-900">{selectedApplicant?.student_id_number}</span>.
                            <br /><br />
                            Are you sure you want to replace it with <span className="font-bold text-blue-600">{assignIdValue}</span>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
                        <Button onClick={executeAssignment} className="bg-red-600 text-white hover:bg-red-700">
                            Confirm Overwrite
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
