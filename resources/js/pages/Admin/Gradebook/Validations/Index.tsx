import { TablePagination } from '@/components/ui/table-pagination';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, BookOpen, ChevronRight, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

interface SectionRow {
    id: number;
    code: string;
    name: string;
    grade_level: string | null;
    strand: string | null;
    school_year: string | null;
    semester: string | null;
    subjects_count: number;
}

interface SubjectEntry {
    subject_id: number;
    subject_code: string;
    subject_name: string;
    block_section_id: number;
    section_code: string;
    section_name: string;
    grade_level: string | null;
    school_year: string | null;
}

interface Props {
    isFaculty: boolean;
    mySubjects: SubjectEntry[];
    sections: SectionRow[];
    canFinalize: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Gradebook', href: '/gradebook' },
    { title: 'Validations', href: '/gradebook/validations' },
];

export default function ValidationsIndex({ isFaculty, mySubjects, sections }: Props) {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const totalPages = Math.ceil(sections.length / pageSize);
    const paginatedSections = useMemo(
        () => sections.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [sections, currentPage, pageSize],
    );

    const [subjectPage, setSubjectPage] = useState(1);
    const [subjectPageSize, setSubjectPageSize] = useState(10);
    const paginatedSubjects = useMemo(
        () => mySubjects.slice((subjectPage - 1) * subjectPageSize, subjectPage * subjectPageSize),
        [mySubjects, subjectPage, subjectPageSize],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Grade Validations" />

            <div className="p-6 md:p-10">
                <div className="mb-6">
                    <Link href="/gradebook" className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Gradebook
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Grade Validations</h1>
                    <p className="mt-1 text-gray-600">
                        {isFaculty
                            ? 'Track the validation status of your submitted grades.'
                            : 'Review and finalize grade submissions from faculty.'}
                    </p>
                </div>

                {isFaculty ? (
                    mySubjects.length === 0 ? (
                        <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
                            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-4 text-lg font-semibold text-gray-900">No subjects assigned</h3>
                            <p className="mt-2 text-gray-600">You have no subjects assigned to you.</p>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
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
                                                        href={`/gradebook/validations/${entry.block_section_id}`}
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
                ) : (
                    sections.length === 0 ? (
                        <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
                            <Users className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-4 text-lg font-semibold text-gray-900">No sections found</h3>
                            <p className="mt-2 text-gray-600">No block sections have been created yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
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
                                                        href={`/gradebook/validations/${section.id}`}
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
                    )
                )}
            </div>
        </AppLayout>
    );
}
