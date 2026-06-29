import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { BODY_TEXT, CARD, FILTER_CARD, LABEL_TEXT, PAGE_PADDING, PAGE_TITLE, SECTION_HEADING } from '@/constants/ui';
import { type BlockSection, type StudentRow, type SubjectOption, useAttendanceSheet } from '@/hooks/useAttendanceSheet';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, CalendarDays, CheckCircle, Clock, History, Loader2, Save, ShieldCheck, UserX, Users, XCircle } from 'lucide-react';

interface Props {
    blockSection: BlockSection;
    students: StudentRow[];
    selectedDate: string;
    selectedSubjectId: number;
    subjects: SubjectOption[];
    missedDates: string[];
}

const STATUS_ICONS = [
    { status: 'Present', icon: CheckCircle, activeClass: 'text-green-600 bg-green-100', title: 'Present' },
    { status: 'Absent', icon: XCircle, activeClass: 'text-red-600 bg-red-100', title: 'Absent' },
    { status: 'Late', icon: Clock, activeClass: 'text-yellow-600 bg-yellow-100', title: 'Late' },
    { status: 'Excused', icon: ShieldCheck, activeClass: 'text-blue-600 bg-blue-100', title: 'Excused' },
] as const;

function getStatusColor(status: string | null): string {
    switch (status) {
        case 'Present': return 'bg-green-50';
        case 'Absent': return 'bg-red-50';
        case 'Late': return 'bg-yellow-50';
        case 'Excused': return 'bg-blue-50';
        default: return '';
    }
}

