import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BODY_TEXT, CARD, LABEL_TEXT, PAGE_PADDING, PAGE_TITLE } from '@/constants/ui';
import { type ScheduleDetail, useSubjectScheduleEdit } from '@/hooks/useSubjectScheduleEdit';
import AppLayout from '@/layouts/app-layout';
import { DAY_OPTIONS } from '@/lib/days';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

interface BlockSectionOption {
    id: number;
    code: string;
    name: string;
}

interface FacultyUser {
    id: number;
    name: string;
}

interface Props {
    schedule: ScheduleDetail;
    blockSections: BlockSectionOption[];
    canUnassign: boolean;
    facultyUsers: FacultyUser[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Subject Schedules', href: '/admin/subject-schedules' },
    { title: 'Edit', href: '#' },
];

/** Admin schedule edit form — update days/time/room/code and which block section (if any) this schedule belongs to. */
export default function Edit({ schedule, blockSections, canUnassign, facultyUsers }: Props) {
    const {
        data,
        processing,
        errors,
        selectedDays,
        isDailySelected,
        toggleDay,
        toggleDaily,
        setData,
        handleSubmit,
    } = useSubjectScheduleEdit({ schedule });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Schedule - ${schedule.subject.code}`} />

            <div className={PAGE_PADDING}>
                <div className="mb-6">
                    <Link href="/admin/subject-schedules" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Subject Schedules
                    </Link>
                    <h1 className={`mt-2 ${PAGE_TITLE}`}>Edit Schedule</h1>
                    <p className={`mt-1 ${BODY_TEXT}`}>{schedule.subject.code} — {schedule.subject.name}</p>
                </div>

                <form onSubmit={handleSubmit} className="max-w-2xl">
                    <div className={`${CARD} p-6`}>
                        <div className="grid gap-6">
                            <div>
                                <Label className={LABEL_TEXT}>Block Section</Label>
                                <Select
                                    value={data.block_section_id?.toString() ?? '__default__'}
                                    onValueChange={(v) => setData('block_section_id', v === '__default__' ? null : parseInt(v))}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select a block section" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {canUnassign && <SelectItem value="__default__">— Default (no section) —</SelectItem>}
                                        {blockSections.map((section) => (
                                            <SelectItem key={section.id} value={section.id.toString()}>
                                                {section.code} — {section.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.block_section_id} className="mt-1" />
                            </div>

                            <div>
                                <Label className={LABEL_TEXT}>Days</Label>
                                <div className="mt-1 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={toggleDaily}
                                        className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                                            isDailySelected
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        Daily
                                    </button>
                                    {DAY_OPTIONS.map((day) => (
                                        <button
                                            key={day.code}
                                            type="button"
                                            title={day.fullName}
                                            onClick={() => toggleDay(day.code)}
                                            className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                                                selectedDays.includes(day.code)
                                                    ? 'border-primary bg-primary text-primary-foreground'
                                                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            {day.code}
                                        </button>
                                    ))}
                                </div>
                                <InputError message={errors.days} className="mt-1" />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="time" className={LABEL_TEXT}>Time *</Label>
                                    <Input
                                        id="time"
                                        value={data.time}
                                        onChange={(e) => setData('time', e.target.value)}
                                        placeholder="e.g., 07:30-08:30"
                                        className="mt-1"
                                    />
                                    <InputError message={errors.time} className="mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="room" className={LABEL_TEXT}>Room</Label>
                                    <Input
                                        id="room"
                                        value={data.room}
                                        onChange={(e) => setData('room', e.target.value)}
                                        placeholder="e.g., Room 201"
                                        className="mt-1"
                                    />
                                    <InputError message={errors.room} className="mt-1" />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="code" className={LABEL_TEXT}>Code</Label>
                                <Input
                                    id="code"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value.slice(0, 1))}
                                    placeholder="e.g., A"
                                    maxLength={1}
                                    className="mt-1 w-20"
                                />
                                <InputError message={errors.code} className="mt-1" />
                            </div>

                            <div>
                                <Label htmlFor="teacher_id" className={LABEL_TEXT}>Teacher</Label>
                                <Select
                                    value={data.teacher_id?.toString() ?? '__none__'}
                                    onValueChange={(v) => setData('teacher_id', v === '__none__' ? null : parseInt(v))}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Assign teacher" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">— No teacher assigned —</SelectItem>
                                        {facultyUsers.map((u) => (
                                            <SelectItem key={u.id} value={u.id.toString()}>
                                                {u.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.teacher_id} className="mt-1" />
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
                            <Link href="/admin/subject-schedules">
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
