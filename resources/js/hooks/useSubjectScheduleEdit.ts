import { parseDays, WEEKDAY_CODES } from '@/lib/days';
import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

export interface ScheduleDetail {
    id: number;
    subject_id: number;
    block_section_id: number | null;
    days: string;
    time: string;
    room: string | null;
    code: string | null;
    teacher_id: number | null;
    subject: { id: number; code: string; name: string };
}

interface Params {
    schedule: ScheduleDetail;
}

/** Manage the subject schedule edit form, submitting to /admin/subject-schedules/{id}. */
export function useSubjectScheduleEdit({ schedule }: Params) {
    const { data, setData, put, processing, errors } = useForm({
        days: schedule.days,
        time: schedule.time,
        room: schedule.room ?? '',
        code: schedule.code ?? '',
        teacher_id: schedule.teacher_id,
        block_section_id: schedule.block_section_id,
    });

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
        put(`/admin/subject-schedules/${schedule.id}`);
    };

    return { data, setData, processing, errors, selectedDays, isDailySelected, toggleDay, toggleDaily, handleSubmit };
}
