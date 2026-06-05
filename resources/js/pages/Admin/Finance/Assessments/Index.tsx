import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { TablePagination } from '@/components/ui/table-pagination';
import {
    Banknote,
    ChevronDown,
    ChevronUp,
    ClipboardList,
    Eye,
    Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface Assessment {
    id: number;
    type: 'student' | 'applicant';
    assessment_number: string;
    school_year: string;
    semester: string;
    status: 'finalized' | 'partial' | 'paid' | 'draft' | 'cancelled' | 'for_enrollment';
    gross_amount: number;
    total_discounts: number;
    net_amount: number;
    total_paid: number;
    balance: number;
    student_name: string;
    student_id_number: string;
    grade_level: string;
    applicant_id: number | null;
}

interface Props {
    assessments: Assessment[];
    schoolYears: string[];
    openStudentPeriod: { id: number; school_year: string; semester: string } | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Finance', href: '/admin/finance/assessments' },
    { title: 'Assessments', href: '/admin/finance/assessments' },
];

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    finalized:      { label: 'Pending',        variant: 'outline' },
    partial:        { label: 'Partial',        variant: 'secondary' },
    paid:           { label: 'Paid',           variant: 'default' },
    draft:          { label: 'Draft',          variant: 'outline' },
    cancelled:      { label: 'Cancelled',      variant: 'destructive' },
    for_enrollment: { label: 'For Enrollment', variant: 'secondary' },
};

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
}

type SortKey = 'assessment_number' | 'student_name' | 'grade_level' | 'school_year' | 'net_amount' | 'total_paid' | 'balance' | 'status';

