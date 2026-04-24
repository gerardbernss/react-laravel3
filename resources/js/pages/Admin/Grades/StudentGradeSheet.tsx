import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

interface SubjectEntry {
    id: number;
    subject_id: number;
    subject_code: string | null;
    subject_name: string | null;
    units: number | string | null;
    grade: number | string | null;
    grade_status: string | null;
}

interface Props {
    blockSection: {
        id: number;
        code: string;
        name: string;
        grade_level: string | null;
    };
    enrollment: {
        id: number;
        gwa: number | string | null;
        status: string;
    };
    student: {
        id: number;
        student_id_number: string | null;
        last_name: string | null;
        first_name: string | null;
        middle_name: string | null;
    };
    subjects: SubjectEntry[];
}

type GradeChange = {
    id: number;
    grade: number | null;
    grade_status: string | null;
};

const SPECIAL_STATUSES = ['INC', 'DRP', 'W'] as const;

function computeGwa(subjects: SubjectEntry[], changes: Map<number, GradeChange>): number | null {
    const graded = subjects
        .map((s) => {
            const change = changes.get(s.id);
            return change
                ? { grade: change.grade, grade_status: change.grade_status, units: s.units }
                : { grade: s.grade, grade_status: s.grade_status, units: s.units };
        })
        .filter((s) => s.grade !== null && (s.grade_status === 'Passed' || s.grade_status === 'Failed'));

    if (graded.length === 0) return null;

    let totalWeighted = 0;
    let totalUnits = 0;
    for (const s of graded) {
        totalWeighted += Number(s.grade) * Number(s.units);
        totalUnits += Number(s.units);
    }
    if (totalUnits === 0) return null;
    return Math.round((totalWeighted / totalUnits) * 100) / 100;
}

