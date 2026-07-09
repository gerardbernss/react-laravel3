import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BODY_TEXT, CARD, LABEL_TEXT, PAGE_PADDING, PAGE_TITLE } from '@/constants/ui';
import { type Schedule, useExamScheduleEdit } from '@/hooks/useExamScheduleEdit';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

interface Room {
    id: number;
    name: string;
    building: string | null;
    capacity: number;
    floor: string | null;
}

interface Props {
    schedule: Schedule;
    rooms: Room[];
}

const examTypes = ['Entrance Exam', 'Placement Test', 'Qualifying Exam', 'Other'];

export default function Edit({ schedule, rooms }: Props) {
    const { breadcrumbs, data, setData, processing, errors, handleSubmit } = useExamScheduleEdit({ schedule });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${schedule.name}`} />

            <div className={PAGE_PADDING}>
                <div className="mb-6">
                    <Link href="/admin/exam-schedules" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Schedules
                    </Link>
                    <h1 className={`mt-2 ${PAGE_TITLE}`}>Edit Exam Schedule</h1>
                    <p className={`mt-1 ${BODY_TEXT}`}>
                        Editing: <span className="font-medium">{schedule.name}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="max-w-2xl">
                    <div className={`${CARD} p-6`}>
                        <div className="grid gap-6">
                            <div>
                                <Label htmlFor="name" className={LABEL_TEXT}>Schedule Name *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g., Entrance Exam Batch 1"
                                    className="mt-1"
                                />
                                <InputError message={errors.name} className="mt-1" />
                            </div>

                            <div>
                                <Label htmlFor="exam_type" className={LABEL_TEXT}>Exam Type *</Label>
                                <Select value={data.exam_type} onValueChange={(v) => setData('exam_type', v)}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select exam type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {examTypes.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.exam_type} className="mt-1" />
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <Label htmlFor="exam_date" className={LABEL_TEXT}>Exam Date *</Label>
                                    <Input
                                        id="exam_date"
                                        type="date"
                                        value={data.exam_date}
                                        onChange={(e) => setData('exam_date', e.target.value)}
                                        className="mt-1"
                                    />
                                    <InputError message={errors.exam_date} className="mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="start_time" className={LABEL_TEXT}>Start Time *</Label>
                                    <Input
                                        id="start_time"
                                        type="time"
                                        value={data.start_time}
                                        onChange={(e) => setData('start_time', e.target.value)}
                                        className="mt-1"
                                    />
                                    <InputError message={errors.start_time} className="mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="end_time" className={LABEL_TEXT}>End Time *</Label>
                                    <Input
                                        id="end_time"
                                        type="time"
                                        value={data.end_time}
                                        onChange={(e) => setData('end_time', e.target.value)}
                                        className="mt-1"
                                    />
                                    <InputError message={errors.end_time} className="mt-1" />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="examination_room_id" className={LABEL_TEXT}>Examination Room *</Label>
                                <Select value={data.examination_room_id} onValueChange={(v) => setData('examination_room_id', v)}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select a room" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {rooms.map((room) => (
                                            <SelectItem key={room.id} value={room.id.toString()}>
                                                {room.name} {room.building && `(${room.building})`} - Capacity: {room.capacity}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.examination_room_id} className="mt-1" />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="is_active" className={`cursor-pointer ${LABEL_TEXT}`}>
                                    Active (Schedule is available for applicant assignment)
                                </Label>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <Button type="submit" disabled={processing}>
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                            <Link href="/admin/exam-schedules">
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </Link>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
