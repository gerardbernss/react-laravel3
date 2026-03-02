import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Calendar, Loader2, MapPin, Search, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';

interface PersonalData {
    first_name: string;
    last_name: string;
    middle_name: string | null;
}

interface Applicant {
    id: number;
    application_number: string;
    application_status: string;
    year_level: string;
    personal_data: PersonalData;
}

interface PaginatedApplicants {
    data: Applicant[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Schedule {
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

interface Props {
    applicants: PaginatedApplicants;
    schedules: Schedule[];
    filters: {
        search?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Exam Assignments', href: '/exam-assignments' },
    { title: 'Assign Applicants', href: '/exam-assignments/create' },
];

export default function Create({ applicants, schedules, filters }: Props) {
    const [selectedApplicants, setSelectedApplicants] = useState<number[]>([]);
    const [selectedSchedule, setSelectedSchedule] = useState<string>('');

    const { post, processing } = useForm();

    const handleSearch = (value: string) => {
        router.get('/exam-assignments/create', { search: value || undefined }, { preserveState: true });
    };

    const toggleApplicant = (id: number) => {
        setSelectedApplicants((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
    };

    const selectAll = () => {
        const allIds = applicants.data.map((a) => a.id);
        setSelectedApplicants(allIds);
    };

    const clearSelection = () => {
        setSelectedApplicants([]);
    };

    const handleSubmit = () => {
        if (selectedApplicants.length === 0 || !selectedSchedule) {
            return;
        }

        router.post('/exam-assignments/bulk', {
            applicant_ids: selectedApplicants,
            exam_schedule_id: selectedSchedule,
        });
    };

    const selectedScheduleData = schedules.find((s) => s.id.toString() === selectedSchedule);

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour = h % 12 || 12;
        return `${hour}:${minutes} ${ampm}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Assign Applicants to Exam" />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/exam-assignments" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Assignments
                    </Link>
                    <h1 className="mt-2 text-3xl font-bold text-gray-900">Assign Applicants to Exam</h1>
                    <p className="mt-1 text-gray-600">Select applicants and assign them to an exam schedule</p>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Schedule Selection */}
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900">Select Exam Schedule</h2>

                        <div className="space-y-3">
                            {schedules.length > 0 ? (
                                schedules.map((schedule) => (
                                    <div
                                        key={schedule.id}
                                        onClick={() => setSelectedSchedule(schedule.id.toString())}
                                        className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                                            selectedSchedule === schedule.id.toString()
                                                ? 'border-primary bg-primary/5'
                                                : 'hover:border-gray-300'
                                        } ${schedule.available_slots === 0 ? 'opacity-50' : ''}`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900">{schedule.name}</p>
                                                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                                                    <Calendar className="h-3 w-3" />
                                                    {schedule.formatted_date}
                                                </div>
                                                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                                                    <MapPin className="h-3 w-3" />
                                                    {schedule.room_name}
                                                    {schedule.building && ` (${schedule.building})`}
                                                </div>
                                                <div className="mt-1 text-xs text-gray-400">
                                                    {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant={schedule.available_slots > 0 ? 'outline' : 'destructive'}>
                                                    {schedule.available_slots} slots
                                                </Badge>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {schedule.assigned_count}/{schedule.capacity}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500">No available schedules.</p>
                            )}
                        </div>
                    </div>

                    {/* Applicant Selection */}
                    <div className="rounded-lg border bg-white p-6 shadow-sm lg:col-span-2">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Select Applicants</h2>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline">{selectedApplicants.length} selected</Badge>
                                {selectedApplicants.length > 0 && (
                                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                                        Clear
                                    </Button>
                                )}
                                {applicants.data.length > 0 && (
                                    <Button variant="ghost" size="sm" onClick={selectAll}>
                                        Select All
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Search */}
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search by application # or name..."
                                defaultValue={filters.search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Applicant List */}
                        {applicants.data.length > 0 ? (
                            <div className="space-y-2">
                                {applicants.data.map((applicant) => (
                                    <div
                                        key={applicant.id}
                                        onClick={() => toggleApplicant(applicant.id)}
                                        className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                                            selectedApplicants.includes(applicant.id)
                                                ? 'border-primary bg-primary/5'
                                                : 'hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedApplicants.includes(applicant.id)}
                                                onChange={() => {}}
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {applicant.personal_data?.last_name}, {applicant.personal_data?.first_name}
                                                    {applicant.personal_data?.middle_name &&
                                                        ` ${applicant.personal_data.middle_name.charAt(0)}.`}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {applicant.application_number} • {applicant.year_level}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="outline">{applicant.application_status}</Badge>
                                    </div>
                                ))}

                                {/* Pagination */}
                                {applicants.last_page > 1 && (
                                    <div className="flex items-center justify-between border-t pt-3">
                                        <p className="text-sm text-gray-600">
                                            Page {applicants.current_page} of {applicants.last_page}
                                        </p>
                                        <div className="flex gap-1">
                                            {applicants.links.map((link, index) => (
                                                <Button
                                                    key={index}
                                                    variant={link.active ? 'default' : 'outline'}
                                                    size="sm"
                                                    disabled={!link.url}
                                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <Users className="mx-auto h-12 w-12 text-gray-400" />
                                <p className="mt-2 text-gray-500">
                                    {filters.search
                                        ? 'No applicants found matching your search.'
                                        : 'No applicants available for assignment.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Bar */}
                <div className="mt-6 flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm">
                    <div>
                        {selectedScheduleData && selectedApplicants.length > 0 && (
                            <p className="text-sm text-gray-600">
                                Assigning <span className="font-medium">{selectedApplicants.length}</span> applicant(s) to{' '}
                                <span className="font-medium">{selectedScheduleData.name}</span>
                                {selectedApplicants.length > selectedScheduleData.available_slots && (
                                    <span className="ml-2 text-red-600">
                                        (Warning: Only {selectedScheduleData.available_slots} slots available)
                                    </span>
                                )}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <Link href="/exam-assignments">
                            <Button variant="outline">Cancel</Button>
                        </Link>
                        <Button
                            onClick={handleSubmit}
                            disabled={
                                processing ||
                                selectedApplicants.length === 0 ||
                                !selectedSchedule ||
                                (selectedScheduleData && selectedApplicants.length > selectedScheduleData.available_slots)
                            }
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Assigning...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Assign {selectedApplicants.length} Applicant(s)
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