export default function StudentGradeSheet({ blockSection, enrollment, student, subjects }: Props) {
    const [changes, setChanges] = useState<Map<number, GradeChange>>(new Map());
    const [saving, setSaving] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Grades', href: '/grades' },
        { title: blockSection.code, href: `/grades/${blockSection.id}` },
        { title: `${student.last_name}, ${student.first_name}`, href: '#' },
    ];

    const studentName = [student.last_name, student.first_name, student.middle_name ? `${student.middle_name.charAt(0)}.` : null]
        .filter(Boolean)
        .join(', ');

    const handleGradeChange = useCallback((entry: SubjectEntry, value: string) => {
        if (value === '') {
            setChanges((prev) => { const next = new Map(prev); next.delete(entry.id); return next; });
            return;
        }
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0 || numValue > 100) return;
        const gradeStatus = numValue >= 75 ? 'Passed' : 'Failed';
        setChanges((prev) => { const next = new Map(prev); next.set(entry.id, { id: entry.id, grade: numValue, grade_status: gradeStatus }); return next; });
    }, []);

    const handleSpecialStatus = useCallback((entry: SubjectEntry, status: string) => {
        if (status === 'none') {
            setChanges((prev) => { const next = new Map(prev); next.delete(entry.id); return next; });
            return;
        }
        setChanges((prev) => { const next = new Map(prev); next.set(entry.id, { id: entry.id, grade: null, grade_status: status }); return next; });
    }, []);

    const getCurrentValue = useCallback((entry: SubjectEntry) => {
        const change = changes.get(entry.id);
        if (!change) return { grade: entry.grade, grade_status: entry.grade_status };
        return { grade: change.grade, grade_status: change.grade_status };
    }, [changes]);

    const liveGwa = useMemo(() => computeGwa(subjects, changes), [subjects, changes]);

    const hasChanges = changes.size > 0;

    const handleSave = () => {
        if (!hasChanges) return;
        setSaving(true);
        router.put(
            `/grades/${blockSection.id}`,
            { grades: Array.from(changes.values()) },
            {
                preserveScroll: true,
                onFinish: () => { setSaving(false); setChanges(new Map()); },
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Grades — ${studentName}`} />

            <div className="p-6 md:p-10">
                {/* Back + Header */}
                <div className="mb-6">
                    <Link
                        href={`/grades/${blockSection.id}`}
                        className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to {blockSection.code}
                    </Link>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{studentName}</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                {student.student_id_number && (
                                    <span className="mr-3 font-mono">{student.student_id_number}</span>
                                )}
                                {blockSection.code}
                                {blockSection.grade_level && ` · ${blockSection.grade_level}`}
                            </p>
                        </div>

                        {/* Live GWA */}
                        <div className="rounded-lg border bg-white px-6 py-3 shadow-sm text-center min-w-[120px]">
                            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">GWA</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">
                                {liveGwa !== null ? liveGwa.toFixed(2) : (enrollment.gwa !== null ? Number(enrollment.gwa).toFixed(2) : '—')}
                            </p>
                            {hasChanges && liveGwa !== null && (
                                <p className="text-[10px] text-amber-600">unsaved</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Subject Grades Table */}
                {subjects.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-8">#</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Subject</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 w-16">Units</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 w-28">Grade</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 w-24">Remarks</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 w-28">Special Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {subjects.map((entry, index) => {
                                    const current = getCurrentValue(entry);
                                    const isSpecial = current.grade_status && SPECIAL_STATUSES.includes(current.grade_status as any);
                                    const isChanged = changes.has(entry.id);

                                    return (
                                        <tr
                                            key={entry.id}
                                            className={`transition-colors hover:bg-gray-50 ${isChanged ? 'bg-amber-50/50' : ''}`}
                                        >
                                            <td className="px-4 py-3 text-gray-400 text-xs">{index + 1}</td>
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-gray-900">{entry.subject_name || '—'}</p>
                                                <p className="text-xs text-gray-400">{entry.subject_code}</p>
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-600">
                                                {Number(entry.units).toFixed(1)}
                                            </td>
                                            {/* Grade Input */}
                                            <td className="px-4 py-3 text-center">
                                                {isSpecial ? (
                                                    <span className="text-gray-400 text-xs">—</span>
                                                ) : (
                                                    <Input
                                                        type="number"
                                                        step="1"
                                                        min="0"
                                                        max="100"
                                                        className="h-8 w-20 text-center text-sm mx-auto"
                                                        defaultValue={current.grade != null ? Number(current.grade).toFixed(2) : ''}
                                                        onBlur={(e) => handleGradeChange(entry, e.target.value)}
                                                        placeholder="—"
                                                    />
                                                )}
                                            </td>
                                            {/* Remarks (auto) */}
                                            <td className="px-4 py-3 text-center">
                                                {isSpecial ? (
                                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                                                        {current.grade_status}
                                                    </span>
                                                ) : current.grade !== null && current.grade_status ? (
                                                    <span className={`text-xs font-semibold ${current.grade_status === 'Passed' ? 'text-green-700' : 'text-red-600'}`}>
                                                        {current.grade_status}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300 text-xs">—</span>
                                                )}
                                            </td>
                                            {/* Special Status */}
                                            <td className="px-4 py-3 text-center">
                                                <Select
                                                    value={isSpecial ? (current.grade_status ?? 'none') : 'none'}
                                                    onValueChange={(v) => handleSpecialStatus(entry, v)}
                                                >
                                                    <SelectTrigger className="h-8 w-24 text-xs mx-auto">
                                                        <SelectValue placeholder="None" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">None</SelectItem>
                                                        <SelectItem value="INC">INC</SelectItem>
                                                        <SelectItem value="DRP">DRP</SelectItem>
                                                        <SelectItem value="W">W</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
                        <p className="text-gray-600">No subjects found for this student.</p>
                    </div>
                )}

                {/* Save Bar */}
                <div className={`mt-4 flex items-center justify-end gap-3 rounded-lg border p-4 shadow-sm transition-colors ${hasChanges ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                    {hasChanges && (
                        <span className="text-sm text-amber-700">
                            {changes.size} unsaved change{changes.size !== 1 ? 's' : ''}
                        </span>
                    )}
                    <Button
                        variant="outline"
                        onClick={() => setChanges(new Map())}
                        disabled={!hasChanges || saving}
                    >
                        Discard
                    </Button>
                    <Button onClick={handleSave} disabled={!hasChanges || saving}>
                        {saving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        {saving ? 'Saving...' : 'Save Grades'}
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