function formatDate(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export default function Sheet({ blockSection, students, selectedDate, selectedSubjectId, subjects, missedDates }: Props) {
    const {
        changes,
        saving,
        missedOpen,
        setMissedOpen,
        breadcrumbs,
        getCurrentValue,
        handleStatusChange,
        handleRemarksChange,
        markAllAs,
        liveStats,
        hasChanges,
        handleSubjectChange,
        handleDateChange,
        handleSave,
        discardChanges,
    } = useAttendanceSheet({ blockSection, students, selectedDate, selectedSubjectId });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Attendance - ${blockSection.code}`} />

            <div className={PAGE_PADDING}>
                <div className="mb-6">
                    <div className="mb-4 flex items-center gap-4">
                        <Link
                            href={blockSection.grade_level ? `/attendance/grade/${encodeURIComponent(blockSection.grade_level)}` : '/attendance'}
                            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                        >
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Back
                        </Link>
                        <Link
                            href={`/attendance/${blockSection.id}/history?subject_id=${selectedSubjectId}`}
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                        >
                            <History className="mr-1 h-4 w-4" />
                            View History
                        </Link>
                        {missedDates.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setMissedOpen(true)}
                                className="border-amber-300 text-amber-700 hover:bg-amber-50"
                            >
                                <AlertTriangle className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
                                {missedDates.length} Missed Day{missedDates.length !== 1 ? 's' : ''}
                            </Button>
                        )}
                    </div>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className={PAGE_TITLE}>
                                {blockSection.code} — {blockSection.name}
                            </h1>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-blue-200">
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    {formatDate(selectedDate)}
                                </span>
                                <span className="text-sm text-gray-500">
                                    {blockSection.grade_level}
                                    {blockSection.strand && ` • ${blockSection.strand}`}
                                    {blockSection.school_year && ` • ${blockSection.school_year}`}
                                    {blockSection.semester && ` • ${blockSection.semester}`}
                                </span>
                            </div>
                        </div>
                        <Button onClick={handleSave} disabled={!hasChanges || saving}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {saving ? 'Saving...' : 'Save Attendance'}
                        </Button>
                    </div>
                </div>

                <Dialog open={missedOpen} onOpenChange={setMissedOpen}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                Missed Attendance Days
                            </DialogTitle>
                        </DialogHeader>
                        {missedDates.length === 0 ? (
                            <p className="py-6 text-center text-sm text-gray-500">No missed days in the past 30 days.</p>
                        ) : (
                            <div className="max-h-96 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">#</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Date</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Day</th>
                                            <th className="px-4 py-2 text-center text-xs font-medium tracking-wider text-gray-500 uppercase">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {missedDates.map((d, i) => {
                                            const dt = new Date(d + 'T00:00:00');
                                            return (
                                                <tr key={d} className="hover:bg-gray-50">
                                                    <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                                                    <td className="px-4 py-2 font-medium text-gray-900">
                                                        {dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-500">{dt.toLocaleDateString('en-US', { weekday: 'long' })}</td>
                                                    <td className="px-4 py-2 text-center">
                                                        <Link
                                                            href={`/attendance/${blockSection.id}?date=${d}&subject_id=${selectedSubjectId}`}
                                                            onClick={() => setMissedOpen(false)}
                                                            className="inline-flex items-center gap-1 rounded bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-200"
                                                        >
                                                            <CalendarDays className="h-3 w-3" />
                                                            Go
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                <div className={`mb-4 flex flex-wrap items-end gap-4 ${FILTER_CARD}`}>
                    <div>
                        <label className={`mb-1 block ${LABEL_TEXT}`}>Subject</label>
                        <Select value={String(selectedSubjectId)} onValueChange={handleSubjectChange}>
                            <SelectTrigger className="w-64">
                                <SelectValue placeholder="Select Subject" />
                            </SelectTrigger>
                            <SelectContent>
                                {subjects.map((subj) => (
                                    <SelectItem key={subj.id} value={String(subj.id)}>
                                        {subj.code} — {subj.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className={`mb-1 block ${LABEL_TEXT}`}>Date</label>
                        <Input type="date" value={selectedDate} onChange={(e) => handleDateChange(e.target.value)} className="w-48" />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => markAllAs('Present')}>
                            <CheckCircle className="mr-1 h-3 w-3 text-green-600" />
                            Mark All Present
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => markAllAs('Absent')}>
                            <UserX className="mr-1 h-3 w-3 text-red-600" />
                            Mark All Absent
                        </Button>
                    </div>
                    {hasChanges && (
                        <span className="text-sm font-medium text-amber-600">
                            {changes.size} unsaved change{changes.size !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-12 px-2 pt-6">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 shrink-0 text-blue-500" />
                        <span className="text-sm font-bold">{liveStats.total_students}</span>
                        <span className="text-xs text-gray-500">Total</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                        <span className="text-sm font-bold">{liveStats.present_count}</span>
                        <span className="text-xs text-gray-500">Present</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <UserX className="h-4 w-4 shrink-0 text-red-500" />
                        <span className="text-sm font-bold">{liveStats.absent_count}</span>
                        <span className="text-xs text-gray-500">Absent</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 shrink-0 text-yellow-500" />
                        <span className="text-sm font-bold">{liveStats.late_count}</span>
                        <span className="text-xs text-gray-500">Late</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{liveStats.attendance_rate !== null ? `${liveStats.attendance_rate}%` : '—'}</span>
                        <span className="text-xs text-gray-500">Rate</span>
                        {liveStats.excused_count > 0 && <span className="text-xs text-gray-400">({liveStats.excused_count} exc.)</span>}
                    </div>
                </div>

                {students.length > 0 ? (
                    <div className={`overflow-hidden ${CARD}`}>
                        <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 z-10 bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider whitespace-nowrap text-gray-500 uppercase">#</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider whitespace-nowrap text-gray-500 uppercase">Student ID</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider whitespace-nowrap text-gray-500 uppercase">Student Name</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium tracking-wider whitespace-nowrap text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider whitespace-nowrap text-gray-500 uppercase">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {students.map((student, index) => {
                                        const current = getCurrentValue(student);
                                        const isChanged = changes.has(student.enrollment_id);
                                        return (
                                            <tr
                                                key={student.enrollment_id}
                                                className={`${getStatusColor(current.status)} ${isChanged ? 'ring-1 ring-amber-300 ring-inset' : ''}`}
                                            >
                                                <td className="px-4 py-3 text-gray-400">{index + 1}</td>
                                                <td className="px-4 py-3 font-medium whitespace-nowrap text-gray-900">
                                                    {student.student_id_number || '—'}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="font-medium text-gray-900">
                                                        {student.last_name}, {student.first_name}
                                                    </span>
                                                    {student.middle_name && <span className="text-gray-500"> {student.middle_name.charAt(0)}.</span>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {STATUS_ICONS.map(({ status: s, icon: Icon, activeClass, title }) => (
                                                            <Tooltip key={s}>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleStatusChange(student.enrollment_id, student, s)}
                                                                        className={`rounded-full p-1.5 transition-colors ${
                                                                            current.status === s
                                                                                ? activeClass
                                                                                : 'text-gray-300 hover:bg-gray-100 hover:text-gray-500'
                                                                        }`}
                                                                    >
                                                                        <Icon className="h-5 w-5" />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>{title}</TooltipContent>
                                                            </Tooltip>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Input
                                                        type="text"
                                                        placeholder="Optional remarks..."
                                                        value={current.remarks}
                                                        onChange={(e) => handleRemarksChange(student.enrollment_id, student, e.target.value)}
                                                        className="h-8 text-xs"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className={`${CARD} p-12 text-center`}>
                        <Users className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className={`mt-4 ${SECTION_HEADING}`}>No students enrolled</h3>
                        <p className={`mt-2 ${BODY_TEXT}`}>No students are enrolled in this section yet.</p>
                    </div>
                )}

                {hasChanges && (
                    <div className="mt-4 flex items-center justify-end gap-4 rounded-lg border bg-amber-50 p-4 shadow-sm">
                        <span className="text-sm text-amber-700">
                            You have {changes.size} unsaved change{changes.size !== 1 ? 's' : ''}
                        </span>
                        <Button variant="outline" onClick={discardChanges} disabled={saving}>
                            Discard
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {saving ? 'Saving...' : 'Save Attendance'}
                        </Button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
