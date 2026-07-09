import { router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export interface PersonalData {
    first_name: string;
    last_name: string;
    middle_name: string | null;
}

export interface ApplicationInfo {
    id: number;
    application_number: string;
    personal_data: PersonalData;
}

export interface Assignment {
    id: number;
    status: string;
    assigned_at: string;
    application_info: ApplicationInfo;
}

export interface AvailableApplicant {
    id: number;
    application_number: string;
    application_status: string;
    first_name: string;
    last_name: string;
    middle_name: string | null;
    assigned_to_schedule: string | null;
}

export interface Room {
    id: number;
    name: string;
    building: string | null;
    capacity: number;
    floor: string | null;
}

export interface Schedule {
    id: number;
    name: string;
    exam_type: string;
    exam_date: string;
    start_time: string;
    end_time: string;
    examination_room_id: number;
    is_active: boolean;
    created_at: string;
    examination_room: Room;
    applicant_assignments: Assignment[];
}

interface Params {
    schedule: Schedule;
    availableApplicants: AvailableApplicant[];
}

export function useExamScheduleShow({ schedule, availableApplicants }: Params) {
    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Exam Schedules', href: '/admin/exam-schedules' },
        { title: schedule.name, href: `/admin/exam-schedules/${schedule.id}` },
    ];

    const { delete: destroy, processing: deleting } = useForm();

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [removeDialog, setRemoveDialog] = useState<{ open: boolean; id: number; name: string }>({ open: false, id: 0, name: '' });
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [assignOpen, setAssignOpen] = useState(false);
    const [modalSearch, setModalSearch] = useState('');
    const [selected, setSelected] = useState<number[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [assignError, setAssignError] = useState<string | null>(null);

    const effectiveCapacity = schedule.examination_room?.capacity || 0;
    const assignedCount = (schedule.applicant_assignments ?? []).filter((a) => a.status !== 'cancelled').length;
    const availableSlots = Math.max(0, effectiveCapacity - assignedCount);
    const capacityPct = effectiveCapacity > 0 ? Math.min(100, Math.round((assignedCount / effectiveCapacity) * 100)) : 0;

    const filteredAssignments = useMemo(() => {
        return (schedule.applicant_assignments ?? []).filter((a) => {
            const q = search.toLowerCase();
            const num = (a.application_info?.application_number ?? '').toLowerCase();
            const name = `${a.application_info?.personal_data?.last_name ?? ''} ${a.application_info?.personal_data?.first_name ?? ''}`.toLowerCase();
            return (!q || num.includes(q) || name.includes(q)) && (!statusFilter || a.status === statusFilter);
        });
    }, [schedule.applicant_assignments, search, statusFilter]);

    const paginatedAssignments = useMemo(
        () => filteredAssignments.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [filteredAssignments, currentPage, pageSize],
    );

    const filteredAvailable = useMemo(() => {
        const q = modalSearch.toLowerCase();
        if (!q) return availableApplicants;
        return availableApplicants.filter(
            (a) => a.application_number.toLowerCase().includes(q) || `${a.last_name} ${a.first_name}`.toLowerCase().includes(q),
        );
    }, [availableApplicants, modalSearch]);

    const allSelected = filteredAvailable.length > 0 && filteredAvailable.every((a) => selected.includes(a.id));

    const confirmDelete = () => {
        destroy(`/admin/exam-schedules/${schedule.id}`, {
            onSuccess: () => setShowDeleteDialog(false),
        });
    };

    const confirmRemove = () => {
        destroy(`/admin/exam-assignments/${removeDialog.id}`, {
            onSuccess: () => setRemoveDialog({ open: false, id: 0, name: '' }),
        });
    };

    const toggleAll = () => {
        setAssignError(null);
        if (allSelected) {
            const filteredIds = new Set(filteredAvailable.map((a) => a.id));
            setSelected((prev) => prev.filter((id) => !filteredIds.has(id)));
        } else {
            setSelected((prev) => Array.from(new Set([...prev, ...filteredAvailable.map((a) => a.id)])));
        }
    };

    const toggle = (id: number) => {
        setAssignError(null);
        setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const handleAssign = () => {
        if (selected.length === 0) return;
        const conflicts = availableApplicants.filter((a) => selected.includes(a.id) && a.assigned_to_schedule);
        if (conflicts.length > 0) {
            const names = conflicts.map((a) => `${a.last_name}, ${a.first_name} → ${a.assigned_to_schedule}`).join('\n');
            setAssignError(
                `The following applicant${conflicts.length > 1 ? 's are' : ' is'} already assigned to another schedule:\n\n${names}\n\nRemove them from your selection before proceeding.`,
            );
            return;
        }
        setAssignError(null);
        setSubmitting(true);
        router.post(
            '/admin/exam-assignments/bulk',
            { applicant_ids: selected, exam_schedule_id: schedule.id },
            {
                onSuccess: () => {
                    setAssignOpen(false);
                    setSelected([]);
                    setModalSearch('');
                    setAssignError(null);
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const openAssign = () => {
        setSelected([]);
        setModalSearch('');
        setAssignError(null);
        setAssignOpen(true);
    };

    return {
        breadcrumbs,
        deleting,
        showDeleteDialog, setShowDeleteDialog,
        removeDialog, setRemoveDialog,
        search, setSearch,
        statusFilter, setStatusFilter,
        currentPage, setCurrentPage,
        pageSize, setPageSize,
        assignOpen, setAssignOpen,
        modalSearch, setModalSearch,
        selected,
        submitting,
        assignError,
        effectiveCapacity,
        assignedCount,
        availableSlots,
        capacityPct,
        filteredAssignments,
        paginatedAssignments,
        filteredAvailable,
        allSelected,
        confirmDelete,
        confirmRemove,
        toggleAll,
        toggle,
        handleAssign,
        openAssign,
    };
}