export default function AssessmentsIndex({ assessments, schoolYears, openStudentPeriod }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedSchoolYear, setSelectedSchoolYear] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });

    const [showGenerateDialog, setShowGenerateDialog] = useState(false);
    const { processing: generating, post: postGenerate } = useForm();
    const handleGenerateAssessments = () => {
        if (!openStudentPeriod) return;
        postGenerate(`/enrollment-periods/${openStudentPeriod.id}/generate-assessments`, {
            onSuccess: () => setShowGenerateDialog(false),
        });
    };

    const filteredItems = useMemo(() => {
        return assessments.filter((a) => {
            const q = searchQuery.toLowerCase();
            const matchesSearch =
                !q ||
                a.assessment_number.toLowerCase().includes(q) ||
                a.student_name.toLowerCase().includes(q) ||
                a.student_id_number.toLowerCase().includes(q);
            const matchesStatus = !selectedStatus || a.status === selectedStatus;
            const matchesYear = !selectedSchoolYear || a.school_year === selectedSchoolYear;
            const matchesSemester = !selectedSemester || a.semester === selectedSemester;
            return matchesSearch && matchesStatus && matchesYear && matchesSemester;
        });
    }, [assessments, searchQuery, selectedStatus, selectedSchoolYear, selectedSemester]);

    const sortedItems = useMemo(() => {
        if (!sortConfig.key) return filteredItems;
        return [...filteredItems].sort((a, b) => {
            let aVal = '';
            let bVal = '';
            if (sortConfig.key === 'assessment_number') { aVal = a.assessment_number; bVal = b.assessment_number; }
            else if (sortConfig.key === 'student_name') { aVal = a.student_name; bVal = b.student_name; }
            else if (sortConfig.key === 'grade_level') { aVal = a.grade_level; bVal = b.grade_level; }
            else if (sortConfig.key === 'school_year') { aVal = a.school_year; bVal = b.school_year; }
            else if (sortConfig.key === 'net_amount') { aVal = String(a.net_amount); bVal = String(b.net_amount); }
            else if (sortConfig.key === 'total_paid') { aVal = String(a.total_paid); bVal = String(b.total_paid); }
            else if (sortConfig.key === 'balance') { aVal = String(a.balance); bVal = String(b.balance); }
            else if (sortConfig.key === 'status') { aVal = a.status; bVal = b.status; }
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
        setSelectedStatus('');
        setSelectedSchoolYear('');
        setSelectedSemester('');
        setCurrentPage(1);
    };

    const hasFilters = searchQuery || selectedStatus || selectedSchoolYear || selectedSemester;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Finance — Assessments" />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Banknote className="h-7 w-7 text-primary" />
                        <h1 className="text-3xl font-bold text-gray-900">Student Assessments</h1>
                    </div>
                    {openStudentPeriod && (
                        <Button
                            onClick={() => setShowGenerateDialog(true)}
                            className="gap-2 bg-blue-600 hover:bg-blue-700"
                        >
                            <ClipboardList className="h-4 w-4" />
                            Generate Assessments
                        </Button>
                    )}
                </div>

                {/* Filters */}
                <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Search</label>
                        <div className="mb-3 flex h-10 w-full items-center rounded-lg border border-gray-300 bg-white md:w-[400px]">
                            <span className="pl-3 pr-2 text-gray-500"><Search className="h-4 w-4" /></span>
                            <input
                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                                placeholder="Search by name or assessment no."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                        <Select value={selectedStatus || 'all'} onValueChange={(v) => { setSelectedStatus(v === 'all' ? '' : v); setCurrentPage(1); }}>
                            <SelectTrigger className="w-44"><SelectValue placeholder="All statuses" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="for_enrollment">For Enrollment</SelectItem>
                                <SelectItem value="finalized">Pending</SelectItem>
                                <SelectItem value="partial">Partial</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={selectedSchoolYear || 'all'} onValueChange={(v) => { setSelectedSchoolYear(v === 'all' ? '' : v); setCurrentPage(1); }}>
                            <SelectTrigger className="w-40"><SelectValue placeholder="School year" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All School Years</SelectItem>
                                {schoolYears.map((sy) => <SelectItem key={sy} value={sy}>{sy}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={selectedSemester || 'all'} onValueChange={(v) => { setSelectedSemester(v === 'all' ? '' : v); setCurrentPage(1); }}>
                            <SelectTrigger className="w-44"><SelectValue placeholder="Semester" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Semesters</SelectItem>
                                <SelectItem value="First Semester">First Semester</SelectItem>
                                <SelectItem value="Second Semester">Second Semester</SelectItem>
                                <SelectItem value="Summer">Summer</SelectItem>
                                <SelectItem value="Full Year">Full Year</SelectItem>
                            </SelectContent>
                        </Select>
                        {hasFilters && <Button variant="ghost" onClick={clearFilters}>Clear</Button>}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                    <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 z-10 bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                                <tr>
                                    <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort('assessment_number')}>
                                        Assessment No. <SortIcon col="assessment_number" />
                                    </th>
                                    <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort('student_name')}>
                                        Student <SortIcon col="student_name" />
                                    </th>
                                    <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort('grade_level')}>
                                        Grade <SortIcon col="grade_level" />
                                    </th>
                                    <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort('school_year')}>
                                        School Year <SortIcon col="school_year" />
                                    </th>
                                    <th className="cursor-pointer px-4 py-3 text-right" onClick={() => toggleSort('net_amount')}>
                                        Net Amount <SortIcon col="net_amount" />
                                    </th>
                                    <th className="cursor-pointer px-4 py-3 text-right" onClick={() => toggleSort('total_paid')}>
                                        Paid <SortIcon col="total_paid" />
                                    </th>
                                    <th className="cursor-pointer px-4 py-3 text-right" onClick={() => toggleSort('balance')}>
                                        Balance <SortIcon col="balance" />
                                    </th>
                                    <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort('status')}>
                                        Status <SortIcon col="status" />
                                    </th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedItems.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                                            No assessments found.
                                        </td>
                                    </tr>
                                )}
                                {paginatedItems.map((a) => {
                                    const sc = statusConfig[a.status] ?? { label: a.status, variant: 'outline' as const };
                                    return (
                                        <tr key={`${a.type}-${a.id}`} className={`border-b border-gray-200 transition-all hover:bg-slate-50 ${a.type === 'applicant' ? 'bg-green-50/40' : ''}`}>
                                            <td className="px-4 py-3 font-mono text-xs font-medium">{a.assessment_number}</td>
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-gray-900">{a.student_name}</p>
                                                <p className="text-xs text-gray-400">
                                                    {a.type === 'applicant' ? 'Applicant' : a.student_id_number}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{a.grade_level}</td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {a.school_year}
                                                <br />
                                                <span className="text-xs text-gray-400">{a.semester}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">{formatCurrency(a.net_amount)}</td>
                                            <td className="px-4 py-3 text-right text-green-600">{formatCurrency(a.total_paid)}</td>
                                            <td className="px-4 py-3 text-right font-semibold text-red-600">
                                                {a.balance > 0 ? formatCurrency(a.balance) : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant={sc.variant}>{sc.label}</Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={
                                                        a.type === 'applicant' && a.applicant_id
                                                            ? `/admissions/applicants/${a.applicant_id}/enroll`
                                                            : `/admin/finance/assessments/${a.id}`
                                                    }
                                                >
                                                    <Button size="sm" variant="outline">
                                                        <Eye className="mr-1 h-3 w-3" />
                                                        {a.type === 'applicant' ? 'Enroll' : 'View'}
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
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
                open={showGenerateDialog}
                onClose={() => setShowGenerateDialog(false)}
                onConfirm={handleGenerateAssessments}
                title="Generate Fee Assessments?"
                description={`This will create fee assessments for all active students who don't have one yet for ${openStudentPeriod?.school_year} — ${openStudentPeriod?.semester}. Students with existing assessments will be skipped. Safe to run multiple times.`}
                confirmLabel="Generate Assessments"
                processingLabel="Generating..."
                processing={generating}
                variant="warning"
            />
        </AppLayout>
    );
}
