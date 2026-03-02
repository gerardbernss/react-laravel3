import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, Loader2, Save, Users, XCircle } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

interface SubjectGrade {
    id: number;
    subject_id: number;
    subject_code: string;
    subject_name: string;
    units: number;
    grade: number | null;
    grade_status: string | null;
}

interface StudentRow {
    enrollment_id: number;
    student_id: number;
    student_id_number: string;
    last_name: string;
    first_name: string;
    middle_name: string | null;
    gwa: number | null;
    status: string;
    subjects: SubjectGrade[];
}

interface BlockSection {
    id: number;
    code: string;
    name: string;
    grade_level: string | null;
    strand: string | null;
    school_year: string | null;
    semester: string | null;
    adviser: string | null;
    subjects: { id: number; code: string; name: string; units: number }[];
}

interface Statistics {
    total_students: number;
    graded_count: number;
    total_subject_entries: number;
    passed_count: number;
    failed_count: number;
    incomplete_count: number;
    average_gwa: number | null;
    pass_rate: number | null;
}

interface Props {
    blockSection: BlockSection;
    students: StudentRow[];
    statistics: Statistics;
}

type GradeChange = {
    id: number;
    grade: number | null;
    grade_status: string | null;
};

const SPECIAL_STATUSES = ['INC', 'DRP', 'W'] as const;

function getGradeCellClass(grade: number | null, status: string | null): string {
    if (!status || status === '') return '';
    if (status === 'Passed') return 'bg-green-50 text-green-800';
    if (status === 'Failed') return 'bg-red-50 text-red-800';
    if (['INC', 'DRP', 'W'].includes(status)) return 'bg-gray-50 text-gray-600';
    return '';
}

function computeGwa(subjects: SubjectGrade[]): number | null {
    const graded = subjects.filter(
        (s) => s.grade !== null && (s.grade_status === 'Passed' || s.grade_status === 'Failed'),
    );
    if (graded.length === 0) return null;
    let totalWeighted = 0;
    let totalUnits = 0;
    for (const s of graded) {
        totalWeighted += (s.grade as number) * s.units;
        totalUnits += s.units;
    }
    if (totalUnits === 0) return null;
    return Math.round((totalWeighted / totalUnits) * 100) / 100;
}

