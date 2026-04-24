import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, Calendar, CheckCircle2, Clock, Loader2, MapPin, Search, UserPlus, Users, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

interface PersonalData {
    first_name: string;
    last_name: string;
    middle_name: string | null;
}

interface Applicant {
    id: number;
    application_number: string;
    application_status: string;
    year_level: string;
    personal_data: PersonalData;
}

interface PaginatedApplicants {
    data: Applicant[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Schedule {
    id: number;
    name: string;
    exam_type: string;
    exam_date: string;
    formatted_date: string;
    start_time: string;
    end_time: string;
    room_name: string;
    building: string | null;
    capacity: number;
    assigned_count: number;
    available_slots: number;
}

interface Props {
    applicants: PaginatedApplicants;
    schedules: Schedule[];
    filters: {
        search?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Exam Assignments', href: '/exam-assignments' },
    { title: 'Assign Applicants', href: '/exam-assignments/create' },
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

export default function Create({ applicants, schedules, filters }: Props) {
    const [selectedApplicants, setSelectedApplicants] = useState<number[]>([]);
    const [selectedSchedule, setSelectedSchedule] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearch = useCallback((value: string) => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            router.get('/exam-assignments/create', { search: value || undefined }, { preserveState: true, replace: true });
        }, 300);
    }, []);

    const toggleApplicant = (id: number) => {
        setSelectedApplicants((prev) =>
            prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
        );
    };

    const selectAllOnPage = () => {
        const pageIds = applicants.data.map((a) => a.id);
        setSelectedApplicants((prev) => Array.from(new Set([...prev, ...pageIds])));
    };

    const clearSelection = () => setSelectedApplicants([]);

    const handleSubmit = () => {
        if (selectedApplicants.length === 0 || !selectedSchedule) return;
        setSubmitting(true);
        router.post(
            '/exam-assignments/bulk',
            { applicant_ids: selectedApplicants, exam_schedule_id: selectedSchedule },
            { onFinish: () => setSubmitting(false) },
        );
    };

    const selectedScheduleData = schedules.find((s) => s.id.toString() === selectedSchedule);
    const overCapacity =
        selectedScheduleData !== undefined &&
        selectedApplicants.length > selectedScheduleData.available_slots;

    // Derive active step for the progress indicator
    const activeStep = !selectedSchedule ? 1 : selectedApplicants.length === 0 ? 2 : 3;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Assign Applicants to Exam" />

            <div className="flex flex-col gap-6 p-6 md:p-10">
                {/* Header */}
                <div>
                    <Link
                        href="/exam-assignments"
                        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Assignments
                    </Link>
                    <h1 className="mt-2 text-3xl font-bold text-gray-900">Assign Applicants to Exam</h1>
                </div>

                {/* Step indicator */}
                <div className="flex items-center gap-2 text-sm">
                    {(['Select a schedule', 'Select applicants', 'Confirm & assign'] as const).map(
                        (label, i) => {
                            const step = i + 1;
                            const done = activeStep > step;
                            const active = activeStep === step;
                            return (
                                <div key={step} className="flex items-center gap-2">
                                    <div
                                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                                            done
                                                ? 'bg-green-500 text-white'
                                                : active
                                                  ? 'bg-primary text-white'
                                                  : 'bg-gray-200 text-gray-500'
                                        }`}
                                    >
                                        {done ? <CheckCircle2 className="h-4 w-4" /> : step}
                                    </div>
                                    <span className={active ? 'font-medium text-gray-900' : 'text-gray-400'}>
                                        {label}
                                    </span>
                                    {step < 3 && <span className="text-gray-300">›</span>}
                                </div>
                            );
                        },
                    )}
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* ── Schedule Selection ── */}
                    <div className="rounded-lg border bg-white shadow-sm">
                        <div className="border-b px-5 py-4">
                            <h2 className="font-semibold text-gray-900">
                                Exam Schedules
                                <span className="ml-2 text-sm font-normal text-gray-500">
                                    ({schedules.length})
                                </span>
                            </h2>
                        </div>

                        <div className="space-y-2 p-4">
                            {schedules.length > 0 ? (
                                schedules.map((schedule) => {
                                    const isFull = schedule.available_slots === 0;
                                    const past = isPast(schedule.exam_date);
                                    const pct = Math.min(
                                        100,
                                        Math.round(
                                            (schedule.assigned_count / schedule.capacity) * 100,
                                        ),
                                    );
                                    const selected = selectedSchedule === schedule.id.toString();

                                    return (
                                        <div
                                            key={schedule.id}
                                            onClick={() =>
                                                !isFull &&
                                                setSelectedSchedule(
                                                    selected ? '' : schedule.id.toString(),
                                                )
                                            }
                                            className={`rounded-lg border p-3 transition-colors ${
                                                isFull
                                                    ? 'cursor-not-allowed opacity-50'
                                                    : 'cursor-pointer'
                                            } ${
                                                selected
                                                    ? 'border-primary bg-primary/5'
                                                    : 'hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            {/* Name + type badge */}
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm font-medium leading-tight text-gray-900">
                                                    {schedule.name}
                                                </p>
                                                <span
                                                    className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                                                        EXAM_TYPE_COLORS[schedule.exam_type] ??
                                                        'bg-gray-100 text-gray-600'
                                                    }`}
                                                >
                                                    {schedule.exam_type}
                                                </span>
                                            </div>

                                            {/* Date + room */}
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
                                                    {formatTime(schedule.start_time)} –{' '}
                                                    {formatTime(schedule.end_time)}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                    <MapPin className="h-3 w-3 shrink-0" />
                                                    {schedule.room_name}
                                                    {schedule.building && ` · ${schedule.building}`}
                                                </div>
                                            </div>

                                            {/* Capacity bar */}
                                            <div className="mt-2">
                                                <div className="mb-1 flex items-center justify-between text-[11px] text-gray-500">
                                                    <span>
                                                        {schedule.assigned_count}/{schedule.capacity}{' '}
                                                        assigned
                                                    </span>
                                                    {isFull ? (
                                                        <span className="font-medium text-red-600">Full</span>
                                                    ) : (
                                                        <span className="font-medium text-green-600">
                                                            {schedule.available_slots} open
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${
                                                            pct >= 100
                                                                ? 'bg-red-500'
                                                                : pct >= 75
                                                                  ? 'bg-amber-400'
                                                                  : 'bg-green-500'
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
                                    <p className="mt-2 text-sm text-gray-500">No exam schedules found.</p>
                                    <Link href="/exam-schedules/create">
                                        <Button variant="outline" size="sm" className="mt-3">
                                            Create a schedule
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Applicant Selection ── */}
                    <div className="flex flex-col rounded-lg border bg-white shadow-sm lg:col-span-2">
                        <div className="border-b px-5 py-4">
                            <div className="flex items-center justify-between">
                                <h2 className="font-semibold text-gray-900">
                                    Applicants
                                    <span className="ml-2 text-sm font-normal text-gray-500">
                                        ({applicants.total} available)
                                    </span>
                                </h2>
                                <div className="flex items-center gap-2">
                                    {selectedApplicants.length > 0 && (
                                        <>
                                            <Badge className="bg-primary/10 text-primary">
                                                {selectedApplicants.length} selected
                                            </Badge>
                                            <button
                                                onClick={clearSelection}
                                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                                            >
                                                <X className="h-3 w-3" />
                                                Clear
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Selected schedule banner */}
                        {selectedScheduleData && (
                            <div className="flex items-center justify-between border-b bg-primary/5 px-5 py-2.5 text-sm">
                                <span className="text-gray-700">
                                    Assigning to:{' '}
                                    <span className="font-medium text-gray-900">
                                        {selectedScheduleData.name}
                                    </span>{' '}
                                    <span className="text-gray-500">
                                        · {selectedScheduleData.available_slots} slots open
                                    </span>
                                </span>
                                <button
                                    onClick={() => setSelectedSchedule('')}
                                    className="text-xs text-gray-400 hover:text-gray-600"
                                >
                                    Change
                                </button>
                            </div>
                        )}

                        <div className="flex-1 p-5">
                            {/* Search + select all */}
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

                            {/* List */}
                            {applicants.data.length > 0 ? (
                                <div className="space-y-2">
                                    {applicants.data.map((applicant) => {
                                        const checked = selectedApplicants.includes(applicant.id);
                                        return (
                                            <div
                                                key={applicant.id}
                                                onClick={() => toggleApplicant(applicant.id)}
                                                className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                                                    checked
                                                        ? 'border-primary bg-primary/5'
                                                        : 'hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                                                            checked
                                                                ? 'border-primary bg-primary'
                                                                : 'border-gray-300'
                                                        }`}
                                                    >
                                                        {checked && (
                                                            <svg
                                                                className="h-3 w-3 text-white"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                                strokeWidth={3}
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    d="M5 13l4 4L19 7"
                                                                />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {applicant.personal_data?.last_name},{' '}
                                                            {applicant.personal_data?.first_name}
                                                            {applicant.personal_data?.middle_name &&
                                                                ` ${applicant.personal_data.middle_name.charAt(0)}.`}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {applicant.application_number} ·{' '}
                                                            {applicant.year_level}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="text-xs">
                                                    {applicant.application_status}
                                                </Badge>
                                            </div>
                                        );
                                    })}

                                    {/* Pagination */}
                                    {applicants.last_page > 1 && (
                                        <div className="flex items-center justify-between border-t pt-3">
                                            <p className="text-sm text-gray-500">
                                                Page {applicants.current_page} of {applicants.last_page}
                                            </p>
                                            <div className="flex gap-1">
                                                {applicants.links.map((link, index) => (
                                                    <Button
                                                        key={index}
                                                        variant={link.active ? 'default' : 'outline'}
                                                        size="sm"
                                                        disabled={!link.url}
                                                        onClick={() =>
                                                            link.url &&
                                                            router.get(link.url, {}, { preserveState: true })
                                                        }
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
                                    <p className="mt-2 text-sm text-gray-500">
                                        {filters.search
                                            ? 'No applicants match your search.'
                                            : 'All applicants have already been assigned to an exam.'}
                                    </p>
                                    {filters.search && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-3"
                                            onClick={() =>
                                                router.get(
                                                    '/exam-assignments/create',
                                                    {},
                                                    { preserveState: true, replace: true },
                                                )
                                            }
                                        >
                                            Clear search
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Action bar ── */}
                <div className="sticky bottom-4 rounded-lg border bg-white px-5 py-4 shadow-lg">
                    <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            {!selectedSchedule && (
                                <p className="text-sm text-gray-500">
                                    ← Pick an exam schedule on the left to get started.
                                </p>
                            )}
                            {selectedSchedule && selectedApplicants.length === 0 && (
                                <p className="text-sm text-gray-500">
                                    Schedule selected. Now tick the applicants you want to assign.
                                </p>
                            )}
                            {selectedSchedule && selectedApplicants.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {selectedApplicants.length} applicant
                                        {selectedApplicants.length !== 1 ? 's' : ''} →{' '}
                                        {selectedScheduleData?.name}
                                    </p>
                                    {overCapacity && (
                                        <p className="mt-0.5 flex items-center gap-1 text-xs text-red-600">
                                            <AlertTriangle className="h-3 w-3" />
                                            Exceeds available slots ({selectedScheduleData?.available_slots}{' '}
                                            open). Reduce your selection.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex shrink-0 gap-3">
                            <Link href="/exam-assignments">
                                <Button variant="outline">Cancel</Button>
                            </Link>
                            <Button
                                onClick={handleSubmit}
                                disabled={
                                    submitting ||
                                    selectedApplicants.length === 0 ||
                                    !selectedSchedule ||
                                    overCapacity
                                }
                            >
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
