import { router } from '@inertiajs/react';
import { useCallback, useRef, useState } from 'react';

export interface PersonalData {
    first_name: string;
    last_name: string;
    middle_name: string | null;
}

export interface Applicant {
    id: number;
    application_number: string;
    application_status: string;
    year_level: string;
    personal_data: PersonalData;
}

export interface PaginatedApplicants {
    data: Applicant[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

export interface Schedule {
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

interface Params {
    applicants: PaginatedApplicants;
    schedules: Schedule[];
}

export function useExamAssignmentCreate({ applicants, schedules }: Params) {
    const [selectedApplicants, setSelectedApplicants] = useState<number[]>([]);
    const [selectedSchedule, setSelectedSchedule] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearch = useCallback((value: string) => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            router.get('/admin/exam-assignments/create', { search: value || undefined }, { preserveState: true, replace: true });
        }, 300);
    }, []);

    const toggleApplicant = (id: number) => {
        setSelectedApplicants((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
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
            '/admin/exam-assignments/bulk',
            { applicant_ids: selectedApplicants, exam_schedule_id: selectedSchedule },
            { onFinish: () => setSubmitting(false) },
        );
    };

    const selectedScheduleData = schedules.find((s) => s.id.toString() === selectedSchedule);
    const overCapacity =
        selectedScheduleData !== undefined && selectedApplicants.length > selectedScheduleData.available_slots;
    const activeStep = !selectedSchedule ? 1 : selectedApplicants.length === 0 ? 2 : 3;

    return {
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
    };
}
