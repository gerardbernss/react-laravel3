import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, Plus, Save, X } from 'lucide-react';
import { useState } from 'react';

interface Subject {
    id: number;
    code: string;
    name: string;
    units: number;
}

interface Props {
    subjects: Subject[];
}

interface SubjectAssignment {
    subject_id: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Block Sections', href: '/block-sections' },
    { title: 'Create', href: '/block-sections/create' },
];

const gradeLevels = [
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
];

const semesters = ['First Semester', 'Second Semester', 'Summer', 'Full Year'];

// Generate school years
const currentYear = new Date().getFullYear();
const schoolYears = Array.from({ length: 5 }, (_, i) => `${currentYear + i - 1}-${currentYear + i}`);

export default function Create({ subjects }: Props) {
    const [assignedSubjects, setAssignedSubjects] = useState<SubjectAssignment[]>([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        code: '',
        grade_level: '',
        school_year: schoolYears[1],
        semester: '',
        adviser: '',
        room: '',
        capacity: 40,
        schedule: '',
        is_active: true,
        subjects: [] as SubjectAssignment[],
    });

    const handleAddSubject = () => {
        if (!selectedSubjectId) return;

        const subjectId = parseInt(selectedSubjectId);
        if (assignedSubjects.some((s) => s.subject_id === subjectId)) {
            alert('This subject is already added.');
            return;
        }

        const updatedSubjects = [...assignedSubjects, { subject_id: subjectId }];
        setAssignedSubjects(updatedSubjects);
        setData('subjects', updatedSubjects);
        setSelectedSubjectId('');
    };

    const handleRemoveSubject = (subjectId: number) => {
        const updatedSubjects = assignedSubjects.filter((s) => s.subject_id !== subjectId);
        setAssignedSubjects(updatedSubjects);
        setData('subjects', updatedSubjects);
    };

    const getSubjectById = (id: number) => subjects.find((s) => s.id === id);

    const availableSubjects = subjects.filter(
        (s) => !assignedSubjects.some((assigned) => assigned.subject_id === s.id)
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/block-sections');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Block Section" />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/block-sections" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Block Sections
                    </Link>
                    <h1 className="mt-2 text-3xl font-bold text-gray-900">Create Block Section</h1>
                    <p className="mt-1 text-gray-600">Add a new block section with subjects</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Section Details */}
                        <div className="rounded-lg border bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-gray-900">Section Details</h2>

                            <div className="grid gap-4">
                                {/* Name and Code */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="name">Section Name *</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="e.g., Section A"
                                            className="mt-1"
                                        />
                                        <InputError message={errors.name} className="mt-1" />
                                    </div>
                                    <div>
                                        <Label htmlFor="code">Section Code *</Label>
                                        <Input
                                            id="code"
                                            value={data.code}
                                            onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                            placeholder="e.g., G7-A"
                                            className="mt-1"
                                        />
                                        <InputError message={errors.code} className="mt-1" />
                                    </div>
                                </div>

                                {/* Grade Level and School Year */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="grade_level">Grade Level *</Label>
                                        <Select value={data.grade_level} onValueChange={(v) => setData('grade_level', v)}>
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
                                        <Label htmlFor="school_year">School Year *</Label>
                                        <Select value={data.school_year} onValueChange={(v) => setData('school_year', v)}>
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Select school year" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {schoolYears.map((year) => (
                                                    <SelectItem key={year} value={year}>
                                                        {year}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.school_year} className="mt-1" />
                                    </div>
                                </div>

                                {/* Semester and Capacity */}
                                <div className="grid gap-4 md:grid-cols-2">
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
                                    <div>
                                        <Label htmlFor="capacity">Capacity *</Label>
                                        <Input
                                            id="capacity"
                                            type="number"
                                            min={1}
                                            max={100}
                                            value={data.capacity}
                                            onChange={(e) => setData('capacity', parseInt(e.target.value) || 1)}
                                            className="mt-1"
                                        />
                                        <InputError message={errors.capacity} className="mt-1" />
                                    </div>
                                </div>

                                {/* Adviser and Room */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="adviser">Adviser</Label>
                                        <Input
                                            id="adviser"
                                            value={data.adviser}
                                            onChange={(e) => setData('adviser', e.target.value)}
                                            placeholder="Class adviser name"
                                            className="mt-1"
                                        />
                                        <InputError message={errors.adviser} className="mt-1" />
                                    </div>
                                    <div>
                                        <Label htmlFor="room">Room</Label>
                                        <Input
                                            id="room"
                                            value={data.room}
                                            onChange={(e) => setData('room', e.target.value)}
                                            placeholder="e.g., Room 101"
                                            className="mt-1"
                                        />
                                        <InputError message={errors.room} className="mt-1" />
                                    </div>
                                </div>

                                {/* Schedule */}
                                <div>
                                    <Label htmlFor="schedule">Schedule Notes</Label>
                                    <Textarea
                                        id="schedule"
                                        value={data.schedule}
                                        onChange={(e) => setData('schedule', e.target.value)}
                                        placeholder="General schedule information..."
                                        className="mt-1"
                                        rows={2}
                                    />
                                    <InputError message={errors.schedule} className="mt-1" />
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
                                        Active (Section is open for enrollment)
                                    </Label>
                                </div>
                            </div>
                        </div>

                        {/* Assigned Subjects */}
                        <div className="rounded-lg border bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-gray-900">Assigned Subjects</h2>
                            <p className="mb-4 text-sm text-gray-500">
                                Select subjects to assign to this section. Schedule, room, and faculty are managed on each subject.
                            </p>

                            {/* Add Subject */}
                            <div className="mb-4 flex gap-2">
                                <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Select a subject to add" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableSubjects.map((subject) => (
                                            <SelectItem key={subject.id} value={subject.id.toString()}>
                                                {subject.code} - {subject.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button type="button" onClick={handleAddSubject} disabled={!selectedSubjectId}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Subject List */}
                            {assignedSubjects.length > 0 ? (
                                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                    {assignedSubjects.map((assignment) => {
                                        const subject = getSubjectById(assignment.subject_id);
                                        if (!subject) return null;

                                        return (
                                            <div key={assignment.subject_id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                                                <div>
                                                    <Badge variant="outline" className="mr-2">
                                                        {subject.code}
                                                    </Badge>
                                                    <span className="font-medium">{subject.name}</span>
                                                    <span className="ml-2 text-xs text-gray-500">({subject.units} units)</span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveSubject(assignment.subject_id)}
                                                    className="text-red-600"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="rounded-lg border border-dashed p-8 text-center">
                                    <p className="text-gray-500">No subjects assigned yet.</p>
                                    <p className="text-sm text-gray-400">Select subjects from the dropdown above.</p>
                                </div>
                            )}

                            {assignedSubjects.length > 0 && (
                                <p className="mt-3 text-sm text-gray-500">
                                    {assignedSubjects.length} subject(s) assigned
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex gap-3">
                        <Button type="submit" disabled={processing}>
                            {processing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Create Block Section
                                </>
                            )}
                        </Button>
                        <Link href="/block-sections">
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
