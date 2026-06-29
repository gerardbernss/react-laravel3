import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BODY_TEXT, CARD, LABEL_TEXT, PAGE_PADDING, PAGE_TITLE, SECTION_HEADING } from '@/constants/ui';
import { type BlockSection, type Subject, type SubjectAssignment, schoolYears, useBlockSectionEdit } from '@/hooks/useBlockSectionEdit';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Loader2, Plus, Save, X } from 'lucide-react';

interface Props {
    blockSection: BlockSection;
    subjects: Subject[];
}

const gradeLevels = [
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
];

const semesters = ['First Semester', 'Second Semester', 'Summer', 'Full Year'];

export default function Edit({ blockSection, subjects }: Props) {
    const {
        data,
        setData,
        processing,
        errors,
        assignedSubjects,
        selectedSubjectId,
        setSelectedSubjectId,
        availableSubjects,
        getSubjectById,
        handleAddSubject,
        handleRemoveSubject,
        handleSemesterChange,
        handleSubmit,
        breadcrumbs,
    } = useBlockSectionEdit({ blockSection, subjects });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${blockSection.code}`} />

            <div className={PAGE_PADDING}>
                <div className="mb-6">
                    <Link href="/block-sections" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Block Sections
                    </Link>
                    <h1 className={`mt-2 ${PAGE_TITLE}`}>Edit Block Section</h1>
                    <p className={`mt-1 ${BODY_TEXT}`}>
                        Editing: <span className="font-medium">{blockSection.name} ({blockSection.code})</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className={`${CARD} p-6`}>
                            <h2 className={`mb-4 ${SECTION_HEADING}`}>Section Details</h2>

                            <div className="grid gap-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="name" className={LABEL_TEXT}>Section Name *</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="mt-1"
                                        />
                                        <InputError message={errors.name} className="mt-1" />
                                    </div>
                                    <div>
                                        <Label htmlFor="code" className={LABEL_TEXT}>Section Code *</Label>
                                        <Input
                                            id="code"
                                            value={data.code}
                                            onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                            className="mt-1"
                                        />
                                        <InputError message={errors.code} className="mt-1" />
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="grade_level" className={LABEL_TEXT}>Grade Level *</Label>
                                        <Select value={data.grade_level} onValueChange={(v) => setData('grade_level', v)}>
                                            <SelectTrigger className="mt-1">
                                                <SelectValue />
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
                                        <Label htmlFor="school_year" className={LABEL_TEXT}>School Year *</Label>
                                        <Select value={data.school_year} onValueChange={(v) => setData('school_year', v)}>
                                            <SelectTrigger className="mt-1">
                                                <SelectValue />
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

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="semester" className={LABEL_TEXT}>Semester</Label>
                                        <Select value={data.semester} onValueChange={handleSemesterChange}>
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
                                        <Label htmlFor="capacity" className={LABEL_TEXT}>Capacity *</Label>
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

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="adviser" className={LABEL_TEXT}>Adviser</Label>
                                        <Input
                                            id="adviser"
                                            value={data.adviser}
                                            onChange={(e) => setData('adviser', e.target.value)}
                                            className="mt-1"
                                        />
                                        <InputError message={errors.adviser} className="mt-1" />
                                    </div>
                                    <div>
                                        <Label htmlFor="room" className={LABEL_TEXT}>Room</Label>
                                        <Input
                                            id="room"
                                            value={data.room}
                                            onChange={(e) => setData('room', e.target.value)}
                                            className="mt-1"
                                        />
                                        <InputError message={errors.room} className="mt-1" />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="schedule" className={LABEL_TEXT}>Schedule Notes</Label>
                                    <Textarea
                                        id="schedule"
                                        value={data.schedule}
                                        onChange={(e) => setData('schedule', e.target.value)}
                                        className="mt-1"
                                        rows={2}
                                    />
                                    <InputError message={errors.schedule} className="mt-1" />
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
                                        Active (Section is open for enrollment)
                                    </Label>
                                </div>
                            </div>
                        </div>

                        <div className={`${CARD} p-6`}>
                            <h2 className={`mb-4 ${SECTION_HEADING}`}>Assigned Subjects</h2>
                            <p className={`mb-4 ${BODY_TEXT}`}>
                                Select subjects to assign to this section. Schedule, room, and faculty are managed on each subject.
                            </p>

                            <div className="mb-4 flex gap-2">
                                <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Select a subject to add" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableSubjects.map((subject) => (
                                            <SelectItem key={subject.id} value={subject.id.toString()}>
                                                {subject.code} - {subject.name}
                                                {subject.semester ? ` (${subject.semester})` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button type="button" onClick={handleAddSubject} disabled={!selectedSubjectId}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            {assignedSubjects.length > 0 ? (
                                <div className="max-h-[500px] space-y-2 overflow-y-auto">
                                    {assignedSubjects.map((assignment: SubjectAssignment) => {
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
                                                    {subject.semester && (
                                                        <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                                                            {subject.semester}
                                                        </span>
                                                    )}
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
                                    <p className={BODY_TEXT}>No subjects assigned yet.</p>
                                </div>
                            )}

                            {assignedSubjects.length > 0 && (
                                <p className={`mt-3 ${BODY_TEXT}`}>{assignedSubjects.length} subject(s) assigned</p>
                            )}
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
