import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Building2, Calendar, Clock, Edit, MapPin, Trash2, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';

interface PersonalData {
    first_name: string;
    last_name: string;
    middle_name: string | null;
}

interface ApplicationInfo {
    id: number;
    application_number: string;
    personal_data: PersonalData;
}

interface Assignment {
    id: number;
    seat_number: string | null;
    status: string;
    assigned_at: string;
    application_info: ApplicationInfo;
}

interface Room {
    id: number;
    name: string;
    building: string | null;
    capacity: number;
    floor: string | null;
}

interface Schedule {
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

interface Props {
    schedule: Schedule;
}

export default function Show({ schedule }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Exam Schedules', href: '/exam-schedules' },
        { title: schedule.name, href: `/exam-schedules/${schedule.id}` },
    ];

    const { delete: destroy, processing } = useForm();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const confirmDelete = () => {
        destroy(`/exam-schedules/${schedule.id}`, {
            onSuccess: () => setShowDeleteDialog(false),
        });
    };

    const effectiveCapacity = schedule.examination_room?.capacity || 0;
    const assignedCount = schedule.applicant_assignments?.filter((a) => a.status !== 'cancelled').length || 0;
    const availableSlots = Math.max(0, effectiveCapacity - assignedCount);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour = h % 12 || 12;
        return `${hour}:${minutes} ${ampm}`;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'assigned':
                return <Badge variant="outline">Assigned</Badge>;
            case 'confirmed':
                return <Badge className="bg-blue-100 text-blue-800">Confirmed</Badge>;
            case 'attended':
                return <Badge className="bg-green-100 text-green-800">Attended</Badge>;
            case 'absent':
                return <Badge variant="destructive">Absent</Badge>;
            case 'cancelled':
                return <Badge variant="secondary">Cancelled</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={schedule.name} />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/exam-schedules" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Schedules
                    </Link>

                    <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-gray-900">{schedule.name}</h1>
                                <Badge className={schedule.is_active ? 'bg-green-100 text-green-800' : ''}>
                                    {schedule.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            <Badge variant="outline" className="mt-2">
                                {schedule.exam_type}
                            </Badge>
                        </div>

                        <div className="flex gap-2">
                            <Link href={`/exam-assignments/create?schedule_id=${schedule.id}`}>
                                <Button>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Assign Applicants
                                </Button>
                            </Link>
                            <Link href={`/exam-schedules/${schedule.id}/edit`}>
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

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Schedule Details */}
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                            <Calendar className="h-5 w-5" />
                            Schedule Details
                        </h2>

                        <dl className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Calendar className="mt-0.5 h-4 w-4 text-gray-400" />
                                <div>
                                    <dt className="text-sm text-gray-500">Date</dt>
                                    <dd className="font-medium text-gray-900">{formatDate(schedule.exam_date)}</dd>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Clock className="mt-0.5 h-4 w-4 text-gray-400" />
                                <div>
                                    <dt className="text-sm text-gray-500">Time</dt>
                                    <dd className="font-medium text-gray-900">
                                        {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                                    </dd>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="mt-0.5 h-4 w-4 text-gray-400" />
                                <div>
                                    <dt className="text-sm text-gray-500">Room</dt>
                                    <dd className="font-medium text-gray-900">
                                        {schedule.examination_room?.name}
                                        {schedule.examination_room?.building && (
                                            <span className="text-gray-500"> ({schedule.examination_room.building})</span>
                                        )}
                                    </dd>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Users className="mt-0.5 h-4 w-4 text-gray-400" />
                                <div>
                                    <dt className="text-sm text-gray-500">Capacity</dt>
                                    <dd className="font-medium text-gray-900">
                                        {assignedCount} / {effectiveCapacity} examinees
                                        <span className="ml-2 text-sm text-gray-500">({availableSlots} slots available)</span>
                                    </dd>
                                </div>
                            </div>
                        </dl>
                    </div>

                    {/* Assigned Applicants */}
                    <div className="rounded-lg border bg-white p-6 shadow-sm lg:col-span-2">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                                <Users className="h-5 w-5" />
                                Assigned Applicants ({assignedCount})
                            </h2>
                            <Link href={`/exam-assignments/create?schedule_id=${schedule.id}`}>
                                <Button size="sm">
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Add
                                </Button>
                            </Link>
                        </div>

                        {schedule.applicant_assignments && schedule.applicant_assignments.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-semibold text-gray-900">Application #</th>
                                            <th className="px-3 py-2 text-left font-semibold text-gray-900">Name</th>
                                            <th className="px-3 py-2 text-center font-semibold text-gray-900">Seat #</th>
                                            <th className="px-3 py-2 text-center font-semibold text-gray-900">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {schedule.applicant_assignments.map((assignment) => (
                                            <tr key={assignment.id} className="hover:bg-gray-50">
                                                <td className="px-3 py-2 font-medium text-gray-900">
                                                    {assignment.application_info?.application_number}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {assignment.application_info?.personal_data?.last_name},{' '}
                                                    {assignment.application_info?.personal_data?.first_name}
                                                    {assignment.application_info?.personal_data?.middle_name &&
                                                        ` ${assignment.application_info.personal_data.middle_name.charAt(0)}.`}
                                                </td>
                                                <td className="px-3 py-2 text-center">{assignment.seat_number || '—'}</td>
                                                <td className="px-3 py-2 text-center">{getStatusBadge(assignment.status)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <Users className="mx-auto h-12 w-12 text-gray-400" />
                                <p className="mt-2 text-gray-500">No applicants assigned yet.</p>
                                <Link href={`/exam-assignments/create?schedule_id=${schedule.id}`}>
                                    <Button className="mt-4" size="sm">
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Assign Applicants
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <ConfirmDialog
                open={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={confirmDelete}
                title="Delete Exam Schedule"
                description={`Are you sure you want to delete "${schedule.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                processingLabel="Deleting..."
                processing={processing}
            />
        </AppLayout>
    );
}
