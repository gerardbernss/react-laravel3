import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Briefcase, CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DateRange, DropdownNavProps, DropdownProps } from 'react-day-picker';
import { HiEye, HiOutlinePencilAlt, HiPlus, HiTrash } from 'react-icons/hi';
import { toast } from 'sonner';

interface Applicant {
    id: number;
    application_number: string;
    first_name: string;
    last_name: string;
    email: string;
    gender?: string;
    application_date?: string;
    application_status?: string;
    strand?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Evaluation/Assessment',
        href: dashboard().url,
    },
];

interface Props {
    applications: Applicant[];
}

// Define columns outside the component to prevent unnecessary re-renders
const columns = [
    { key: 'application_number' as keyof Applicant, label: 'Application Number' },
    { key: 'first_name' as keyof Applicant, label: 'First Name' },
    { key: 'last_name' as keyof Applicant, label: 'Last Name' },
    { key: 'email' as keyof Applicant, label: 'Email' },
    { key: 'gender' as keyof Applicant, label: 'Gender' },
    { key: 'strand' as keyof Applicant, label: 'Program/Strand' },
    { key: 'application_date' as keyof Applicant, label: 'Application Date' },
    { key: 'application_status' as keyof Applicant, label: 'Application Status' },
];

export default function Index({ applications }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGender, setSelectedGender] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [selectedStrand, setSelectedStrand] = useState<string>('all');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedApplicantId, setSelectedApplicantId] = useState<number | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [sortConfig, setSortConfig] = useState<{ key: keyof Applicant | null; direction: 'asc' | 'desc' }>({
        key: null,
        direction: 'asc',
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<(keyof Applicant)[]>([
        'application_number',
        'first_name',
        'last_name',
        'email',
        'gender',
        'strand',
        'application_date',
        'application_status',
    ]);

    const handleCalendarChange = (_value: string | number, _e: React.ChangeEventHandler<HTMLSelectElement>) => {
        const _event = {
            target: {
                value: String(_value),
            },
        } as React.ChangeEvent<HTMLSelectElement>;
        _e(_event);
    };

    const handleDeleteClick = (id: number) => {
        setSelectedApplicantId(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (selectedApplicantId === null) return;

        router.delete(`/admissions/applicants/${selectedApplicantId}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedApplicantId(null);
            },
            onError: () => {
                toast.error('Failed to delete applicant. Please try again.');
                setDeleteDialogOpen(false);
            },
        });
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setSelectedApplicantId(null);
    };

    const handleSort = (key: keyof Applicant) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedRows(paginatedApplicants.map((row) => row.id));
        } else {
            setSelectedRows([]);
        }
    };

    const handleSelectRow = (id: number) => {
        setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]));
    };

    const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

    const handleBulkDelete = () => {
        setShowBulkDeleteDialog(true);
    };

    const confirmBulkDelete = () => {
        // TODO: implement actual bulk delete endpoint
        toast.success(`${selectedRows.length} applicants deleted successfully!`);
        setSelectedRows([]);
        setShowBulkDeleteDialog(false);
    };

    const toggleColumnVisibility = (key: keyof Applicant) => {
        setVisibleColumns((prev) => (prev.includes(key) ? prev.filter((col) => col !== key) : [...prev, key]));
    };

    const handleExport = () => {
        const headers = columns.filter((col) => visibleColumns.includes(col.key)).map((col) => col.label);
        const csvContent = [
            headers.join(','),
            ...sortedApplicants.map((row) =>
                columns
                    .filter((col) => visibleColumns.includes(col.key))
                    .map((col) => {
                        const value = row[col.key];
                        if (col.key === 'application_date' && value) {
                            return new Date(value).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: '2-digit',
                            });
                        }
                        return value || '';
                    })
                    .join(','),
            ),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `applicants-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Data exported successfully!');
    };

    const filteredApplicants = useMemo(() => {
        // Pre-calculate loop-invariant values to optimize performance
        const query = searchQuery.toLowerCase();

        let fromTime: number | null = null;
        let toTime: number | null = null;

        if (dateRange?.from) {
            const d = new Date(dateRange.from);
            d.setHours(0, 0, 0, 0);
            fromTime = d.getTime();

            if (dateRange.to) {
                const dt = new Date(dateRange.to);
                dt.setHours(0, 0, 0, 0);
                toTime = dt.getTime();
            }
        }

        const lowerSelectedGender = selectedGender.toLowerCase();
        const lowerSelectedStatus = selectedStatus.toLowerCase();
        const lowerSelectedStrand = selectedStrand.toLowerCase();

        return applications.filter((a) => {
            const matchesSearch =
                a.id.toString().includes(query) ||
                (a.application_number?.toLowerCase() || '').includes(query) ||
                (a.first_name?.toLowerCase() || '').includes(query) ||
                (a.last_name?.toLowerCase() || '').includes(query) ||
                (a.email?.toLowerCase() || '').includes(query);

            const matchesGender = lowerSelectedGender === 'all' || a.gender?.toLowerCase() === lowerSelectedGender;
            const matchesStatus = lowerSelectedStatus === 'all' || a.application_status?.toLowerCase() === lowerSelectedStatus;
            const matchesStrand = lowerSelectedStrand === 'all' || a.strand?.toLowerCase() === lowerSelectedStrand;

            let matchesDate = true;
            if (fromTime !== null) {
                if (!a.application_date) {
                    matchesDate = false;
                } else {
                    // Extract date part and normalize to midnight for comparison
                    const appDate = new Date(a.application_date.split(' ')[0]);
                    appDate.setHours(0, 0, 0, 0);
                    const appTime = appDate.getTime();

                    if (toTime !== null) {
                        matchesDate = appTime >= fromTime && appTime <= toTime;
                    } else {
                        matchesDate = appTime >= fromTime;
                    }
                }
            }

            return matchesSearch && matchesGender && matchesStatus && matchesDate && matchesStrand;
        });
    }, [applications, searchQuery, selectedGender, selectedStatus, dateRange, selectedStrand]);

    const sortedApplicants = useMemo(() => {
        if (!sortConfig.key) return filteredApplicants;

        return [...filteredApplicants].sort((a, b) => {
            const aValue = a[sortConfig.key!];
            const bValue = b[sortConfig.key!];

            if (aValue == null && bValue == null) return 0;
            if (aValue == null) return 1;
            if (bValue == null) return -1;

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [filteredApplicants, sortConfig]);

    const paginatedApplicants = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return sortedApplicants.slice(startIndex, startIndex + pageSize);
    }, [sortedApplicants, currentPage, pageSize]);

    const totalPages = Math.ceil(sortedApplicants.length / pageSize);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Evaluation/Assessment" />

            <div className="space-y-6 p-6 md:p-10">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <Briefcase className="h-7 w-7 text-primary" />
                            <h1 className="text-3xl font-bold text-gray-900">Evaluation/Assessment</h1>
                        </div>
                    </div>
                    <Link
                        href={`/admissions/applicants/create`}
                        className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-md transition-all hover:bg-primary/90 hover:shadow-lg"
                        style={{ minWidth: 'fit-content', whiteSpace: 'nowrap' }}
                    >
                        <HiPlus size={18} />
                        Add New Applicant
                    </Link>
                </div>

                {/* Search + Filters + Columns + Export */}
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    {/* SEARCH ROW */}
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Search</label>
                        <div className="flex items-center">
                            <div className="mb-3 flex h-10 w-full items-center justify-start rounded-md border border-gray-300 bg-white text-sm shadow-sm focus-within:ring-2 focus-within:ring-blue-400 hover:bg-gray-50 md:w-[400px]">
                                <span className="pr-2 pl-3 text-gray-500">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Search by ID, Name, Email, or Applicant No."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="h-full w-full bg-transparent pr-3 text-sm text-gray-700 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* FILTERS + COLUMNS/EXPORT ROW */}
                    <div className="flex flex-wrap items-end gap-3 md:items-end md:justify-between">
                        {/* Left: filters */}
                        <div className="flex flex-wrap items-end gap-3">
                            <button type="button" className="flex h-10 items-center px-2 text-gray-600">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="h-5 w-5"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h18m-5.25 6.75H8.25m4.5 6.75H12" />
                                </svg>
                            </button>

                            <div className="flex flex-col">
                                <label className="mb-1 text-xs font-medium text-gray-600">Gender</label>
                                <Select
                                    value={selectedGender}
                                    onValueChange={(val) => {
                                        setSelectedGender(val);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <SelectTrigger
                                        className={`h-10 w-[150px] rounded-md text-sm transition-all ${
                                            selectedGender !== 'all'
                                                ? 'border-2 border-gray-400 font-bold text-gray-900'
                                                : 'border border-gray-300 text-gray-700'
                                        } bg-white shadow-sm`}
                                    >
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
                                <Select
                                    value={selectedStatus}
                                    onValueChange={(val) => {
                                        setSelectedStatus(val);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <SelectTrigger className="h-10 w-[150px] rounded-md border border-gray-300 bg-white text-sm shadow-sm">
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
                                            className={`h-10 w-[350px] justify-start rounded-md text-left text-sm font-normal ${
                                                dateRange
                                                    ? 'border-2 border-gray-400 font-bold text-gray-900'
                                                    : 'border border-gray-300 text-gray-700'
                                            } bg-white shadow-sm hover:bg-gray-50`}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dateRange?.from ? (
                                                dateRange.to ? (
                                                    <>
                                                        {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                                                    </>
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
                                            onSelect={(range) => {
                                                setDateRange(range);
                                                setCurrentPage(1);
                                            }}
                                            numberOfMonths={2}
                                            captionLayout="dropdown"
                                            startMonth={new Date(1980, 0)}
                                            endMonth={new Date()}
                                            hideNavigation
                                            classNames={{
                                                month_caption: 'mx-0',
                                            }}
                                            components={{
                                                DropdownNav: (props: DropdownNavProps) => {
                                                    return <div className="flex w-full items-center gap-2">{props.children}</div>;
                                                },
                                                Dropdown: (props: DropdownProps) => {
                                                    return (
                                                        <Select
                                                            value={String(props.value)}
                                                            onValueChange={(value) => {
                                                                if (props.onChange) {
                                                                    handleCalendarChange(value, props.onChange);
                                                                }
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
                                                    );
                                                },
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="flex flex-col">
                                <label className="mb-1 text-xs font-medium text-gray-600">Program/Strand</label>
                                <Select
                                    value={selectedStrand}
                                    onValueChange={(val) => {
                                        setSelectedStrand(val);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <SelectTrigger
                                        className={`h-10 w-[450px] rounded-md text-sm transition-all ${
                                            selectedStrand !== 'all'
                                                ? 'border-2 border-gray-400 font-bold text-gray-900'
                                                : 'border border-gray-300 text-gray-700'
                                        } bg-white shadow-sm`}
                                    >
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

                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedGender('all');
                                    setSelectedStatus('all');
                                    setDateRange(undefined);
                                    setSelectedStrand('all');
                                    setCurrentPage(1);
                                }}
                                className="h-10 text-sm text-gray-700 hover:underline active:bg-gray-300"
                            >
                                Clear
                            </Button>
                        </div>

                        {/* Right side: Columns + Export inline with filters */}
                        <div className="mt-3 flex items-end gap-2 md:mt-0">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                                    >
                                        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                        </svg>
                                        Columns
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-56" align="end">
                                    <div className="space-y-2">
                                        <h4 className="mb-2 text-sm font-semibold">Toggle Columns</h4>
                                        {columns.map((column) => (
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

                            <Button
                                variant="outline"
                                className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                                onClick={handleExport}
                            >
                                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                                Export
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedRows.length > 0 && (
                    <div className="mb-4 flex items-center gap-3 rounded-lg bg-blue-50 p-3">
                        <span className="text-sm font-medium text-gray-700">{selectedRows.length} row(s) selected</span>
                        <button
                            onClick={handleBulkDelete}
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                        >
                            Delete Selected
                        </button>
                    </div>
                )}

                {/* Table */}
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
                                    {columns
                                        .filter((col) => visibleColumns.includes(col.key))
                                        .map((column) => (
                                            <th
                                                key={String(column.key)}
                                                onClick={() => handleSort(column.key)}
                                                className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    {column.label}
                                                    {sortConfig.key === column.key &&
                                                        (sortConfig.direction === 'asc' ? (
                                                            <ChevronUp className="h-3.5 w-3.5" />
                                                        ) : (
                                                            <ChevronDown className="h-3.5 w-3.5" />
                                                        ))}
                                                </div>
                                            </th>
                                        ))}
                                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedApplicants.map((row) => (
                                    <tr
                                        key={row.id}
                                        className={`border-b border-gray-200 transition-all hover:bg-slate-50 ${
                                            selectedRows.includes(row.id) ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedRows.includes(row.id)}
                                                onChange={() => handleSelectRow(row.id)}
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
                                        {visibleColumns.includes('email') && <td className="px-4 py-3 text-gray-600">{row.email}</td>}
                                        {visibleColumns.includes('gender') && <td className="px-4 py-3 text-gray-900">{row.gender}</td>}
                                        {visibleColumns.includes('strand') && <td className="px-4 py-3 text-gray-900">{row.strand}</td>}
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
                                                {(() => {
                                                    const status = row.application_status?.toLowerCase() || '';
                                                    let variant: 'outline' | 'success' | 'secondary' | 'default' = 'outline';
                                                    let label = row.application_status || 'Pending';

                                                    switch (status) {
                                                        case 'pending':
                                                            variant = 'outline';
                                                            label = 'Pending';
                                                            break;
                                                        case 'exam taken':
                                                        case 'inactive':
                                                            variant = 'default';
                                                            label = 'Exam Taken';
                                                            break;
                                                        case 'enrolled':
                                                        case 'active':
                                                            variant = 'success';
                                                            label = 'Enrolled';
                                                            break;
                                                        default:
                                                            variant = 'outline';
                                                            label = 'Pending';
                                                    }

                                                    return (
                                                        <Badge variant={variant}>{label}</Badge>
                                                    );
                                                })()}
                                            </td>
                                        )}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <Link href={`/admissions/applicants/${row.id}/show`}>
                                                    <Button variant="outline" size="sm" title="View">
                                                        <HiEye size={16} />
                                                    </Button>
                                                </Link>
                                                <Link href={`/admissions/applicants/${row.id}/edit`}>
                                                    <Button variant="outline" size="sm" title="Edit">
                                                        <HiOutlinePencilAlt size={16} />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(row.id)}
                                                    className="text-red-600 hover:text-red-700"
                                                    title="Delete"
                                                >
                                                    <HiTrash size={16} />
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
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="rounded-lg border border-gray-300 px-3 py-1 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        <span className="text-sm text-gray-700">
                            {sortedApplicants.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} -{' '}
                            {Math.min(currentPage * pageSize, sortedApplicants.length)} of {sortedApplicants.length}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="rounded-lg p-2 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <ChevronsLeft className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="rounded-lg p-2 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <span className="px-4 py-2 text-sm font-medium">
                            Page {currentPage} of {totalPages || 1}
                        </span>
                        <button
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="rounded-lg p-2 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="rounded-lg p-2 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <ChevronsRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Applicant</DialogTitle>
                        <DialogDescription>Are you sure you want to delete this applicant? This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button className="mr-2" type="button" variant="outline" onClick={handleDeleteCancel}>
                            Cancel
                        </Button>
                        <Button type="button" variant="destructive" onClick={handleDeleteConfirm}>
                            Delete
                        </Button>
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
