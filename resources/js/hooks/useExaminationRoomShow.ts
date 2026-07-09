import { useForm } from '@inertiajs/react';
import { useState } from 'react';

export interface ExamSchedule {
    id: number;
    name: string;
    exam_date: string;
    start_time: string;
    end_time: string;
}

export interface Room {
    id: number;
    name: string;
    building: string | null;
    capacity: number;
    floor: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    exam_schedules: ExamSchedule[];
}

interface Params {
    room: Room;
}

/** Manage the examination room detail page, including delete confirmation dialog. */
export function useExaminationRoomShow({ room }: Params) {
    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Examination Rooms', href: '/admin/examination-rooms' },
        { title: room.name, href: `/admin/examination-rooms/${room.id}` },
    ];

    const { delete: destroy, processing } = useForm();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const confirmDelete = () => {
        destroy(`/admin/examination-rooms/${room.id}`, {
            onSuccess: () => setShowDeleteDialog(false),
        });
    };

    return { breadcrumbs, processing, showDeleteDialog, setShowDeleteDialog, confirmDelete };
}
