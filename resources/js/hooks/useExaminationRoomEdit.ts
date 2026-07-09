import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

export interface Room {
    id: number;
    name: string;
    building: string | null;
    capacity: number;
    floor: string | null;
    is_active: boolean;
}

interface Params {
    room: Room;
}

/** Manage the examination room edit form, PUTting to /admin/examination-rooms/:id. */
export function useExaminationRoomEdit({ room }: Params) {
    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Examination Rooms', href: '/admin/examination-rooms' },
        { title: room.name, href: `/admin/examination-rooms/${room.id}` },
        { title: 'Edit', href: `/admin/examination-rooms/${room.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: room.name,
        building: room.building ?? '',
        capacity: room.capacity,
        floor: room.floor ?? '',
        is_active: room.is_active,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(`/admin/examination-rooms/${room.id}`);
    };

    return { breadcrumbs, data, setData, processing, errors, handleSubmit };
}
