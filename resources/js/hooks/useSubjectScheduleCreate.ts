import { parseDays, WEEKDAY_CODES } from '@/lib/days';
import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

export interface ScheduleSubjectOption {
    id: number;
    code: string;
    name: string;
}

export interface ScheduleBlockSectionOption {
    id: number;
    code: string;
    name: string;
}

interface Params {
    subjectBlockSections: Record<number, ScheduleBlockSectionOption[]>;
}

/** Manage the subject schedule create form, posting to /admin/subject-schedules. */
export function useSubjectScheduleCreate({ subjectBlockSections }: Params) {
    const { data, setData, post, processing, errors } = useForm({
        subject_id: null as number | null,
        days: '',
        time: '',
        room: '',
        code: '',
        teacher_id: null as number | null,
        block_section_ids: [] as number[],
    });

    const availableSections = data.subject_id ? (subjectBlockSections[data.subject_id] ?? []) : [];

    const handleSubjectChange = (v: string) => {
        setData((prev) => ({ ...prev, subject_id: v ? parseInt(v) : null, block_section_ids: [] }));
    };

    const toggleSection = (id: number) => {
        const next = data.block_section_ids.includes(id)
            ? data.block_section_ids.filter((s) => s !== id)
            : [...data.block_section_ids, id];
        setData('block_section_ids', next);
    };

    const selectedDays = parseDays(data.days);
    const isDailySelected = WEEKDAY_CODES.every((code) => selectedDays.includes(code));

    const toggleDay = (dayCode: string) => {
        const next = selectedDays.includes(dayCode) ? selectedDays.filter((c) => c !== dayCode) : [...selectedDays, dayCode];
        setData('days', WEEKDAY_CODES.filter((c) => next.includes(c)).join(''));
    };

    const toggleDaily = () => {
        setData('days', isDailySelected ? '' : WEEKDAY_CODES.join(''));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/admin/subject-schedules');
    };

    return {
        data,
        setData,
        processing,
        errors,
        availableSections,
        handleSubjectChange,
        toggleSection,
        selectedDays,
        isDailySelected,
        toggleDay,
        toggleDaily,
        handleSubmit,
    };
}
