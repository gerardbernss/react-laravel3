import { Button } from '@/components/ui/button';
import { BODY_TEXT, CARD, PAGE_PADDING, PAGE_TITLE, SECTION_HEADING } from '@/constants/ui';
import { type BlockSectionData, type SubjectRow, useValidationsShow } from '@/hooks/useValidationsShow';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, Clock, Eye } from 'lucide-react';
import { type ReactNode } from 'react';

interface Props {
    blockSection: BlockSectionData;
    subjects: SubjectRow[];
    quarters: string[];
    isFaculty: boolean;
    canFinalize: boolean;
}

function statusBadge(status: 'draft' | 'submitted' | 'finalized'): ReactNode {
    if (status === 'finalized')
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                <CheckCircle className="h-3 w-3" />
                Finalized
            </span>
        );
    if (status === 'submitted')
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">
                <Clock className="h-3 w-3" />
                Submitted
            </span>
        );
    return <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-400">Draft</span>;
}

/** Admin gradebook validation detail page for reviewing and finalising a block section's grades per subject and quarter. */
export default function ValidationsShow({ blockSection, subjects, quarters, isFaculty, canFinalize }: Props) {
    const { breadcrumbs } = useValidationsShow({ blockSection });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Validations — ${blockSection.code}`} />

            <div className={PAGE_PADDING}>
                <div className="mb-6">
                    <Link href="/teacher/gradebook/validations" className="mb-3 inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Validations
                    </Link>
                    <h1 className={PAGE_TITLE}>
                        {blockSection.code} — {blockSection.name}
                    </h1>
                    <p className={`mt-1 ${BODY_TEXT}`}>
                        {blockSection.grade_level && <span>{blockSection.grade_level} · </span>}
                        {blockSection.school_year && <span>{blockSection.school_year}</span>}
                    </p>
                </div>

                {subjects.length === 0 ? (
                    <div className={`${CARD} p-12 text-center`}>
                        <CheckCircle className="mx-auto h-12 w-12 text-gray-300" />
                        <h3 className={`mt-4 ${SECTION_HEADING}`}>No subjects found</h3>
                        <p className={`mt-2 ${BODY_TEXT}`}>No subjects are set up for this section.</p>
                    </div>
                ) : (
                    <div className={`overflow-hidden ${CARD}`}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="min-w-[200px] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Subject</th>
                                        {!isFaculty && (
                                            <th className="min-w-[140px] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Faculty</th>
                                        )}
                                        {quarters.map((q) => (
                                            <th key={q} className="min-w-[150px] px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                                                {q}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {subjects.map((subject) => (
                                        <tr key={subject.id} className="transition-colors hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-gray-900">{subject.code}</p>
                                                <p className="text-xs text-gray-500">{subject.name}</p>
                                            </td>
                                            {!isFaculty && (
                                                <td className="px-4 py-3 text-xs text-gray-500">
                                                    {subject.faculty_name ?? <span className="italic text-gray-300">Unassigned</span>}
                                                </td>
                                            )}
                                            {quarters.map((q) => {
                                                const data = subject.quarters[q];
                                                const entryHref = `/teacher/gradebook/${blockSection.id}/${subject.id}/${q}/entry`;
                                                const isSubmitted = data.status === 'submitted';
                                                const showView = data.status !== 'draft' || canFinalize;

                                                return (
                                                    <td key={q} className="px-4 py-3">
                                                        <div className="flex flex-col items-center gap-2">
                                                            {statusBadge(data.status)}
                                                            {showView && (
                                                                <Link href={entryHref}>
                                                                    <Button
                                                                        variant={isSubmitted && canFinalize ? 'default' : 'outline'}
                                                                        size="sm"
                                                                        className={`h-7 gap-1 px-2 text-xs ${isSubmitted && canFinalize ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                                                                    >
                                                                        <Eye className="h-3 w-3" />
                                                                        {isSubmitted && canFinalize ? 'Review' : 'View'}
                                                                    </Button>
                                                                </Link>
                                                            )}
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
