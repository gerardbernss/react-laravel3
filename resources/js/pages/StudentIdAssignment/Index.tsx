import EmailAssignIdButton from '@/components/email-assign-id-button';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Chip } from '@mui/material';
import { format } from 'date-fns';
import { CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronUp, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DateRange, DropdownNavProps, DropdownProps } from 'react-day-picker';
import { toast } from 'sonner';

interface Applicant {
    id: number;
    student_id_number: string;
    application_number: string;
    personal_data_id: number;
    first_name: string;
    last_name: string;
    email: string;
    sex?: string;
    application_date?: string;
    application_status?: string;
    strand?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Student ID Number Assignment',
        href: dashboard().url,
    },
];

interface Props {
    applications: Applicant[];
}

export default function Index({ applications }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGender, setSelectedGender] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [selectedStrand, setSelectedStrand] = useState<string>('all');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedApplicantIdForDelete, setSelectedApplicantIdForDelete] = useState<number | null>(null); // Renamed to avoid confusion
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [sortConfig, setSortConfig] = useState<{ key: keyof Applicant | null; direction: 'asc' | 'desc' }>({
        key: null,
        direction: 'asc',
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // CHANGED: Single selection state instead of array
    const [selectedRowId, setSelectedRowId] = useState<number | null>(null);

    // Confirmation dialog state for overwrite
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [pendingAssignIdValue, setPendingAssignIdValue] = useState('');

    const [visibleColumns, setVisibleColumns] = useState<(keyof Applicant | 'actions')[]>([
        'student_id_number',
        'application_number',
        'first_name',
        'last_name',
        'email',
        'sex',
        'strand',
        'application_date',
        'application_status',
        'actions',
    ]);

    // State for Student ID assignment
    const [assignIdValue, setAssignIdValue] = useState('');

    const handleCalendarChange = (_value: string | number, _e: React.ChangeEventHandler<HTMLSelectElement>) => {
        const _event = {
            target: {
                value: String(_value),
            },
        } as React.ChangeEvent<HTMLSelectElement>;
        _e(_event);
    };

    const handleSort = (key: keyof Applicant) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // CHANGED: Logic to toggle single row selection
    const handleSelectRow = (id: number) => {
        if (selectedRowId === id) {
            setSelectedRowId(null);
            setAssignIdValue('');
        } else {
            setSelectedRowId(id);
            setAssignIdValue(''); // Reset input when changing students
        }
    };

    // 1. The actual API call wrapper
    const executeAssignment = () => {
        if (!selectedRowId) return;

        router.post(
            '/studentidassignment',
            {
                applicant_id: selectedRowId,
                student_number: assignIdValue,
            },
            {
                onSuccess: () => {
                    setAssignIdValue('');
                    setSelectedRowId(null);
                    setConfirmDialogOpen(false); // Close dialog if open
                },
                onError: () => {
                    toast.error('Failed to assign Student ID.');
                    setConfirmDialogOpen(false);
                },
            },
        );
    };

    // 2. The form handler (checks for existing ID first)
    const handleAssignStudentId = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedRowId || !selectedApplicant) return;

        if (!assignIdValue.trim()) {
            toast.error('Please enter a Student ID number.');
            return;
        }

        // IF ID exists, open the Dialog
        if (selectedApplicant.student_id_number) {
            setConfirmDialogOpen(true);
        } else {
            // IF NO ID, proceed immediately
            executeAssignment();
        }
    };

    const toggleColumnVisibility = (key: keyof Applicant) => {
        setVisibleColumns((prev) => (prev.includes(key) ? prev.filter((col) => col !== key) : [...prev, key]));
    };

    const filteredApplicants = useMemo(() => {
        return applications.filter((a) => {
            const matchesSearch =
                a.id.toString().includes(searchQuery) ||
                a.application_number.toLowerCase().includes(searchQuery) ||
                a.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                a.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                a.email?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesGender = selectedGender === 'all' || a.sex?.toLowerCase() === selectedGender.toLowerCase();
            const matchesStatus = selectedStatus === 'all' || a.application_status?.toLowerCase() === selectedStatus.toLowerCase();
            const matchesStrand = selectedStrand === 'all' || a.strand?.toLowerCase() === selectedStrand.toLowerCase();

            let matchesDate = true;
            if (dateRange?.from) {
                if (!a.application_date) {
                    matchesDate = false;
                } else {
                    const appDateStr = a.application_date.split(' ')[0];
                    const appDate = new Date(appDateStr);
                    const fromDate = new Date(dateRange.from);

                    appDate.setHours(0, 0, 0, 0);
                    fromDate.setHours(0, 0, 0, 0);

                    if (dateRange.to) {
                        const toDate = new Date(dateRange.to);
                        toDate.setHours(0, 0, 0, 0);
                        matchesDate = appDate.getTime() >= fromDate.getTime() && appDate.getTime() <= toDate.getTime();
                    } else {
                        matchesDate = appDate.getTime() >= fromDate.getTime();
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

    // Get the currently selected applicant object for the summary view
    const selectedApplicant = useMemo(() => {
        return applications.find((app) => app.id === selectedRowId);
    }, [applications, selectedRowId]);

    // 3. Add handler for Email ID action
    const handleEmailId = (applicantId: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row selection
        // Your email logic here - you can use the EmailAssignIdButton component logic
        // or create a new email sending function
        console.log('Email ID for applicant:', applicantId);
    };

    type ColumnKey = keyof Applicant | 'actions';

    const columns: { key: ColumnKey; label: string }[] = [
        { key: 'student_id_number', label: 'Student ID Number' },
        { key: 'application_number', label: 'Application Number' },
        { key: 'first_name', label: 'First Name' },
        { key: 'last_name', label: 'Last Name' },
        { key: 'email', label: 'Email' },
        { key: 'sex', label: 'Gender' },
        { key: 'strand', label: 'Program/Strand' },
        { key: 'application_date', label: 'Application Date' },
        { key: 'application_status', label: 'Application Status' },
        { key: 'actions', label: 'Actions' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Student ID Number Assignment" />

            <div className="p-10">
                <h1 className="mb-6 text-3xl font-semibold text-gray-800">Student ID Number Assignment</h1>

                {/* Search + Filters + Columns + Export */}
                <div className="mb-4 space-y-3">
                    {/* ... (Keep existing search/filters code same as before) ... */}
                    <div className="grid w-full grid-cols-1 items-start gap-3 md:grid-cols-[1fr_auto] md:items-start">
                        {/* LEFT: label + search input */}
                        {/* SEARCH + FILTERS — all inline */}
                        {/* SEARCH + FILTERS — all inline */}
                        <div className="flex w-full items-end justify-between gap-4">
                            {/* LEFT = SEARCH BAR */}
                            <div className="flex flex-col">
                                <label className="mb-1 block text-xs font-medium text-gray-600">Search</label>
                                <div className="flex h-10 w-[350px] items-center rounded-md border border-gray-300 bg-white text-sm shadow-sm focus-within:ring-2 focus-within:ring-blue-400">
                                    <span className="pr-2 pl-3 text-gray-500">🔍</span>
                                    <input
                                        type="text"
                                        placeholder="Search by Name, Email, or Application No."
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="h-full w-full bg-transparent pr-3 text-sm text-gray-700 outline-none"
                                    />
                                </div>
                            </div>

                            {/* RIGHT = FILTERS */}
                            <div className="flex items-end gap-4">
                                {/* LEFT LABEL */}
                                <div className="flex items-end pb-2.5">
                                    <span className="text-sm font-semibold text-gray-700">Filter</span>
                                </div>
                                {/* FILTER FIELDS */}
                                <div className="flex flex-wrap items-end gap-4">
                                    {/* GENDER */}
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

                                    {/* STRAND */}
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
                                                className={`h-10 w-[350px] rounded-md text-sm transition-all ${
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
                                                <SelectItem value="Accountancy and Business Management">ABM</SelectItem>
                                                <SelectItem value="Humanities and Social Sciences">HUMSS</SelectItem>
                                                <SelectItem value="Science, Technology, Engineering, and Mathematics">STEM</SelectItem>
                                                <SelectItem value="General Academics">General Academics</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* CLEAR BUTTON */}
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
                                        className="h-10 text-sm text-gray-700 hover:underline"
                                    >
                                        Clear
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* REMOVED BULK ACTIONS BUTTON (DELETE SELECTED) as requested */}

                {/* Custom DataGrid Table */}
                <div className="overflow-hidden rounded-lg bg-white shadow-md">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-linear-to-r from-slate-700 to-slate-800 text-white">
                                <tr>
                                    {columns
                                        .filter((col) => visibleColumns.includes(col.key))
                                        .map((column) => (
                                            <th
                                                key={String(column.key)}
                                                onClick={() => {
                                                    if (column.key !== 'actions') {
                                                        handleSort(column.key as keyof Applicant);
                                                    }
                                                }}
                                                className={`px-4 py-3 text-left font-semibold transition-colors ${
                                                    column.key !== 'actions' ? 'cursor-pointer hover:bg-slate-600' : ''
                                                }`}
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    {column.label}
                                                    {column.key !== 'actions' &&
                                                        sortConfig.key === column.key &&
                                                        (sortConfig.direction === 'asc' ? (
                                                            <ChevronUp className="h-3.5 w-3.5" />
                                                        ) : (
                                                            <ChevronDown className="h-3.5 w-3.5" />
                                                        ))}
                                                </div>
                                            </th>
                                        ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedApplicants.map((row) => (
                                    <tr
                                        key={row.id}
                                        onClick={() => handleSelectRow(row.id)}
                                        className={`cursor-pointer border-b border-gray-200 transition-all hover:bg-slate-50 ${
                                            selectedRowId === row.id ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                        {/* Removed Checkbox TD */}
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
                                        {visibleColumns.includes('email') && <td className="px-4 py-3 text-gray-600">{row.email}</td>}
                                        {visibleColumns.includes('sex') && <td className="px-4 py-3 text-gray-900">{row.sex}</td>}
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
                                                    let color: 'default' | 'success' | 'warning' | 'info' = 'default';
                                                    let label = row.application_status || 'Pending';

                                                    switch (status) {
                                                        case 'pending':
                                                            color = 'default';
                                                            label = 'Pending';
                                                            break;
                                                        case 'exam taken':
                                                        case 'inactive':
                                                            color = 'info';
                                                            label = 'Exam Taken';
                                                            break;
                                                        case 'enrolled':
                                                        case 'active':
                                                            color = 'success';
                                                            label = 'Enrolled';
                                                            break;
                                                        default:
                                                            color = 'default';
                                                            label = 'Pending';
                                                    }

                                                    return (
                                                        <Chip
                                                            label={label}
                                                            color={color}
                                                            size="small"
                                                            sx={{
                                                                fontWeight: 600,
                                                                textTransform: 'capitalize',
                                                                fontSize: '0.7rem',
                                                                height: '20px',
                                                            }}
                                                        />
                                                    );
                                                })()}
                                            </td>
                                        )}
                                        {visibleColumns.includes('actions') && (
                                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                <div className="group relative inline-block">
                                                    <div className={!row.student_id_number ? 'pointer-events-none opacity-50' : ''}>
                                                        <EmailAssignIdButton applicationId={row.id} />
                                                    </div>
                                                    {!row.student_id_number && (
                                                        <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 rounded bg-gray-800 px-3 py-1.5 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:block group-hover:opacity-100">
                                                            Assign ID number first
                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                {/* Pagination Footer */}
                <div className="mt-4 flex items-center justify-between rounded-lg bg-white p-4 shadow-md">
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

                {/* NEW SECTION: Assign Student Number Container - Matches Screenshot */}
                {selectedApplicant && (
                    <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                        <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-gray-800">
                            <UserPlus className="h-6 w-6 text-gray-700" />
                            Assign Student Number
                        </h2>

                        <form onSubmit={handleAssignStudentId} className="space-y-6">
                            {/* Selected Applicant Summary Box */}
                            <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-6">
                                <h3 className="mb-4 text-sm font-medium text-gray-500">Selected Applicant</h3>

                                <div className="space-y-4">
                                    {/* Application # */}
                                    <div>
                                        <p className="mb-1 text-xs text-gray-500">Application #:</p>
                                        <p className="font-medium text-gray-900">{selectedApplicant.application_number}</p>
                                    </div>

                                    {/* Application Date */}
                                    <div>
                                        <p className="mb-1 text-xs text-gray-500">Application Date:</p>
                                        <p className="tetx-md font-medium text-gray-900">
                                            {selectedApplicant.application_date
                                                ? format(new Date(selectedApplicant.application_date), 'MMM dd, yyyy')
                                                : 'N/A'}
                                        </p>
                                    </div>

                                    {/* Name */}
                                    <div>
                                        <p className="mb-1 text-xs text-gray-500">Name:</p>
                                        <p className="text-md font-bold text-gray-900">
                                            {selectedApplicant.first_name} {selectedApplicant.last_name}
                                        </p>
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <p className="mb-1 text-xs text-gray-500">Email:</p>
                                        <p className="font-medium text-gray-900">{selectedApplicant.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Input Field */}
                            <div className="flex-2">
                                <label htmlFor="studentIdInput" className="mb-2 block font-semibold text-gray-700">
                                    Student Number
                                </label>

                                {/* Input + Button inline */}
                                <div className="flex items-center gap-3">
                                    <input
                                        id="studentIdInput"
                                        type="text"
                                        value={assignIdValue}
                                        onChange={(e) => setAssignIdValue(e.target.value)}
                                        className="h-10 flex-1 rounded-md border border-gray-300 px-4 text-base shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                                    />

                                    <Button
                                        type="submit"
                                        className="flex items-center gap-2 rounded-lg bg-[#073066] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#05509e]"
                                    >
                                        Assign Student Number
                                    </Button>
                                </div>

                                <p className="mt-2 text-xs text-gray-500">Auto-generated. You can modify if needed.</p>
                            </div>
                        </form>
                    </div>
                )}
            </div>
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
                            <br />
                            <br />
                            Are you sure you want to replace it with <span className="font-bold text-blue-600">{assignIdValue}</span>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={executeAssignment} className="bg-red-600 text-white hover:bg-red-700">
                            Confirm Overwrite
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
