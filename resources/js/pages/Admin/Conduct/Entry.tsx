import { Button } from '@/components/ui/button';
import { BODY_TEXT, CARD, PAGE_PADDING, PAGE_TITLE } from '@/constants/ui';
import {
    type BlockSectionData,
    type ConductCategory,
    type StudentRow,
    useConductEntry,
} from '@/hooks/useConductEntry';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';

interface Props {
    blockSection: BlockSectionData;
    quarter: string;
    quarters: string[];
    categories: ConductCategory[];
    students: StudentRow[];
}

export default function ConductEntry({ blockSection, quarter, quarters, categories, students }: Props) {
    const { breadcrumbs, allCriteria, grades, saving, isDirty, updateGrade, save } = useConductEntry({
        blockSection,
        quarter,
        categories,
        students,
    });

    if (allCriteria.length === 0) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Conduct — ${blockSection.code} ${quarter}`} />
                <div className={PAGE_PADDING}>
                    <Link
                        href={`/teacher/gradebook/${blockSection.id}`}
                        className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" /> Back
                    </Link>
                    <div className={`${CARD} p-12 text-center`}>
                        <p className={BODY_TEXT}>No active conduct criteria. Add categories and criteria first.</p>
                        <Link href="/teacher/conduct-categories" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
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

            <div className={`min-w-0 ${PAGE_PADDING}`}>
                <div className="mb-6">
                    <Link
                        href={`/teacher/gradebook/${blockSection.id}`}
                        className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" /> Back to {blockSection.code}
                    </Link>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className={PAGE_TITLE}>Conduct Grades — {blockSection.code}</h1>
                            <p className={`mt-1 ${BODY_TEXT}`}>
                                {blockSection.name}
                                {blockSection.school_year && ` • ${blockSection.school_year}`}
                            </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 pt-1">
                            <div className="flex gap-1">
                                {quarters.map((q) => (
                                    <Link key={q} href={`/teacher/gradebook/${blockSection.id}/conduct/${q}`}>
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

                <div className={`overflow-hidden ${CARD}`}>
                    <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                        <table className="border-collapse text-sm" style={{ minWidth: 'max-content' }}>
                            <thead className="sticky top-0 z-10 bg-gray-50">
                                <tr>
                                    <th className="whitespace-nowrap border border-gray-300 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Student
                                    </th>
                                    {categories.map((cat) => (
                                        <th
                                            key={cat.id}
                                            colSpan={cat.criteria.length}
                                            className="whitespace-nowrap border border-gray-300 bg-gray-100 px-4 py-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-600"
                                        >
                                            {cat.name}
                                        </th>
                                    ))}
                                </tr>
                                <tr>
                                    <th className="border border-gray-300 bg-gray-50 px-4 py-2"></th>
                                    {categories.flatMap((cat) =>
                                        cat.criteria.map((c) => (
                                            <th
                                                key={c.id}
                                                className="min-w-24 whitespace-nowrap border border-gray-300 bg-gray-50 px-3 py-2 text-center text-xs font-medium text-gray-500"
                                            >
                                                {c.name}
                                                <br />
                                                <span className="font-normal text-gray-400">/{c.max_score}</span>
                                            </th>
                                        )),
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {students.map((student: StudentRow) => (
                                    <tr key={student.enrollment_id} className="hover:bg-gray-50">
                                        <td className="whitespace-nowrap border border-gray-200 px-4 py-2">
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
                                                                updateGrade(
                                                                    student.enrollment_id,
                                                                    c.id,
                                                                    String(Math.min(c.max_score, Math.max(0, num))),
                                                                );
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
