import { AppTable } from '@/components/AppTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TablePagination } from '@/components/ui/table-pagination';
import { BADGE_BASE, BADGE_BLUE, BADGE_GREEN, BADGE_RED, BADGE_YELLOW, CARD, FILTER_CARD, PAGE_PADDING, PAGE_TITLE } from '@/constants/ui';
import { type AttendanceRecord, type BlockSection, type Subject, useAttendanceHistory } from '@/hooks/useAttendanceHistory';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, ClipboardCheck } from 'lucide-react';

interface Props {
    blockSection: BlockSection;
    subjects: Subject[];
    selectedSubjectId: number;
    dateFrom: string | null;
    dateTo: string | null;
    records: AttendanceRecord[];
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatDate(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getDayName(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00');
    return DAY_NAMES[d.getDay()];
}

function rateColor(rate: number | null) {
    if (rate === null) return 'text-gray-400';
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
}

/** Admin attendance history page for a block section — shows per-subject attendance records within a selected date range. */
export default function History({ blockSection, subjects, selectedSubjectId, dateFrom, dateTo, records }: Props) {
    const {
        fromVal,
        setFromVal,
        toVal,
        setToVal,
        subjectVal,
        setSubjectVal,
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        paginated,
        breadcrumbs,
        applyFilters,
        clearFilters,
        hasDateFilter,
    } = useAttendanceHistory({ blockSection, selectedSubjectId, dateFrom, dateTo, records });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`History — ${blockSection.code}`} />

            <div className={PAGE_PADDING}>
                <div className="mb-6">
                    <div className="mb-4 flex items-center gap-4">
                        <Link
                            href={blockSection.grade_level ? `/teacher/attendance/grade/${encodeURIComponent(blockSection.grade_level)}` : '/teacher/attendance'}
                            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Back
                        </Link>
                    </div>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className={PAGE_TITLE}>
                                {blockSection.code}
                                <span className="ml-2 text-xl font-normal text-gray-500">{blockSection.name}</span>
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                {[blockSection.grade_level, blockSection.strand, blockSection.school_year, blockSection.semester]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Link href={`/teacher/attendance/${blockSection.id}?subject_id=${subjectVal}`}>
                                <Button variant="outline">
                                    <ClipboardCheck className="mr-2 h-4 w-4" />
                                    Take / View Today
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className={`mb-6 ${FILTER_CARD}`}>
                    <div className="flex flex-wrap items-end gap-4">
                        {subjects.length > 1 && (
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-gray-500">Subject</label>
                                <Select value={String(subjectVal)} onValueChange={(v) => setSubjectVal(v)}>
                                    <SelectTrigger className="w-[220px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {subjects.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                {s.code} — {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-500">From</label>
                            <Input type="date" value={fromVal} onChange={(e) => setFromVal(e.target.value)} className="w-[160px]" />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-500">To</label>
                            <Input type="date" value={toVal} onChange={(e) => setToVal(e.target.value)} className="w-[160px]" />
                        </div>

                        <Button onClick={applyFilters} size="sm">
                            Apply
                        </Button>

                        {hasDateFilter && (
                            <Button onClick={clearFilters} variant="ghost" size="sm" className="text-gray-500">
                                Clear dates
                            </Button>
                        )}
                    </div>
                </div>

                {records.length === 0 ? (
                    <div className={`${CARD} p-12 text-center`}>
                        <CalendarDays className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                        <p className="text-sm font-medium text-gray-500">No attendance records found.</p>
                        {hasDateFilter && <p className="mt-1 text-xs text-gray-400">Try widening the date range or clearing the filters.</p>}
                    </div>
                ) : (
                    <AppTable
                        footer={
                            <TablePagination
                                total={records.length}
                                pageSize={pageSize}
                                currentPage={currentPage}
                                onPageChange={setCurrentPage}
                                onPageSizeChange={(s) => {
                                    setPageSize(s);
                                    setCurrentPage(1);
                                }}
                            />
                        }
                    >
                        <AppTable.Head>
                            <AppTable.Th>Date</AppTable.Th>
                            <AppTable.Th center>Marked</AppTable.Th>
                            <AppTable.Th center className="text-green-600">
                                Present
                            </AppTable.Th>
                            <AppTable.Th center className="text-red-600">
                                Absent
                            </AppTable.Th>
                            <AppTable.Th center className="text-yellow-600">
                                Late
                            </AppTable.Th>
                            <AppTable.Th center className="text-blue-600">
                                Excused
                            </AppTable.Th>
                            <AppTable.Th center>Rate</AppTable.Th>
                            <AppTable.Th center>Actions</AppTable.Th>
                        </AppTable.Head>
                        <AppTable.Body>
                            {paginated.map((record) => (
                                <AppTable.Row key={record.date}>
                                    <AppTable.Td>
                                        <p className="font-medium text-gray-900">{formatDate(record.date)}</p>
                                        <p className="text-xs text-gray-400">{getDayName(record.date)}</p>
                                    </AppTable.Td>
                                    <AppTable.Td className="text-center">
                                        <Badge variant="outline">{record.total_marked}</Badge>
                                    </AppTable.Td>
                                    <AppTable.Td className="text-center">
                                        {record.present > 0 ? (
                                            <span className={`${BADGE_BASE} ${BADGE_GREEN}`}>{record.present}</span>
                                        ) : (
                                            <span className="text-gray-300">—</span>
                                        )}
                                    </AppTable.Td>
                                    <AppTable.Td className="text-center">
                                        {record.absent > 0 ? (
                                            <span className={`${BADGE_BASE} ${BADGE_RED}`}>{record.absent}</span>
                                        ) : (
                                            <span className="text-gray-300">—</span>
                                        )}
                                    </AppTable.Td>
                                    <AppTable.Td className="text-center">
                                        {record.late > 0 ? (
                                            <span className={`${BADGE_BASE} ${BADGE_YELLOW}`}>{record.late}</span>
                                        ) : (
                                            <span className="text-gray-300">—</span>
                                        )}
                                    </AppTable.Td>
                                    <AppTable.Td className="text-center">
                                        {record.excused > 0 ? (
                                            <span className={`${BADGE_BASE} ${BADGE_BLUE}`}>{record.excused}</span>
                                        ) : (
                                            <span className="text-gray-300">—</span>
                                        )}
                                    </AppTable.Td>
                                    <AppTable.Td className={`text-center font-semibold ${rateColor(record.attendance_rate)}`}>
                                        {record.attendance_rate !== null ? `${record.attendance_rate}%` : '—'}
                                    </AppTable.Td>
                                    <AppTable.Td className="text-center">
                                        <Link href={`/teacher/attendance/${blockSection.id}?date=${record.date}&subject_id=${subjectVal}`}>
                                            <Button variant="outline" size="sm">
                                                <ClipboardCheck className="mr-1 h-3.5 w-3.5" />
                                                View / Edit
                                            </Button>
                                        </Link>
                                    </AppTable.Td>
                                </AppTable.Row>
                            ))}
                        </AppTable.Body>
                    </AppTable>
                )}
            </div>
        </AppLayout>
    );
}
