import { TablePagination } from '@/components/ui/table-pagination';
import { BODY_TEXT, CARD, PAGE_PADDING, PAGE_TITLE, SECTION_HEADING } from '@/constants/ui';
import { type SectionRow, type SubjectEntry, useValidationsIndex } from '@/hooks/useValidationsIndex';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, BookOpen, ChevronRight, Users } from 'lucide-react';

interface Props {
    isFaculty: boolean;
    mySubjects: SubjectEntry[];
    sections: SectionRow[];
    canFinalize: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Gradebook', href: '/teacher/gradebook' },
    { title: 'Validations', href: '/teacher/gradebook/validations' },
];

/** Admin gradebook validations index — faculty see their sections pending validation; admins see all sections. */
export default function ValidationsIndex({ isFaculty, mySubjects, sections }: Props) {
    const {
        currentPage, setCurrentPage,
        pageSize, setPageSize,
        subjectPage, setSubjectPage,
        subjectPageSize, setSubjectPageSize,
        paginatedSections,
        paginatedSubjects,
    } = useValidationsIndex({ sections, mySubjects });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Grade Validations" />

            <div className={PAGE_PADDING}>
                <div className="mb-6">
                    <Link href="/teacher/gradebook" className="mb-3 inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Gradebook
                    </Link>
                    <h1 className={PAGE_TITLE}>Grade Validations</h1>
                    <p className={`mt-1 ${BODY_TEXT}`}>
                        {isFaculty ? 'Track the validation status of your submitted grades.' : 'Review and finalize grade submissions from faculty.'}
                    </p>
                </div>

                {isFaculty ? (
                    mySubjects.length === 0 ? (
                        <div className={`${CARD} p-12 text-center`}>
                            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className={`mt-4 ${SECTION_HEADING}`}>No subjects assigned</h3>
                            <p className={`mt-2 ${BODY_TEXT}`}>You have no subjects assigned to you.</p>
                        </div>
                    ) : (
                        <div className={`overflow-hidden ${CARD}`}>
                            <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 z-10 bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Subject</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Section</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Grade Level</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">School Year</th>
                                            <th className="px-4 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {paginatedSubjects.map((entry) => (
                                            <tr key={`${entry.subject_id}-${entry.block_section_id}`} className="transition-colors hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <p className="text-xs font-medium uppercase tracking-wide text-blue-600">{entry.subject_code}</p>
                                                    <p className="font-medium text-gray-900">{entry.subject_name}</p>
                                                </td>
                                                <td className="px-4 py-3 text-gray-700">{entry.section_code}</td>
                                                <td className="px-4 py-3 text-gray-600">{entry.grade_level ?? '—'}</td>
                                                <td className="px-4 py-3 text-gray-600">{entry.school_year ?? '—'}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <Link
                                                        href={`/teacher/gradebook/validations/${entry.block_section_id}`}
                                                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                                                    >
                                                        Open <ChevronRight className="h-4 w-4" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <TablePagination
                                total={mySubjects.length}
                                pageSize={subjectPageSize}
                                currentPage={subjectPage}
                                onPageChange={setSubjectPage}
                                onPageSizeChange={(s) => { setSubjectPageSize(s); setSubjectPage(1); }}
                            />
                        </div>
                    )
                ) : sections.length === 0 ? (
                    <div className={`${CARD} p-12 text-center`}>
                        <Users className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className={`mt-4 ${SECTION_HEADING}`}>No sections found</h3>
                        <p className={`mt-2 ${BODY_TEXT}`}>No block sections have been created yet.</p>
                    </div>
                ) : (
                    <div className={`overflow-hidden ${CARD}`}>
                        <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 z-10 bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Section</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Grade Level</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">School Year</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Subjects</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {paginatedSections.map((section) => (
                                        <tr key={section.id} className="transition-colors hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <p className="text-xs font-medium uppercase tracking-wide text-blue-600">{section.code}</p>
                                                <p className="font-medium text-gray-900">{section.name}</p>
                                                {section.strand && <p className="text-xs text-gray-400">{section.strand}</p>}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{section.grade_level ?? '—'}</td>
                                            <td className="px-4 py-3 text-gray-600">{section.school_year ?? '—'}</td>
                                            <td className="px-4 py-3 text-center text-gray-700">{section.subjects_count}</td>
                                            <td className="px-4 py-3 text-right">
                                                <Link
                                                    href={`/teacher/gradebook/validations/${section.id}`}
                                                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                                                >
                                                    Open <ChevronRight className="h-4 w-4" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <TablePagination
                            total={sections.length}
                            pageSize={pageSize}
                            currentPage={currentPage}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
                        />
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
