import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TablePagination } from '@/components/ui/table-pagination';
import { PAGE_PADDING, TABLE_HEADER_CELL, TABLE_ROW_ACTION } from '@/constants/ui';
import {
    useFinanceAssessments,
    type Assessment,
    type AssessmentSortKey,
    type OpenStudentPeriod,
} from '@/hooks/useFinanceAssessments';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ChevronDown, ChevronUp, ClipboardList, Eye, Search, UserCheck } from 'lucide-react';

interface Props {
    assessments: Assessment[];
    schoolYears: string[];
    openStudentPeriod: OpenStudentPeriod | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Finance', href: '/admin/fee-assessments' },
    { title: 'Assessments', href: '/admin/fee-assessments' },
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

const TH_RIGHT = 'px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer hover:bg-gray-100';

function SortIcon({ col, sortConfig }: { col: AssessmentSortKey; sortConfig: { key: AssessmentSortKey | null; direction: 'asc' | 'desc' } }) {
    if (sortConfig.key !== col) return <ChevronUp className="ml-1 inline h-3 w-3 opacity-30" />;
    return sortConfig.direction === 'asc'
        ? <ChevronUp className="ml-1 inline h-3 w-3" />
        : <ChevronDown className="ml-1 inline h-3 w-3" />;
}

interface AssessmentRowProps {
    assessment: Assessment;
}

function AssessmentRow({ assessment: a }: AssessmentRowProps) {
    const sc = statusConfig[a.status] ?? { label: a.status, variant: 'outline' as const };
    return (
        <tr className={`border-b border-gray-200 transition-all hover:bg-slate-50 ${a.type === 'applicant' ? 'bg-green-50/40' : ''}`}>
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
                            ? `/admin/applicants/${a.applicant_id}/enroll`
                            : `/admin/fee-assessments/${a.id}`
                    }
                >
                    <button className={TABLE_ROW_ACTION}>
                        {a.type === 'applicant' ? <UserCheck className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {a.type === 'applicant' ? 'Enroll' : 'View'}
                    </button>
                </Link>
            </td>
        </tr>
    );
}

/** Admin finance assessment list — filterable, sortable table of student fee assessments grouped by school year and enrollment period. */
export default function AssessmentsIndex({ assessments, schoolYears, openStudentPeriod }: Props) {
    const {
        searchQuery, setSearchQuery,
        selectedStatus, setSelectedStatus,
        selectedSchoolYear, setSelectedSchoolYear,
        selectedSemester, setSelectedSemester,
        currentPage, setCurrentPage,
        pageSize, setPageSize,
        sortConfig,
        showGenerateDialog, setShowGenerateDialog,
        generating,
        hasFilters,
        sortedItems,
        paginatedItems,
        toggleSort,
        clearFilters,
        handleGenerateAssessments,
    } = useFinanceAssessments(assessments, openStudentPeriod);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Finance — Assessments" />

            <div className={PAGE_PADDING}>
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">Assessments</h1>
                    {openStudentPeriod && (
                        <Button onClick={() => setShowGenerateDialog(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
                            <ClipboardList className="h-4 w-4" />
                            Generate Assessments
                        </Button>
                    )}
                </div>

                <div className="mb-6 flex flex-wrap items-end gap-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Search</label>
                        <div className="relative w-full sm:w-[300px]">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search by name or assessment no."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="pl-10"
                            />
                        </div>
                    </div>
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

                <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                    <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 z-10 bg-gray-50">
                                <tr>
                                    <th className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('assessment_number')}>
                                        Assessment No. <SortIcon col="assessment_number" sortConfig={sortConfig} />
                                    </th>
                                    <th className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('student_name')}>
                                        Student <SortIcon col="student_name" sortConfig={sortConfig} />
                                    </th>
                                    <th className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('grade_level')}>
                                        Grade <SortIcon col="grade_level" sortConfig={sortConfig} />
                                    </th>
                                    <th className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('school_year')}>
                                        School Year <SortIcon col="school_year" sortConfig={sortConfig} />
                                    </th>
                                    <th className={TH_RIGHT} onClick={() => toggleSort('net_amount')}>
                                        Net Amount <SortIcon col="net_amount" sortConfig={sortConfig} />
                                    </th>
                                    <th className={TH_RIGHT} onClick={() => toggleSort('total_paid')}>
                                        Paid <SortIcon col="total_paid" sortConfig={sortConfig} />
                                    </th>
                                    <th className={TH_RIGHT} onClick={() => toggleSort('balance')}>
                                        Balance <SortIcon col="balance" sortConfig={sortConfig} />
                                    </th>
                                    <th className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('status')}>
                                        Status <SortIcon col="status" sortConfig={sortConfig} />
                                    </th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                                            No assessments found.
                                        </td>
                                    </tr>
                                ) : paginatedItems.map((a) => (
                                    <AssessmentRow key={`${a.type}-${a.id}`} assessment={a} />
                                ))}
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
