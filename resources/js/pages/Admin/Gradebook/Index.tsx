import { TablePagination } from '@/components/ui/table-pagination';
import { BODY_TEXT, CARD, PAGE_PADDING, PAGE_TITLE, SECTION_HEADING, TABLE_HEADER_CELL, TABLE_HEADER_CELL_CENTER, TABLE_ROW_ACTION } from '@/constants/ui';
import { useGradebook, type BlockSection, type SubjectEntry } from '@/hooks/useGradebook';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { BookOpen, ChevronRight, ClipboardCheck, Users } from 'lucide-react';

interface Props {
    isFaculty: boolean;
    mySubjects: SubjectEntry[];
    blockSections: BlockSection[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Gradebook', href: '/teacher/gradebook' },
];

function SubjectRow({ entry }: { entry: SubjectEntry }) {
    return (
        <tr key={`${entry.subject_id}-${entry.block_section_id}`} className="transition-colors hover:bg-gray-50">
            <td className="px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-blue-600">{entry.subject_code}</p>
                <p className="font-medium text-gray-900">{entry.subject_name}</p>
            </td>
            <td className="px-4 py-3 text-gray-700">{entry.section_code}</td>
            <td className="px-4 py-3 text-gray-600">{entry.grade_level ?? '—'}</td>
            <td className="px-4 py-3 text-gray-600">{entry.school_year ?? '—'}</td>
            <td className="px-4 py-3 text-right">
                <Link href={`/teacher/gradebook/${entry.block_section_id}`}>
                    <button className={TABLE_ROW_ACTION}>
                        <ChevronRight className="h-3 w-3" /> Open
                    </button>
                </Link>
            </td>
        </tr>
    );
}

function SectionRow({ section }: { section: BlockSection }) {
    return (
        <tr className="transition-colors hover:bg-gray-50">
            <td className="px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-blue-600">{section.code}</p>
                <p className="font-medium text-gray-900">{section.name}</p>
                {section.strand && <p className="text-xs text-gray-400">{section.strand}</p>}
            </td>
            <td className="px-4 py-3 text-gray-600">{section.grade_level ?? '—'}</td>
            <td className="px-4 py-3 text-gray-600">{section.school_year ?? '—'}</td>
            <td className="px-4 py-3 text-gray-600">{section.semester ?? '—'}</td>
            <td className="px-4 py-3 text-center text-gray-700">{section.subjects_count}</td>
            <td className="px-4 py-3 text-center text-gray-700">{section.enrollments_count}</td>
            <td className="px-4 py-3 text-right">
                <Link href={`/teacher/gradebook/${section.id}`}>
                    <button className={TABLE_ROW_ACTION}>
                        <ChevronRight className="h-3 w-3" /> Open
                    </button>
                </Link>
            </td>
        </tr>
    );
}

/** Admin gradebook index showing block sections — faculty see only their assigned sections; admins see all. */
export default function GradebookIndex({ isFaculty, mySubjects, blockSections }: Props) {
    const {
        currentPage, setCurrentPage,
        pageSize, setPageSize,
        subjectPage, setSubjectPage,
        subjectPageSize, setSubjectPageSize,
        paginatedSections,
        paginatedSubjects,
    } = useGradebook(mySubjects, blockSections);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gradebook" />

            <div className={PAGE_PADDING}>
                <div className="mb-6 flex items-start justify-between gap-4">
                    <h1 className={PAGE_TITLE}>Gradebook</h1>
                    <Link href="/teacher/gradebook/validations" className="shrink-0">
                        <Button variant="outline" size="sm">
                            <ClipboardCheck className="mr-1.5 h-4 w-4" />
                            Grade Validations
                        </Button>
                    </Link>
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
                                            <th className={TABLE_HEADER_CELL}>Subject</th>
                                            <th className={TABLE_HEADER_CELL}>Section</th>
                                            <th className={TABLE_HEADER_CELL}>Grade Level</th>
                                            <th className={TABLE_HEADER_CELL}>School Year</th>
                                            <th className="px-4 py-3" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {paginatedSubjects.map((entry) => (
                                            <SubjectRow key={`${entry.subject_id}-${entry.block_section_id}`} entry={entry} />
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
                ) : (
                    blockSections.length === 0 ? (
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
                                            <th className={TABLE_HEADER_CELL}>Section</th>
                                            <th className={TABLE_HEADER_CELL}>Grade Level</th>
                                            <th className={TABLE_HEADER_CELL}>School Year</th>
                                            <th className={TABLE_HEADER_CELL}>Semester</th>
                                            <th className={TABLE_HEADER_CELL_CENTER}>Subjects</th>
                                            <th className={TABLE_HEADER_CELL_CENTER}>Students</th>
                                            <th className="px-4 py-3" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {paginatedSections.map((section) => (
                                            <SectionRow key={section.id} section={section} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <TablePagination
                                total={blockSections.length}
                                pageSize={pageSize}
                                currentPage={currentPage}
                                onPageChange={setCurrentPage}
                                onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
                            />
                        </div>
                    )
                )}
            </div>
        </AppLayout>
    );
}
