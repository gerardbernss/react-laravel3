import { useMemo, useState } from 'react';

export interface Subject {
    subject_code: string | null;
    subject_name: string | null;
    units: string | number;
    schedule: string | null;
    room: string | null;
    teacher: string | null;
    grade_status: string | null;
}

export interface ParsedSchedule {
    days: number[];
    start: number;
    end: number;
    startLabel: string;
    endLabel: string;
}

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const DAY_MAP: Record<string, number> = {
    Mo: 0, M: 0,
    Tu: 1, T: 1,
    W: 2,
    Th: 3,
    F: 4,
    Sa: 5, S: 5,
};

// Whole-string day codes matched verbatim before char-by-char tokenizer,
// since "Daily" has no per-character mapping and "MTWTHF" trips up "Th" lookup.
const DAY_CODE_MAP: Record<string, number[]> = {
    MWF:    [0, 2, 4],
    TTh:    [1, 3],
    Daily:  [0, 1, 2, 3, 4],
    MTWTHF: [0, 1, 2, 3, 4],
};

export const GRID_START_MIN = 7 * 60;
export const GRID_END_MIN   = 21 * 60;
export const PX_PER_HOUR    = 64;
export const GRID_HEIGHT    = ((GRID_END_MIN - GRID_START_MIN) / 60) * PX_PER_HOUR;

export const PALETTE = [
    'bg-blue-100 border-blue-400 text-blue-900',
    'bg-green-100 border-green-400 text-green-900',
    'bg-amber-100 border-amber-400 text-amber-900',
    'bg-purple-100 border-purple-400 text-purple-900',
    'bg-rose-100 border-rose-400 text-rose-900',
    'bg-cyan-100 border-cyan-400 text-cyan-900',
    'bg-orange-100 border-orange-400 text-orange-900',
    'bg-teal-100 border-teal-400 text-teal-900',
] as const;

export function parseSchedule(raw: string | null): ParsedSchedule | null {
    if (!raw) return null;
    const spaceIdx = raw.indexOf(' ');
    if (spaceIdx === -1) return null;

    const dayStr  = raw.slice(0, spaceIdx).trim();
    const timeStr = raw.slice(spaceIdx + 1).trim();

    const days: number[] = [];
    if (dayStr in DAY_CODE_MAP) {
        days.push(...DAY_CODE_MAP[dayStr]);
    } else {
        // Try two-char token first to avoid "T" consuming "Th"
        let i = 0;
        while (i < dayStr.length) {
            const two = dayStr.slice(i, i + 2);
            const one = dayStr.slice(i, i + 1);
            if (two in DAY_MAP) { days.push(DAY_MAP[two]); i += 2; }
            else if (one in DAY_MAP) { days.push(DAY_MAP[one]); i += 1; }
            else { i += 1; }
        }
    }

    if (days.length === 0) return null;

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

    return { days, start, end, startLabel: timeParts[0].trim(), endLabel: timeParts[1].trim() };
}

export function hourLabel(h: number): string {
    if (h === 0)  return '12 AM';
    if (h < 12)   return `${h} AM`;
    if (h === 12) return '12 PM';
    return `${h - 12} PM`;
}

export function useStudentSchedule(subjects: Subject[]) {
    const [view, setView] = useState<'table' | 'calendar'>('table');

    const parsed = useMemo(
        () => subjects.map((s, idx) => ({
            subject: s,
            idx,
            parsed: parseSchedule(s.schedule),
            color: PALETTE[idx % PALETTE.length],
        })),
        [subjects],
    );

    const unscheduled = useMemo(() => parsed.filter((p) => p.parsed === null), [parsed]);

    return { view, setView, parsed, unscheduled };
}
