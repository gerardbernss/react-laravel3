import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BODY_TEXT, CARD, PAGE_PADDING, PAGE_TITLE } from '@/constants/ui';
import {
    type Applicant,
    type PaginatedApplicants,
    type Schedule,
    useExamAssignmentCreate,
} from '@/hooks/useExamAssignmentCreate';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, Calendar, CheckCircle2, Clock, Loader2, MapPin, Search, UserPlus, Users, X } from 'lucide-react';

interface Props {
    applicants: PaginatedApplicants;
    schedules: Schedule[];
    filters: { search?: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Exam Assignments', href: '/admin/exam-assignments' },
    { title: 'Assign Applicants', href: '/admin/exam-assignments/create' },
];

const EXAM_TYPE_COLORS: Record<string, string> = {
    SHS: 'bg-blue-100 text-blue-700 border-blue-200',
    JHS: 'bg-green-100 text-green-700 border-green-200',
    LES: 'bg-orange-100 text-orange-700 border-orange-200',
};

function formatTime(time: string) {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${minutes} ${ampm}`;
}

function isPast(dateStr: string) {
    return new Date(dateStr) < new Date(new Date().toDateString());
}

/** Admin exam assignment create page — select a schedule and bulk-assign applicants from the filtered list. */
export default function Create({ applicants, schedules, filters }: Props) {
    const {
        selectedApplicants,
        selectedSchedule,
        setSelectedSchedule,
        submitting,
        handleSearch,
        toggleApplicant,
        selectAllOnPage,
        clearSelection,
        handleSubmit,
        selectedScheduleData,
        overCapacity,
        activeStep,
    } = useExamAssignmentCreate({ applicants, schedules });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Assign Applicants to Exam" />

            <div className={`flex flex-col gap-6 ${PAGE_PADDING}`}>
                <div>
                    <Link href="/admin/exam-assignments" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Assignments
                    </Link>
                    <h1 className={`mt-2 ${PAGE_TITLE}`}>Assign Applicants to Exam</h1>
                </div>

                <div className="flex items-center gap-2 text-sm">
                    {(['Select a schedule', 'Select applicants', 'Confirm & assign'] as const).map((label, i) => {
                        const step = i + 1;
                        const done = activeStep > step;
                        const active = activeStep === step;
                        return (
                            <div key={step} className="flex items-center gap-2">
                                <div
                                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                                        done ? 'bg-green-500 text-white' : active ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                                    }`}
                                >
                                    {done ? <CheckCircle2 className="h-4 w-4" /> : step}
                                </div>
                                <span className={active ? 'font-medium text-gray-900' : 'text-gray-400'}>{label}</span>
                                {step < 3 && <span className="text-gray-300">›</span>}
                            </div>
                        );
                    })}
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className={CARD}>
                        <div className="border-b px-5 py-4">
                            <h2 className="font-semibold text-gray-900">
                                Exam Schedules
                                <span className="ml-2 text-sm font-normal text-gray-500">({schedules.length})</span>
                            </h2>
                        </div>

                        <div className="space-y-2 p-4">
                            {schedules.length > 0 ? (
                                schedules.map((schedule: Schedule) => {
                                    const isFull = schedule.available_slots === 0;
                                    const past = isPast(schedule.exam_date);
                                    const pct = Math.min(100, Math.round((schedule.assigned_count / schedule.capacity) * 100));
                                    const selected = selectedSchedule === schedule.id.toString();

                                    return (
                                        <div
                                            key={schedule.id}
                                            onClick={() => !isFull && setSelectedSchedule(selected ? '' : schedule.id.toString())}
                                            className={`rounded-lg border p-3 transition-colors ${isFull ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${
                                                selected ? 'border-primary bg-primary/5' : 'hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm font-medium leading-tight text-gray-900">{schedule.name}</p>
                                                <span
                                                    className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                                                        EXAM_TYPE_COLORS[schedule.exam_type] ?? 'bg-gray-100 text-gray-600'
                                                    }`}
                                                >
                                                    {schedule.exam_type}
                                                </span>
                                            </div>

                                            <div className="mt-1.5 space-y-0.5">
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                    <Calendar className="h-3 w-3 shrink-0" />
                                                    <span>{schedule.formatted_date}</span>
                                                    {past && (
                                                        <span className="rounded bg-amber-100 px-1 text-[10px] font-medium text-amber-700">
                                                            Past
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                    <Clock className="h-3 w-3 shrink-0" />
                                                    {formatTime(schedule.start_time)} – {formatTime(schedule.end_time)}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                    <MapPin className="h-3 w-3 shrink-0" />
                                                    {schedule.room_name}
                                                    {schedule.building && ` · ${schedule.building}`}
                                                </div>
                                            </div>

                                            <div className="mt-2">
                                                <div className="mb-1 flex items-center justify-between text-[11px] text-gray-500">
                                                    <span>{schedule.assigned_count}/{schedule.capacity} assigned</span>
                                                    {isFull ? (
                                                        <span className="font-medium text-red-600">Full</span>
                                                    ) : (
                                                        <span className="font-medium text-green-600">{schedule.available_slots} open</span>
                                                    )}
                                                </div>
                                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${
                                                            pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-400' : 'bg-green-500'
                                                        }`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-10 text-center">
                                    <Calendar className="mx-auto h-10 w-10 text-gray-300" />
                                    <p className={`mt-2 ${BODY_TEXT}`}>No exam schedules found.</p>
                                    <Link href="/admin/exam-schedules/create">
                                        <Button variant="outline" size="sm" className="mt-3">
                                            Create a schedule
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={`flex flex-col ${CARD} lg:col-span-2`}>
                        <div className="border-b px-5 py-4">
                            <div className="flex items-center justify-between">
                                <h2 className="font-semibold text-gray-900">
                                    Applicants
                                    <span className="ml-2 text-sm font-normal text-gray-500">({applicants.total} available)</span>
                                </h2>
                                <div className="flex items-center gap-2">
                                    {selectedApplicants.length > 0 && (
                                        <>
                                            <Badge className="bg-primary/10 text-primary">{selectedApplicants.length} selected</Badge>
                                            <button onClick={clearSelection} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                                                <X className="h-3 w-3" />
                                                Clear
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {selectedScheduleData && (
                            <div className="flex items-center justify-between border-b bg-primary/5 px-5 py-2.5 text-sm">
                                <span className="text-gray-700">
                                    Assigning to:{' '}
                                    <span className="font-medium text-gray-900">{selectedScheduleData.name}</span>{' '}
                                    <span className="text-gray-500">· {selectedScheduleData.available_slots} slots open</span>
                                </span>
                                <button onClick={() => setSelectedSchedule('')} className="text-xs text-gray-400 hover:text-gray-600">
                                    Change
                                </button>
                            </div>
                        )}

                        <div className="flex-1 p-5">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        placeholder="Search by application # or name…"
                                        defaultValue={filters.search}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                {applicants.data.length > 0 && (
                                    <Button variant="outline" size="sm" onClick={selectAllOnPage}>
                                        Select page
                                    </Button>
                                )}
                            </div>

                            {applicants.data.length > 0 ? (
                                <div className="space-y-2">
                                    {applicants.data.map((applicant: Applicant) => {
                                        const checked = selectedApplicants.includes(applicant.id);
                                        return (
                                            <div
                                                key={applicant.id}
                                                onClick={() => toggleApplicant(applicant.id)}
                                                className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                                                    checked ? 'border-primary bg-primary/5' : 'hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                                                            checked ? 'border-primary bg-primary' : 'border-gray-300'
                                                        }`}
                                                    >
                                                        {checked && (
                                                            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {applicant.personal_data?.last_name}, {applicant.personal_data?.first_name}
                                                            {applicant.personal_data?.middle_name && ` ${applicant.personal_data.middle_name.charAt(0)}.`}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {applicant.application_number} · {applicant.year_level}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="text-xs">
                                                    {applicant.application_status}
                                                </Badge>
                                            </div>
                                        );
                                    })}

                                    {applicants.last_page > 1 && (
                                        <div className="flex items-center justify-between border-t pt-3">
                                            <p className={BODY_TEXT}>
                                                Page {applicants.current_page} of {applicants.last_page}
                                            </p>
                                            <div className="flex gap-1">
                                                {applicants.links.map((link, index) => (
                                                    <Button
                                                        key={index}
                                                        variant={link.active ? 'default' : 'outline'}
                                                        size="sm"
                                                        disabled={!link.url}
                                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="py-12 text-center">
                                    <Users className="mx-auto h-12 w-12 text-gray-300" />
                                    <p className={`mt-2 ${BODY_TEXT}`}>
                                        {filters.search ? 'No applicants match your search.' : 'All applicants have already been assigned to an exam.'}
                                    </p>
                                    {filters.search && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-3"
                                            onClick={() => router.get('/admin/exam-assignments/create', {}, { preserveState: true, replace: true })}
                                        >
                                            Clear search
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="sticky bottom-4 rounded-lg border bg-white px-5 py-4 shadow-lg">
                    <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            {!selectedSchedule && (
                                <p className={BODY_TEXT}>← Pick an exam schedule on the left to get started.</p>
                            )}
                            {selectedSchedule && selectedApplicants.length === 0 && (
                                <p className={BODY_TEXT}>Schedule selected. Now tick the applicants you want to assign.</p>
                            )}
                            {selectedSchedule && selectedApplicants.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {selectedApplicants.length} applicant{selectedApplicants.length !== 1 ? 's' : ''} → {selectedScheduleData?.name}
                                    </p>
                                    {overCapacity && (
                                        <p className="mt-0.5 flex items-center gap-1 text-xs text-red-600">
                                            <AlertTriangle className="h-3 w-3" />
                                            Exceeds available slots ({selectedScheduleData?.available_slots} open). Reduce your selection.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex shrink-0 gap-3">
                            <Link href="/admin/exam-assignments">
                                <Button variant="outline">Cancel</Button>
                            </Link>
                            <Button onClick={handleSubmit} disabled={submitting || selectedApplicants.length === 0 || !selectedSchedule || overCapacity}>
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Assigning…
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Assign{' '}
                                        {selectedApplicants.length > 0
                                            ? `${selectedApplicants.length} applicant${selectedApplicants.length !== 1 ? 's' : ''}`
                                            : 'applicants'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
