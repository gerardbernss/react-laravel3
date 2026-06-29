import { Button } from '@/components/ui/button';
import { BODY_TEXT, CARD, PAGE_PADDING, PAGE_TITLE, SECTION_HEADING } from '@/constants/ui';
import { type BlockSectionData, type SubjectRow, useGradebookShow } from '@/hooks/useGradebookShow';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ClipboardList, Download, Settings, Table2 } from 'lucide-react';
import { type ReactNode } from 'react';

interface Props {
    blockSection: BlockSectionData;
    subjects: SubjectRow[];
    quarters: string[];
    totalStudents: number;
    isFaculty: boolean;
    canManageConduct: boolean;
}

const validationBadge = (status: 'draft' | 'submitted' | 'finalized'): ReactNode => {
    if (status === 'finalized') return <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-semibold text-green-800">Finalized</span>;
    if (status === 'submitted') return <span className="rounded-full bg-yellow-100 px-1.5 py-0.5 text-xs font-semibold text-yellow-800">Submitted</span>;
    return <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs font-semibold text-gray-500">Draft</span>;
};

export default function GradebookShow({ blockSection, subjects, quarters, totalStudents, isFaculty, canManageConduct }: Props) {
    const { breadcrumbs } = useGradebookShow({ blockSection });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Gradebook — ${blockSection.code}`} />

            <div className={PAGE_PADDING}>
                <div className="mb-6">
                    <Link href="/gradebook" className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Gradebook
                    </Link>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className={PAGE_TITLE}>
                                {blockSection.code} — {blockSection.name}
                            </h1>
                            <p className={`mt-1 ${BODY_TEXT}`}>
                                {blockSection.grade_level}
                                {blockSection.school_year && ` • ${blockSection.school_year}`}
                                {blockSection.semester && ` • ${blockSection.semester}`}
                                {isFaculty
                                    ? ` • Your subject${subjects.length !== 1 ? 's' : ''} in this section`
                                    : ` • ${totalStudents} students enrolled`}
                            </p>
                        </div>
                        <div className="flex shrink-0 gap-2 pt-1">
                            {canManageConduct && (
                                <Link href={`/gradebook/${blockSection.id}/conduct/Q1`}>
                                    <Button variant="outline" size="sm">
                                        <ClipboardList className="mr-1 h-4 w-4" />
                                        Conduct Grades
                                    </Button>
                                </Link>
                            )}
                            {!isFaculty && (
                                <a href={`/reports/grading-sheet/${blockSection.id}`}>
                                    <Button variant="outline" size="sm">
                                        <Download className="mr-1 h-4 w-4" />
                                        Grading Sheet
                                    </Button>
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {subjects.length === 0 ? (
                    <div className={`${CARD} p-12 text-center`}>
                        <Table2 className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className={`mt-4 ${SECTION_HEADING}`}>No subjects</h3>
                        <p className={`mt-2 ${BODY_TEXT}`}>No subjects are assigned to this section.</p>
                    </div>
                ) : (
                    <div className={`overflow-hidden ${CARD}`}>
                        <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 z-10 bg-gray-50">
                                    <tr>
                                        <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Subject
                                        </th>
                                        {quarters.map((q) => (
                                            <th key={q} className="min-w-[160px] px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                                                {q}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {subjects.map((subject) => (
                                        <tr key={subject.id} className="transition-colors hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-gray-900">{subject.code}</p>
                                                <p className="text-xs text-gray-500">{subject.name}</p>
                                                {subject.faculty_name && <p className="text-xs text-gray-400">{subject.faculty_name}</p>}
                                            </td>
                                            {quarters.map((q) => {
                                                const qData = subject.quarters[q];
                                                const hasComponents = qData.component_count > 0;
                                                const weightOk = Math.abs(qData.weight_total - 100) < 0.01;
                                                return (
                                                    <td key={q} className="px-4 py-3">
                                                        <div className="flex flex-col items-center gap-1">
                                                            {validationBadge(qData.validation_status)}
                                                            {hasComponents && (
                                                                <span className="text-xs text-gray-500">
                                                                    {qData.component_count} component{qData.component_count !== 1 ? 's' : ''}
                                                                    {!weightOk && (
                                                                        <span className="ml-1 text-amber-500" title="Weights don't sum to 100%">
                                                                            ⚠
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            )}
                                                            {hasComponents && totalStudents > 0 && (
                                                                <span className="text-xs text-gray-400">
                                                                    {qData.scored_students}/{totalStudents} scored
                                                                </span>
                                                            )}
                                                            <div className="mt-1 flex gap-1">
                                                                {qData.validation_status === 'draft' && (
                                                                    <Link href={`/gradebook/${blockSection.id}/${subject.id}/${q}/components`}>
                                                                        <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                                                                            <Settings className="mr-1 h-3 w-3" />
                                                                            Setup
                                                                        </Button>
                                                                    </Link>
                                                                )}
                                                                <Link href={`/gradebook/${blockSection.id}/${subject.id}/${q}/entry`}>
                                                                    <Button variant={hasComponents ? 'default' : 'outline'} size="sm" className="h-7 px-2 text-xs">
                                                                        <Table2 className="mr-1 h-3 w-3" />
                                                                        {qData.validation_status === 'draft' ? 'Entry' : 'View'}
                                                                    </Button>
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
