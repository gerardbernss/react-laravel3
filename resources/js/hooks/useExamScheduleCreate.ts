import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

export function useExamScheduleCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        exam_type: 'Entrance Exam',
        exam_date: '',
        start_time: '',
        end_time: '',
        examination_room_id: '',
        is_active: true,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/admin/exam-schedules');
    };

    return { data, setData, processing, errors, handleSubmit };
}
