import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { useState } from 'react';

interface ConductCriteria {
    id: number;
    name: string;
    max_score: number;
}

interface ConductCategory {
    id: number;
    name: string;
    criteria: ConductCriteria[];
}

interface StudentRow {
    enrollment_id: number;
    student_id_number: string | null;
    last_name: string | null;
    first_name: string | null;
    middle_name: string | null;
    grades: Record<number, number | null>;
}

interface BlockSectionData {
    id: number;
    code: string;
    name: string;
    school_year: string | null;
}

interface Props {
    blockSection: BlockSectionData;
    quarter: string;
    quarters: string[];
    categories: ConductCategory[];
    students: StudentRow[];
}

export default function ConductEntry({ blockSection, quarter, quarters, categories, students }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Gradebook', href: '/gradebook' },
        { title: blockSection.code, href: `/gradebook/${blockSection.id}` },
        { title: `Conduct ${quarter}`, href: `/gradebook/${blockSection.id}/conduct/${quarter}` },
    ];

    const allCriteria = categories.flatMap((c) => c.criteria);

    const initGrades = (): Record<number, Record<number, string>> => {
        const g: Record<number, Record<number, string>> = {};
        students.forEach((s) => {
            g[s.enrollment_id] = {};
            allCriteria.forEach((c) => {
                g[s.enrollment_id][c.id] = s.grades[c.id] !== null && s.grades[c.id] !== undefined
                    ? String(s.grades[c.id])
                    : '';
            });
        });
        return g;
    };

    const [grades, setGrades] = useState<Record<number, Record<number, string>>>(initGrades);
    const [saving, setSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    const updateGrade = (enrollmentId: number, criteriaId: number, value: string) => {
        setGrades((prev) => ({
            ...prev,
            [enrollmentId]: { ...prev[enrollmentId], [criteriaId]: value },
        }));
        setIsDirty(true);
    };

    const save = () => {
        setSaving(true);
        const payload: Record<number, Record<number, number | null>> = {};
        students.forEach((s) => {
            payload[s.enrollment_id] = {};
            allCriteria.forEach((c) => {
                const v = grades[s.enrollment_id]?.[c.id];
                payload[s.enrollment_id][c.id] = v === '' || v === undefined ? null : parseFloat(v);
            });
        });

        router.put(`/gradebook/${blockSection.id}/conduct/${quarter}`, { grades: payload }, {
            onSuccess: () => setIsDirty(false),
            onFinish: () => setSaving(false),
        });
    };

    if (allCriteria.length === 0) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Conduct — ${blockSection.code} ${quarter}`} />
                <div className="p-6 md:p-10">
                    <Link href={`/gradebook/${blockSection.id}`} className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="mr-1 h-4 w-4" /> Back
                    </Link>
                    <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
                        <p className="text-gray-600">No active conduct criteria. Add categories and criteria first.</p>
                        <Link href="/conduct-categories" className="mt-3 inline-block text-blue-600 hover:underline text-sm">
                            Manage Conduct Categories →
                        </Link>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Conduct — ${blockSection.code} ${quarter}`} />

            <div className="min-w-0 p-6 md:p-10">
                <div className="mb-6">
                    <Link href={`/gradebook/${blockSection.id}`} className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="mr-1 h-4 w-4" /> Back to {blockSection.code}
                    </Link>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Conduct Grades — {blockSection.code}
                            </h1>
                            <p className="mt-1 text-gray-600">{blockSection.name}{blockSection.school_year && ` • ${blockSection.school_year}`}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 pt-1">
                            <div className="flex gap-1">
                                {quarters.map((q) => (
                                    <Link key={q} href={`/gradebook/${blockSection.id}/conduct/${q}`}>
                                        <Button variant={q === quarter ? 'default' : 'outline'} size="sm" className="h-8 px-3 text-xs">
                                            {q}
                                        </Button>
                                    </Link>
                                ))}
                            </div>
                            <Button onClick={save} disabled={saving || !isDirty} size="sm">
                                <Save className="mr-1 h-4 w-4" />
                                {saving ? 'Saving…' : 'Save'}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                    <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                    <table className="text-sm border-collapse" style={{ minWidth: 'max-content' }}>
                        <thead className="sticky top-0 z-10 bg-gray-50">
                            <tr>
                                <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 whitespace-nowrap">
                                    Student
                                </th>
                                {categories.map((cat) => (
                                    <th
                                        key={cat.id}
                                        colSpan={cat.criteria.length}
                                        className="border border-gray-300 px-4 py-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-600 bg-gray-100 whitespace-nowrap"
                                    >
                                        {cat.name}
                                    </th>
                                ))}
                            </tr>
                            <tr>
                                <th className="border border-gray-300 px-4 py-2 bg-gray-50"></th>
                                {categories.flatMap((cat) =>
                                    cat.criteria.map((c) => (
                                        <th key={c.id} className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-500 whitespace-nowrap min-w-24 bg-gray-50">
                                            {c.name}
                                            <br />
                                            <span className="text-gray-400 font-normal">/{c.max_score}</span>
                                        </th>
                                    ))
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {students.map((student) => (
                                <tr key={student.enrollment_id} className="hover:bg-gray-50">
                                    <td className="border border-gray-200 px-4 py-2 whitespace-nowrap">
                                        <p className="font-medium text-gray-900">
                                            {[student.last_name, student.first_name].filter(Boolean).join(', ')}
                                        </p>
                                        <p className="text-xs text-gray-400">{student.student_id_number}</p>
                                    </td>
                                    {allCriteria.map((c) => {
                                        const val = grades[student.enrollment_id]?.[c.id] ?? '';
                                        return (
                                            <td key={c.id} className="border border-gray-200 px-1 py-1 text-center">
                                                <input
                                                    type="number"
                                                    className="w-16 rounded border border-gray-200 px-1 py-1 text-center text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                                    value={val}
                                                    min={0}
                                                    max={c.max_score}
                                                    step={0.01}
                                                    onChange={(e) => updateGrade(student.enrollment_id, c.id, e.target.value)}
                                                    onBlur={(e) => {
                                                        const num = parseFloat(e.target.value);
                                                        if (!isNaN(num)) {
                                                            updateGrade(student.enrollment_id, c.id, String(Math.min(c.max_score, Math.max(0, num))));
                                                        }
                                                    }}
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

