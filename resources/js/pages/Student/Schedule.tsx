import StudentLayout from '@/layouts/student-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { CalendarDays, LayoutList } from 'lucide-react';
import { useState } from 'react';

interface Subject {
    subject_code: string | null;
    subject_name: string | null;
    units: string | number;
    schedule: string | null;
    room: string | null;
    teacher: string | null;
    grade_status: string | null;
}

interface Enrollment {
    school_year: string;
    semester: string;
    year_level: string;
    student_category: string | null;
    status: string | null;
}

interface Props {
    student: { id: number; username: string };
    enrollment: Enrollment | null;
    subjects: Subject[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

// Day abbreviation tokens → index into DAYS (0=Mon … 5=Sat).
// Two-char tokens are tried before single-char to avoid "T" eating "Th".
const DAY_MAP: Record<string, number> = {
    Mo: 0, M: 0,
    Tu: 1, T: 1,
    W: 2,
    Th: 3,
    F: 4,
    Sa: 5, S: 5,
};

// Calendar grid: 7 AM → 9 PM, 1 hour = 64 px
const GRID_START_MIN = 7 * 60;   // 420
const GRID_END_MIN   = 21 * 60;  // 1260
const PX_PER_HOUR    = 64;
const GRID_HEIGHT    = ((GRID_END_MIN - GRID_START_MIN) / 60) * PX_PER_HOUR; // 896

// 8-colour palette assigned by subject index
const PALETTE = [
    'bg-blue-100 border-blue-400 text-blue-900',
    'bg-green-100 border-green-400 text-green-900',
    'bg-amber-100 border-amber-400 text-amber-900',
    'bg-purple-100 border-purple-400 text-purple-900',
    'bg-rose-100 border-rose-400 text-rose-900',
    'bg-cyan-100 border-cyan-400 text-cyan-900',
    'bg-orange-100 border-orange-400 text-orange-900',
    'bg-teal-100 border-teal-400 text-teal-900',
] as const;

// ── Helper: parse schedule string ─────────────────────────────────────────────

interface ParsedSchedule {
    days: number[];      // indices into DAYS (0=Mon … 5=Sat)
    start: number;       // minutes since midnight
    end: number;
    startLabel: string;
    endLabel: string;
}

function parseSchedule(raw: string | null): ParsedSchedule | null {
    if (!raw) return null;

    const spaceIdx = raw.indexOf(' ');
    if (spaceIdx === -1) return null;

    const dayStr  = raw.slice(0, spaceIdx).trim();
    const timeStr = raw.slice(spaceIdx + 1).trim();

    // Tokenise day string: try two-char token first, then one-char
    const days: number[] = [];
    let i = 0;
    while (i < dayStr.length) {
        const two = dayStr.slice(i, i + 2);
        const one = dayStr.slice(i, i + 1);
        if (two in DAY_MAP) {
            days.push(DAY_MAP[two]);
            i += 2;
        } else if (one in DAY_MAP) {
            days.push(DAY_MAP[one]);
            i += 1;
        } else {
            i += 1; // skip unknown char
        }
    }

    if (days.length === 0) return null;

    // Parse "H:MM-H:MM" or "HH:MM-HH:MM"
    const timeParts = timeStr.split('-');
    if (timeParts.length !== 2) return null;

    const toMins = (t: string): number | null => {
        const parts = t.trim().split(':');
        if (parts.length !== 2) return null;
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (isNaN(h) || isNaN(m)) return null;
        return h * 60 + m;
    };

    const start = toMins(timeParts[0]);
    const end   = toMins(timeParts[1]);
    if (start === null || end === null || end <= start) return null;

    return {
        days,
        start,
        end,
        startLabel: timeParts[0].trim(),
        endLabel:   timeParts[1].trim(),
    };
}

// ── Hour label helper ─────────────────────────────────────────────────────────

function hourLabel(h: number): string {
    if (h === 0)  return '12 AM';
    if (h < 12)   return `${h} AM`;
    if (h === 12) return '12 PM';
    return `${h - 12} PM`;
}

// ── Breadcrumbs ───────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Schedule', href: '/student/schedule' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function Schedule({ enrollment, subjects }: Props) {
    const [view, setView] = useState<'table' | 'calendar'>('table');

    // Pre-parse schedules once so the calendar render is cheap
    const parsed = subjects.map((s, idx) => ({
        subject: s,
        idx,
        parsed: parseSchedule(s.schedule),
        color:  PALETTE[idx % PALETTE.length],
    }));

    const unscheduled = parsed.filter((p) => p.parsed === null);

    return (
        <StudentLayout breadcrumbs={breadcrumbs}>
            <Head title="Class Schedule" />

            <div className="space-y-6 p-4 md:p-6">

                {/* ── Page header with view toggle ── */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Class Schedule</h1>
                        {enrollment && (
                            <p className="mt-1 text-sm text-gray-500">
                                {enrollment.school_year} &mdash; {enrollment.semester} &mdash; {enrollment.year_level}
                            </p>
                        )}
                    </div>

                    {/* Toggle — only show when there is data */}
                    {enrollment && subjects.length > 0 && (
                        <div className="flex shrink-0 items-center overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                            <button
                                onClick={() => setView('table')}
                                title="Table view"
                                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                                    view === 'table'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                                <LayoutList className="h-4 w-4" />
                                <span className="hidden sm:inline">Table</span>
                            </button>
                            <div className="w-px self-stretch bg-gray-200" />
                            <button
                                onClick={() => setView('calendar')}
                                title="Calendar view"
                                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                                    view === 'calendar'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                                <CalendarDays className="h-4 w-4" />
                                <span className="hidden sm:inline">Calendar</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Empty states ── */}
                {!enrollment ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-center">
                        <CalendarDays className="mb-3 h-10 w-10 text-gray-400" />
                        <p className="text-sm font-medium text-gray-600">No enrollment record found.</p>
                        <p className="mt-1 text-xs text-gray-400">Your class schedule will appear here once you are enrolled.</p>
                    </div>
                ) : subjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-center">
                        <CalendarDays className="mb-3 h-10 w-10 text-gray-400" />
                        <p className="text-sm font-medium text-gray-600">No subjects loaded yet.</p>
                        <p className="mt-1 text-xs text-gray-400">Your subjects will appear here once they are assigned.</p>
                    </div>
                ) : view === 'table' ? (

                    /* ── Table view ─────────────────────────────────────────── */
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">#</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Subject Code</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Subject Name</th>
                                        <th className="px-4 py-3 text-center font-semibold text-gray-600">Units</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Schedule</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Room</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Teacher</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {subjects.map((subject, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                                            <td className="px-4 py-3 font-mono text-gray-800">{subject.subject_code ?? '—'}</td>
                                            <td className="px-4 py-3 text-gray-800">{subject.subject_name ?? '—'}</td>
                                            <td className="px-4 py-3 text-center text-gray-700">{subject.units}</td>
                                            <td className="px-4 py-3 text-gray-700">{subject.schedule ?? <span className="text-gray-400">TBA</span>}</td>
                                            <td className="px-4 py-3 text-gray-700">{subject.room ?? <span className="text-gray-400">TBA</span>}</td>
                                            <td className="px-4 py-3 text-gray-700">{subject.teacher ?? <span className="text-gray-400">TBA</span>}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="border-t border-gray-200 bg-gray-50">
                                    <tr>
                                        <td colSpan={3} className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                                            Total Units
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold text-gray-800">
                                            {subjects.reduce((sum, s) => sum + Number(s.units), 0)}
                                        </td>
                                        <td colSpan={3} />
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                ) : (

                    /* ── Calendar view ───────────────────────────────────────── */
                    <div className="space-y-4">
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <div className="overflow-x-auto">
                                <div className="min-w-[640px]">

                                    {/* Day-column headers */}
                                    <div className="flex border-b border-gray-200 bg-gray-50">
                                        {/* Time axis spacer */}
                                        <div className="w-14 shrink-0" />
                                        {DAYS.map((day) => (
                                            <div
                                                key={day}
                                                className="flex-1 border-l border-gray-200 py-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-500"
                                            >
                                                {day}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Grid body */}
                                    <div className="flex" style={{ height: GRID_HEIGHT }}>

                                        {/* Time axis */}
                                        <div className="relative w-14 shrink-0 border-r border-gray-200">
                                            {Array.from({ length: (GRID_END_MIN - GRID_START_MIN) / 60 }, (_, h) => (
                                                <div
                                                    key={h}
                                                    className="absolute right-0 flex w-full items-start justify-end pr-1"
                                                    style={{ top: h * PX_PER_HOUR }}
                                                >
                                                    <span className="text-[10px] leading-none text-gray-400 -translate-y-1/2">
                                                        {hourLabel(GRID_START_MIN / 60 + h)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Day columns */}
                                        {DAYS.map((day, dayIdx) => (
                                            <div
                                                key={day}
                                                className="relative flex-1 border-l border-gray-200"
                                            >
                                                {/* Hour grid lines */}
                                                {Array.from({ length: (GRID_END_MIN - GRID_START_MIN) / 60 }, (_, h) => (
                                                    <div
                                                        key={h}
                                                        className="absolute inset-x-0 border-t border-gray-100"
                                                        style={{ top: h * PX_PER_HOUR }}
                                                    />
                                                ))}

                                                {/* Subject blocks for this day */}
                                                {parsed.map(({ subject, idx, parsed: ps, color }) => {
                                                    if (!ps || !ps.days.includes(dayIdx)) return null;

                                                    const top    = ((ps.start - GRID_START_MIN) / 60) * PX_PER_HOUR;
                                                    const height = ((ps.end - ps.start) / 60) * PX_PER_HOUR;

                                                    // Clamp to grid bounds
                                                    if (top + height <= 0 || top >= GRID_HEIGHT) return null;

                                                    return (
                                                        <div
                                                            key={idx}
                                                            className={`absolute inset-x-0.5 overflow-hidden rounded border-l-4 px-1.5 py-1 text-[11px] leading-snug shadow-sm ${color}`}
                                                            style={{ top: Math.max(0, top), height: Math.min(height, GRID_HEIGHT - top) }}
                                                        >
                                                            <p className="truncate font-bold">{subject.subject_code ?? '—'}</p>
                                                            <p className="truncate opacity-80">{subject.subject_name ?? ''}</p>
                                                            {subject.room && (
                                                                <p className="truncate text-[10px] opacity-60">{subject.room}</p>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Unscheduled subjects */}
                        {unscheduled.length > 0 && (
                            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-4">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Unscheduled subjects
                                </p>
                                <ul className="space-y-1.5">
                                    {unscheduled.map(({ subject, idx, color }) => (
                                        <li key={idx} className="flex items-center gap-3 text-sm">
                                            <span className={`inline-block h-3 w-3 shrink-0 rounded-sm border-l-4 ${color}`} />
                                            <span className="font-mono text-gray-700">{subject.subject_code ?? '—'}</span>
                                            <span className="text-gray-600">{subject.subject_name ?? '—'}</span>
                                            <span className="ml-auto text-xs text-gray-400">TBA</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </StudentLayout>
    );
}
