import { AppTable } from '@/components/AppTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BODY_TEXT, CARD, PAGE_PADDING, PAGE_TITLE } from '@/constants/ui';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ClipboardCheck, History, Users } from 'lucide-react';

interface BlockSection {
    id: number;
    code: string;
    name: string;
    grade_level: string | null;
    school_year: string | null;
    semester: string | null;
    adviser: string | null;
    subjects_count: number;
    enrolled_count: number;
}

interface Props {
    gradeLevel: string;
    sections: BlockSection[];
}

/** Admin attendance grade-sections list showing all block sections for a given grade level with links to their attendance sheets. */
export default function GradeSections({ gradeLevel, sections }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Attendance', href: '/teacher/attendance' },
        { title: gradeLevel, href: `/teacher/attendance/grade/${encodeURIComponent(gradeLevel)}` },
    ];

    const totalEnrolled = sections.reduce((sum, s) => sum + Number(s.enrolled_count), 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Attendance — ${gradeLevel}`} />

            <div className={PAGE_PADDING}>
                <div className="mb-6">
                    <Link href="/teacher/attendance" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Attendance
                    </Link>
                    <h1 className={`mt-2 ${PAGE_TITLE}`}>{gradeLevel}</h1>
                    <p className={`mt-1 ${BODY_TEXT}`}>
                        {sections.length} {sections.length === 1 ? 'section' : 'sections'} &middot; {totalEnrolled} enrolled
                    </p>
                </div>

                {sections.length > 0 ? (
                    <AppTable>
                        <AppTable.Head>
                            <AppTable.Th>Code</AppTable.Th>
                            <AppTable.Th>Section Name</AppTable.Th>
                            <AppTable.Th>Adviser</AppTable.Th>
                            <AppTable.Th>School Year</AppTable.Th>
                            <AppTable.Th>Semester</AppTable.Th>
                            <AppTable.Th center>Enrolled</AppTable.Th>
                            <AppTable.Th center>Actions</AppTable.Th>
                        </AppTable.Head>
                        <AppTable.Body>
                            {sections.map((section) => (
                                <AppTable.Row key={section.id}>
                                    <AppTable.Td className="font-medium text-gray-900">{section.code}</AppTable.Td>
                                    <AppTable.Td className="text-gray-900">{section.name}</AppTable.Td>
                                    <AppTable.Td className="text-gray-600">{section.adviser || '—'}</AppTable.Td>
                                    <AppTable.Td className="text-gray-600">{section.school_year || '—'}</AppTable.Td>
                                    <AppTable.Td className="text-gray-600">{section.semester || '—'}</AppTable.Td>
                                    <AppTable.Td className="text-center">
                                        <Badge variant="outline" className="gap-1">
                                            <Users className="h-3 w-3" />
                                            {Number(section.enrolled_count)}
                                        </Badge>
                                    </AppTable.Td>
                                    <AppTable.Td>
                                        <div className="flex justify-center gap-2">
                                            <Link href={`/teacher/attendance/${section.id}`}>
                                                <Button variant="outline" size="sm">
                                                    <ClipboardCheck className="mr-1 h-4 w-4" />
                                                    Take Attendance
                                                </Button>
                                            </Link>
                                            <Link href={`/teacher/attendance/${section.id}/history`}>
                                                <Button variant="ghost" size="sm">
                                                    <History className="mr-1 h-4 w-4" />
                                                    History
                                                </Button>
                                            </Link>
                                        </div>
                                    </AppTable.Td>
                                </AppTable.Row>
                            ))}
                        </AppTable.Body>
                    </AppTable>
                ) : (
                    <div className={`${CARD} p-12 text-center`}>
                        <p className={BODY_TEXT}>No sections found for {gradeLevel}.</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