export default function GradeSheet({ blockSection, students, statistics }: Props) {
    // Track all grade changes locally
    const [changes, setChanges] = useState<Map<number, GradeChange>>(new Map());
    const [saving, setSaving] = useState(false);
    const [subjectFilter, setSubjectFilter] = useState<string>('all');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Grades', href: '/grades' },
        { title: blockSection.code, href: `/grades/${blockSection.id}` },
    ];

    // Get the current value (changed or original) for a subject grade entry
    const getCurrentValue = useCallback(
        (original: SubjectGrade): SubjectGrade => {
            const change = changes.get(original.id);
            if (!change) return original;
            return { ...original, grade: change.grade, grade_status: change.grade_status };
        },
        [changes],
    );

    // Handle numeric grade input
    const handleGradeChange = useCallback((entry: SubjectGrade, value: string) => {
        if (value === '') {
            // Cleared - remove change if back to original
            setChanges((prev) => {
                const next = new Map(prev);
                next.delete(entry.id);
                return next;
            });
            return;
        }
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 1 || numValue > 5) return;

        const gradeStatus = numValue <= 3.0 ? 'Passed' : 'Failed';
        setChanges((prev) => {
            const next = new Map(prev);
            next.set(entry.id, { id: entry.id, grade: numValue, grade_status: gradeStatus });
            return next;
        });
    }, []);

    // Handle special status selection
    const handleStatusChange = useCallback((entry: SubjectGrade, status: string) => {
        if (status === 'numeric') {
            // Switch back to numeric mode - remove the change
            setChanges((prev) => {
                const next = new Map(prev);
                next.delete(entry.id);
                return next;
            });
            return;
        }
        setChanges((prev) => {
            const next = new Map(prev);
            next.set(entry.id, { id: entry.id, grade: null, grade_status: status });
            return next;
        });
    }, []);

    // Unique subjects across all students for column headers
    const allSubjects = useMemo(() => {
        const subjectMap = new Map<number, { id: number; code: string; name: string; units: number }>();
        for (const student of students) {
            for (const subj of student.subjects) {
                if (!subjectMap.has(subj.subject_id)) {
                    subjectMap.set(subj.subject_id, {
                        id: subj.subject_id,
                        code: subj.subject_code,
                        name: subj.subject_name,
                        units: subj.units,
                    });
                }
            }
        }
        return Array.from(subjectMap.values());
    }, [students]);

    // Filtered subjects based on dropdown
    const visibleSubjects = useMemo(() => {
        if (subjectFilter === 'all') return allSubjects;
        return allSubjects.filter((s) => s.id === parseInt(subjectFilter));
    }, [allSubjects, subjectFilter]);

    // Compute live GWA for each student using current values
    const liveStudents = useMemo(() => {
        return students.map((student) => {
            const currentSubjects = student.subjects.map((s) => getCurrentValue(s));
            const liveGwa = computeGwa(currentSubjects);
            return { ...student, liveGwa, currentSubjects };
        });
    }, [students, getCurrentValue]);

    const hasChanges = changes.size > 0;

    const handleSave = () => {
        if (!hasChanges) return;
        setSaving(true);

        const grades = Array.from(changes.values());

        router.put(
            `/grades/${blockSection.id}`,
            { grades },
            {
                preserveScroll: true,
                onFinish: () => {
                    setSaving(false);
                    setChanges(new Map());
                },
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Grade Sheet - ${blockSection.code}`} />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/grades" className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Grades
                    </Link>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                {blockSection.code} — {blockSection.name}
                            </h1>
                            <p className="mt-1 text-gray-600">
                                {blockSection.grade_level}
                                {blockSection.strand && ` • ${blockSection.strand}`}
                                {blockSection.school_year && ` • ${blockSection.school_year}`}
                                {blockSection.semester && ` • ${blockSection.semester}`}
                            </p>
                        </div>
                        <Button onClick={handleSave} disabled={!hasChanges || saving}>
                            {saving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            {saving ? 'Saving...' : 'Save All Grades'}
                        </Button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="mb-6 grid gap-4 md:grid-cols-4">
                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <Users className="h-8 w-8 text-blue-500" />
                            <div>
                                <p className="text-sm text-gray-500">Total Students</p>
                                <p className="text-2xl font-bold">{statistics.total_students}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                            <div>
                                <p className="text-sm text-gray-500">Passed</p>
                                <p className="text-2xl font-bold">{statistics.passed_count}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <XCircle className="h-8 w-8 text-red-500" />
                            <div>
                                <p className="text-sm text-gray-500">Failed</p>
                                <p className="text-2xl font-bold">{statistics.failed_count}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <div>
                            <p className="text-sm text-gray-500">Pass Rate</p>
                            <p className="text-2xl font-bold">
                                {statistics.pass_rate !== null ? `${statistics.pass_rate}%` : '—'}
                            </p>
                            {statistics.average_gwa !== null && (
                                <p className="text-xs text-gray-400">Avg GWA: {statistics.average_gwa}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Subject Filter */}
                <div className="mb-4 flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">Filter by Subject:</label>
                    <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                        <SelectTrigger className="w-64">
                            <SelectValue placeholder="All Subjects" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Subjects</SelectItem>
                            {allSubjects.map((subj) => (
                                <SelectItem key={subj.id} value={String(subj.id)}>
                                    {subj.code} — {subj.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {hasChanges && (
                        <span className="text-sm text-amber-600 font-medium">
                            {changes.size} unsaved change{changes.size !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                {/* Grade Sheet Table */}
                {liveStudents.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 z-10 bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 whitespace-nowrap">
                                            #
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 whitespace-nowrap">
                                            Student ID
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 whitespace-nowrap">
                                            Student Name
                                        </th>
                                        {visibleSubjects.map((subj) => (
                                            <th
                                                key={subj.id}
                                                className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 whitespace-nowrap"
                                                title={`${subj.name} (${subj.units} units)`}
                                            >
                                                {subj.code}
                                                <span className="block text-[10px] font-normal normal-case text-gray-400">
                                                    {subj.units}u
                                                </span>
                                            </th>
                                        ))}
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 whitespace-nowrap">
                                            GWA
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {liveStudents.map((student, index) => (
                                        <tr key={student.enrollment_id} className="hover:bg-gray-50">
                                            <td className="px-4 py-2 text-gray-400">{index + 1}</td>
                                            <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">
                                                {student.student_id_number || '—'}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap">
                                                <span className="font-medium text-gray-900">
                                                    {student.last_name}, {student.first_name}
                                                </span>
                                                {student.middle_name && (
                                                    <span className="text-gray-500"> {student.middle_name.charAt(0)}.</span>
                                                )}
                                            </td>
                                            {visibleSubjects.map((subj) => {
                                                const entry = student.subjects.find((s) => s.subject_id === subj.id);
                                                if (!entry) {
                                                    return (
                                                        <td key={subj.id} className="px-3 py-2 text-center text-gray-300">
                                                            —
                                                        </td>
                                                    );
                                                }
                                                const current = getCurrentValue(entry);
                                                const isSpecialStatus =
                                                    current.grade_status && SPECIAL_STATUSES.includes(current.grade_status as any);
                                                const isChanged = changes.has(entry.id);

                                                return (
                                                    <td
                                                        key={subj.id}
                                                        className={`px-1 py-1 text-center ${getGradeCellClass(current.grade, current.grade_status)} ${isChanged ? 'ring-2 ring-amber-300 ring-inset' : ''}`}
                                                    >
                                                        {isSpecialStatus ? (
                                                            <Select
                                                                value={current.grade_status || ''}
                                                                onValueChange={(v) => handleStatusChange(entry, v)}
                                                            >
                                                                <SelectTrigger className="h-8 w-20 text-xs mx-auto">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="numeric">Grade</SelectItem>
                                                                    <SelectItem value="INC">INC</SelectItem>
                                                                    <SelectItem value="DRP">DRP</SelectItem>
                                                                    <SelectItem value="W">W</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        ) : (
                                                            <div className="flex items-center gap-1">
                                                                <Input
                                                                    type="number"
                                                                    step="0.25"
                                                                    min="1"
                                                                    max="5"
                                                                    className="h-8 w-16 text-center text-xs mx-auto"
                                                                    defaultValue={current.grade?.toFixed(2) ?? ''}
                                                                    onBlur={(e) => handleGradeChange(entry, e.target.value)}
                                                                    placeholder="—"
                                                                />
                                                                <Select
                                                                    value="numeric"
                                                                    onValueChange={(v) => handleStatusChange(entry, v)}
                                                                >
                                                                    <SelectTrigger className="h-8 w-8 p-0 text-xs border-0 shadow-none text-gray-400">
                                                                        <span className="text-[10px]">...</span>
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="numeric">Grade</SelectItem>
                                                                        <SelectItem value="INC">INC</SelectItem>
                                                                        <SelectItem value="DRP">DRP</SelectItem>
                                                                        <SelectItem value="W">W</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            <td className="px-4 py-2 text-center font-semibold whitespace-nowrap">
                                                {student.liveGwa !== null ? student.liveGwa.toFixed(2) : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
                        <Users className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">No students enrolled</h3>
                        <p className="mt-2 text-gray-600">
                            No students are enrolled in this section yet.
                        </p>
                    </div>
                )}

                {/* Bottom Save Bar */}
                {hasChanges && (
                    <div className="mt-4 flex items-center justify-end gap-4 rounded-lg border bg-amber-50 p-4 shadow-sm">
                        <span className="text-sm text-amber-700">
                            You have {changes.size} unsaved change{changes.size !== 1 ? 's' : ''}
                        </span>
                        <Button
                            variant="outline"
                            onClick={() => setChanges(new Map())}
                            disabled={saving}
                        >
                            Discard
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            {saving ? 'Saving...' : 'Save All Grades'}
                        </Button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
