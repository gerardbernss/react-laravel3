import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ClipboardCheck, History, Users } from 'lucide-react';

interface BlockSection {
    id: number;
    code: string;
    name: string;
    grade_level: string | null;
    strand: string | null;
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

export default function GradeSections({ gradeLevel, sections }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Attendance', href: '/attendance' },
        { title: gradeLevel, href: `/attendance/grade/${encodeURIComponent(gradeLevel)}` },
    ];

    const totalEnrolled = sections.reduce((sum, s) => sum + s.enrolled_count, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Attendance — ${gradeLevel}`} />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{gradeLevel}</h1>
                        <p className="mt-1 text-gray-600">
                            {sections.length} {sections.length === 1 ? 'section' : 'sections'} &middot; {totalEnrolled} enrolled
                        </p>
                    </div>
                    <Link href="/attendance">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Attendance
                        </Button>
                    </Link>
                </div>

                {/* Sections Table */}
                {sections.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                        <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 z-10 bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Code</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Section Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Strand</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Adviser</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">School Year</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Semester</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Enrolled</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {sections.map((section) => (
                                        <tr key={section.id} className="transition-colors hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-900">{section.code}</td>
                                            <td className="px-4 py-3 text-gray-900">{section.name}</td>
                                            <td className="px-4 py-3 text-gray-600">{section.strand || '—'}</td>
                                            <td className="px-4 py-3 text-gray-600">{section.adviser || '—'}</td>
                                            <td className="px-4 py-3 text-gray-600">{section.school_year || '—'}</td>
                                            <td className="px-4 py-3 text-gray-600">{section.semester || '—'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant="outline" className="gap-1">
                                                    <Users className="h-3 w-3" />
                                                    {section.enrolled_count}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center gap-2">
                                                    <Link href={`/attendance/${section.id}`}>
                                                        <Button variant="outline" size="sm">
                                                            <ClipboardCheck className="mr-1 h-4 w-4" />
                                                            Take Attendance
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/attendance/${section.id}/history`}>
                                                        <Button variant="ghost" size="sm">
                                                            <History className="mr-1 h-4 w-4" />
                                                            History
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
                        <p className="text-gray-500">No sections found for {gradeLevel}.</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
