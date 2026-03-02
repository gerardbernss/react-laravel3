import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

interface FacultyUser {
    id: number;
    name: string;
}

interface Subject {
    id: number;
    code: string;
    name: string;
    description: string | null;
    units: number;
    type: string;
    grade_level: string | null;
    semester: string | null;
    schedule: string | null;
    room: string | null;
    user_id: number | null;
    is_active: boolean;
}

interface Props {
    subject: Subject;
    facultyUsers: FacultyUser[];
}

const gradeLevels = [
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
];

const subjectTypes = ['Core', 'Major', 'Minor', 'Elective', 'Specialized'];
const semesters = ['First Semester', 'Second Semester', 'Summer', 'Full Year'];

export default function Edit({ subject, facultyUsers }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Subjects', href: '/subjects' },
        { title: subject.code, href: `/subjects/${subject.id}` },
        { title: 'Edit', href: `/subjects/${subject.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm({
        code: subject.code,
        name: subject.name,
        description: subject.description || '',
        units: subject.units,
        type: subject.type,
        grade_level: subject.grade_level || '',
        semester: subject.semester || '',
        schedule: subject.schedule || '',
        room: subject.room || '',
        user_id: subject.user_id as number | null,
        is_active: subject.is_active,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/subjects/${subject.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${subject.code}`} />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/subjects" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Subjects
                    </Link>
                    <h1 className="mt-2 text-3xl font-bold text-gray-900">Edit Subject</h1>
                    <p className="mt-1 text-gray-600">
                        Editing: <span className="font-medium">{subject.code} - {subject.name}</span>
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="max-w-2xl">
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <div className="grid gap-6">
                            {/* Code and Name */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="code">Subject Code *</Label>
                                    <Input
                                        id="code"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                        placeholder="e.g., MATH101"
                                        className="mt-1"
                                    />
                                    <InputError message={errors.code} className="mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="name">Subject Name *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g., Mathematics"
                                        className="mt-1"
                                    />
                                    <InputError message={errors.name} className="mt-1" />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Brief description of the subject..."
                                    className="mt-1"
                                    rows={3}
                                />
                                <InputError message={errors.description} className="mt-1" />
                            </div>

                            {/* Units and Type */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="units">Units *</Label>
                                    <Input
                                        id="units"
                                        type="number"
                                        min={1}
                                        max={10}
                                        value={data.units}
                                        onChange={(e) => setData('units', parseInt(e.target.value) || 1)}
                                        className="mt-1"
                                    />
                                    <InputError message={errors.units} className="mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="type">Subject Type *</Label>
                                    <Select value={data.type} onValueChange={(v) => setData('type', v)}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {subjectTypes.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.type} className="mt-1" />
                                </div>
                            </div>

                            {/* Grade Level and Semester */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="grade_level">Grade Level</Label>
                                    <Select
                                        value={data.grade_level}
                                        onValueChange={(v) => setData('grade_level', v)}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select grade level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {gradeLevels.map((level) => (
                                                <SelectItem key={level} value={level}>
                                                    {level}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.grade_level} className="mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="semester">Semester</Label>
                                    <Select value={data.semester} onValueChange={(v) => setData('semester', v)}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select semester" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {semesters.map((sem) => (
                                                <SelectItem key={sem} value={sem}>
                                                    {sem}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.semester} className="mt-1" />
                                </div>
                            </div>

                            {/* Schedule and Room */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="schedule">Schedule</Label>
                                    <Input
                                        id="schedule"
                                        value={data.schedule}
                                        onChange={(e) => setData('schedule', e.target.value)}
                                        placeholder="e.g., MWF 8:00 AM - 9:00 AM"
                                        className="mt-1"
                                    />
                                    <InputError message={errors.schedule} className="mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="room">Room</Label>
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

                            {/* Faculty */}
                            <div>
                                <Label htmlFor="user_id">Faculty</Label>
                                <Select
                                    value={data.user_id?.toString() ?? '__none__'}
                                    onValueChange={(v) => setData('user_id', v === '__none__' ? null : parseInt(v))}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Assign faculty" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">— No faculty assigned —</SelectItem>
                                        {facultyUsers.map((u) => (
                                            <SelectItem key={u.id} value={u.id.toString()}>
                                                {u.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.user_id} className="mt-1" />
                            </div>

                            {/* Active Status */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="is_active" className="cursor-pointer">
                                    Active (Subject is available for enrollment)
                                </Label>
                            </div>
                        </div>

                        {/* Actions */}
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
                            <Link href="/subjects">
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
