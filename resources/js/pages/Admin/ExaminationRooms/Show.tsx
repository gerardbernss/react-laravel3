import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Building2, Calendar, Edit, Trash2, Users } from 'lucide-react';
import { useState } from 'react';

interface ExamSchedule {
    id: number;
    name: string;
    exam_date: string;
    start_time: string;
    end_time: string;
}

interface Room {
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

interface Props {
    room: Room;
}

export default function Show({ room }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Examination Rooms', href: '/examination-rooms' },
        { title: room.name, href: `/examination-rooms/${room.id}` },
    ];

    const { delete: destroy, processing } = useForm();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const confirmDelete = () => {
        destroy(`/examination-rooms/${room.id}`, {
            onSuccess: () => setShowDeleteDialog(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={room.name} />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/examination-rooms" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Rooms
                    </Link>

                    <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-gray-900">{room.name}</h1>
                                <Badge className={room.is_active ? 'bg-green-100 text-green-800' : ''}>
                                    {room.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            {room.building && <p className="mt-1 text-xl text-gray-600">{room.building}</p>}
                        </div>

                        <div className="flex gap-2">
                            <Link href={`/examination-rooms/${room.id}/edit`}>
                                <Button variant="outline">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} disabled={processing}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Room Details */}
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                            <Building2 className="h-5 w-5" />
                            Room Details
                        </h2>

                        <dl className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                <dt className="text-sm text-gray-500">Room Name</dt>
                                <dd className="text-sm font-medium text-gray-900">{room.name}</dd>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <dt className="text-sm text-gray-500">Building</dt>
                                <dd className="text-sm font-medium text-gray-900">{room.building || '—'}</dd>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <dt className="text-sm text-gray-500">Floor</dt>
                                <dd className="text-sm font-medium text-gray-900">{room.floor || '—'}</dd>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <dt className="text-sm text-gray-500">Capacity</dt>
                                <dd className="text-sm font-medium text-gray-900">
                                    <span className="inline-flex items-center gap-1">
                                        <Users className="h-4 w-4" />
                                        {room.capacity} examinees
                                    </span>
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* Recent Exam Schedules */}
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                            <Calendar className="h-5 w-5" />
                            Recent Exam Schedules ({room.exam_schedules?.length || 0})
                        </h2>

                        {room.exam_schedules && room.exam_schedules.length > 0 ? (
                            <div className="space-y-3">
                                {room.exam_schedules.map((schedule) => (
                                    <div key={schedule.id} className="rounded-lg border p-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900">{schedule.name}</p>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(schedule.exam_date).toLocaleDateString()} • {schedule.start_time} - {schedule.end_time}
                                                </p>
                                            </div>
                                            <Link href={`/exam-schedules/${schedule.id}`}>
                                                <Button variant="ghost" size="sm">
                                                    View
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500">No exam schedules in this room yet.</p>
                        )}
                    </div>
                </div>
            </div>
            <ConfirmDialog
                open={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={confirmDelete}
                title="Delete Examination Room"
                description={`Are you sure you want to delete "${room.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                processingLabel="Deleting..."
                processing={processing}
            />
        </AppLayout>
    );
}
