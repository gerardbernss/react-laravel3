import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

export interface Schedule {
    id: number;
    name: string;
    exam_type: string;
    exam_date: string;
    start_time: string;
    end_time: string;
    examination_room_id: number;
    is_active: boolean;
}

interface Params {
    schedule: Schedule;
}

export function useExamScheduleEdit({ schedule }: Params) {
    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Exam Schedules', href: '/exam-schedules' },
        { title: schedule.name, href: `/exam-schedules/${schedule.id}` },
        { title: 'Edit', href: `/exam-schedules/${schedule.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: schedule.name,
        exam_type: schedule.exam_type,
        exam_date: schedule.exam_date,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        examination_room_id: schedule.examination_room_id.toString(),
        is_active: schedule.is_active,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(`/exam-schedules/${schedule.id}`);
    };

    return { breadcrumbs, data, setData, processing, errors, handleSubmit };
}
