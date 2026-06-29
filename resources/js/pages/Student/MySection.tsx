import { CARD, SECTION_HEADING } from '@/constants/ui';
import StudentLayout from '@/layouts/student-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { BookOpen, LayoutGrid } from 'lucide-react';

interface Props {
    targetYear: string | null;
    targetSemester: string | null;
    blockSection: {
        name: string;
        code: string;
        grade_level: string;
        strand: string | null;
        adviser: string | null;
        room: string | null;
    } | null;
    subjects: {
        code: string;
        name: string;
        units: number;
        type: string;
    }[];
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'My Section', href: '/student/my-section' }];

export default function MySection({ targetYear, targetSemester, blockSection, subjects }: Props) {
    const totalUnits = subjects.reduce((sum, s) => sum + s.units, 0);

    return (
        <StudentLayout breadcrumbs={breadcrumbs}>
            <Head title="My Section" />

            <div className="space-y-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Section</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {targetSemester && targetYear ? `${targetSemester} · ${targetYear}` : 'Current semester'}
                    </p>
                </div>

                {blockSection ? (
                    <div className="space-y-6">
                        {/* Section details */}
                        <div className={`${CARD} p-6`}>
                            <div className="mb-4 flex items-center gap-2">
                                <LayoutGrid className="h-5 w-5 text-blue-600" />
                                <h2 className={SECTION_HEADING}>Section Details</h2>
                            </div>
                            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                                <div>
                                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Section Name</dt>
                                    <dd className="mt-1 text-sm font-semibold text-gray-900">{blockSection.name}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Section Code</dt>
                                    <dd className="mt-1 font-mono text-sm text-gray-700">{blockSection.code}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Grade Level</dt>
                                    <dd className="mt-1 text-sm text-gray-700">{blockSection.grade_level}</dd>
                                </div>
                                {blockSection.strand && (
                                    <div>
                                        <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Strand</dt>
                                        <dd className="mt-1 text-sm text-gray-700">{blockSection.strand}</dd>
                                    </div>
                                )}
                                {blockSection.adviser && (
                                    <div>
                                        <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Adviser</dt>
                                        <dd className="mt-1 text-sm text-gray-700">{blockSection.adviser}</dd>
                                    </div>
                                )}
                                {blockSection.room && (
                                    <div>
                                        <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Room</dt>
                                        <dd className="mt-1 text-sm text-gray-700">{blockSection.room}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {/* Subjects */}
                        <div className={CARD}>
                            <div className="flex items-center gap-2 border-b px-6 py-4">
                                <BookOpen className="h-5 w-5 text-blue-600" />
                                <h2 className={SECTION_HEADING}>Subjects</h2>
                            </div>
                            {subjects.length > 0 ? (
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Code</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Subject</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Type</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wide text-gray-500">Units</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {subjects.map((s, i) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 font-mono text-xs text-gray-500">{s.code}</td>
                                                <td className="px-4 py-2 font-medium text-gray-900">{s.name}</td>
                                                <td className="px-4 py-2">
                                                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{s.type}</span>
                                                </td>
                                                <td className="px-4 py-2 text-right text-gray-700">{s.units}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="border-t bg-gray-50">
                                        <tr>
                                            <td colSpan={3} className="px-4 py-2 text-sm font-semibold text-gray-700">Total Units</td>
                                            <td className="px-4 py-2 text-right font-semibold text-gray-900">{totalUnits}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            ) : (
                                <div className="py-10 text-center text-sm text-gray-400">
                                    No subjects have been assigned to this section yet.
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-center">
                        <LayoutGrid className="mb-3 h-10 w-10 text-gray-400" />
                        <p className="text-sm font-medium text-gray-600">Section Not Yet Assigned</p>
                        <p className="mt-1 text-xs text-gray-400">
                            Your section has not been assigned yet. Please check back once the enrollment period closes and the registrar has finalized section assignments.
                        </p>
                    </div>
                )}
            </div>
        </StudentLayout>
    );
}
