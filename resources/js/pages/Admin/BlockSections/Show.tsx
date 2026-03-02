import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, BookOpen, Edit, LayoutGrid, Trash2, Users } from 'lucide-react';
import { useState } from 'react';

interface Subject {
    id: number;
    code: string;
    name: string;
    units: number;
    type: string;
    pivot: {
        teacher: string | null;
        schedule: string | null;
        room: string | null;
    };
}

interface BlockSection {
    id: number;
    name: string;
    code: string;
    grade_level: string;
    school_year: string;
    semester: string | null;
    adviser: string | null;
    room: string | null;
    capacity: number;
    current_enrollment: number;
    schedule: string | null;
    is_active: boolean;
    created_at: string;
    subjects: Subject[];
}

interface Props {
    blockSection: BlockSection;
}

export default function Show({ blockSection }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Block Sections', href: '/block-sections' },
        { title: blockSection.code, href: `/block-sections/${blockSection.id}` },
    ];

    const { delete: destroy, processing } = useForm();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const confirmDelete = () => {
        destroy(`/block-sections/${blockSection.id}`, {
            onSuccess: () => setShowDeleteDialog(false),
        });
    };

    const totalUnits = blockSection.subjects.reduce((sum, s) => sum + s.units, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${blockSection.code} - ${blockSection.name}`} />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/block-sections" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Block Sections
                    </Link>

                    <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-gray-900">{blockSection.name}</h1>
                                <Badge className={blockSection.is_active ? 'bg-green-100 text-green-800' : ''}>
                                    {blockSection.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            <p className="mt-1 text-gray-600">
                                {blockSection.code} • {blockSection.grade_level} • {blockSection.school_year}
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Link href={`/block-sections/${blockSection.id}/edit`}>
                                <Button variant="outline">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                            <Button
                                variant="destructive"
                                onClick={() => setShowDeleteDialog(true)}
                                disabled={processing || blockSection.current_enrollment > 0}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Section Details */}
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                            <LayoutGrid className="h-5 w-5" />
                            Section Details
                        </h2>

                        <dl className="space-y-3">
                            <div className="flex justify-between">
                                <dt className="text-sm text-gray-500">Section Code</dt>
                                <dd className="text-sm font-medium text-gray-900">{blockSection.code}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-sm text-gray-500">Grade Level</dt>
                                <dd className="text-sm font-medium text-gray-900">{blockSection.grade_level}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-sm text-gray-500">School Year</dt>
                                <dd className="text-sm font-medium text-gray-900">{blockSection.school_year}</dd>
                            </div>
                            {blockSection.semester && (
                                <div className="flex justify-between">
                                    <dt className="text-sm text-gray-500">Semester</dt>
                                    <dd className="text-sm font-medium text-gray-900">{blockSection.semester}</dd>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <dt className="text-sm text-gray-500">Adviser</dt>
                                <dd className="text-sm font-medium text-gray-900">{blockSection.adviser || '—'}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-sm text-gray-500">Room</dt>
                                <dd className="text-sm font-medium text-gray-900">{blockSection.room || '—'}</dd>
                            </div>
                            {blockSection.schedule && (
                                <div className="border-t pt-3">
                                    <dt className="mb-1 text-sm text-gray-500">Schedule</dt>
                                    <dd className="text-sm text-gray-700">{blockSection.schedule}</dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    {/* Enrollment Stats */}
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                            <Users className="h-5 w-5" />
                            Enrollment
                        </h2>

                        <div className="text-center">
                            <div className="text-4xl font-bold text-primary">
                                {blockSection.current_enrollment}
                                <span className="text-xl text-gray-400">/{blockSection.capacity}</span>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">Students Enrolled</p>

                            <div className="mt-4">
                                <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                                    <div
                                        className={`h-full rounded-full transition-all ${
                                            blockSection.current_enrollment >= blockSection.capacity
                                                ? 'bg-red-500'
                                                : blockSection.current_enrollment >= blockSection.capacity * 0.8
                                                  ? 'bg-yellow-500'
                                                  : 'bg-green-500'
                                        }`}
                                        style={{
                                            width: `${Math.min((blockSection.current_enrollment / blockSection.capacity) * 100, 100)}%`,
                                        }}
                                    />
                                </div>
                                <p className="mt-2 text-sm text-gray-500">
                                    {blockSection.capacity - blockSection.current_enrollment} slots available
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 border-t pt-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Total Subjects</span>
                                <span className="font-medium">{blockSection.subjects.length}</span>
                            </div>
                            <div className="mt-2 flex justify-between text-sm">
                                <span className="text-gray-500">Total Units</span>
                                <span className="font-medium">{totalUnits}</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h2>

                        <div className="space-y-2">
                            <Link href={`/block-sections/${blockSection.id}/edit`} className="block">
                                <Button variant="outline" className="w-full justify-start">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Section Details
                                </Button>
                            </Link>
                            <Button variant="outline" className="w-full justify-start" disabled>
                                <Users className="mr-2 h-4 w-4" />
                                View Enrolled Students
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Assigned Subjects */}
                <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                        <BookOpen className="h-5 w-5" />
                        Assigned Subjects ({blockSection.subjects.length})
                    </h2>

                    {blockSection.subjects.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Code</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Subject Name</th>
                                        <th className="px-4 py-3 text-center font-semibold text-gray-900">Units</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Type</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Teacher</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Schedule</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Room</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {blockSection.subjects.map((subject) => (
                                        <tr key={subject.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <Link href={`/subjects/${subject.id}`} className="font-medium text-primary hover:underline">
                                                    {subject.code}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-gray-900">{subject.name}</td>
                                            <td className="px-4 py-3 text-center">{subject.units}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline">{subject.type}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{subject.pivot.teacher || '—'}</td>
                                            <td className="px-4 py-3 text-gray-600">{subject.pivot.schedule || '—'}</td>
                                            <td className="px-4 py-3 text-gray-600">{subject.pivot.room || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50">
                                    <tr>
                                        <td colSpan={2} className="px-4 py-3 text-right font-semibold">
                                            Total
                                        </td>
                                        <td className="px-4 py-3 text-center font-semibold">{totalUnits}</td>
                                        <td colSpan={4}></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ) : (
                        <div className="rounded-lg border border-dashed p-8 text-center">
                            <BookOpen className="mx-auto h-10 w-10 text-gray-400" />
                            <p className="mt-2 text-gray-500">No subjects assigned to this section yet.</p>
                            <Link href={`/block-sections/${blockSection.id}/edit`}>
                                <Button variant="outline" className="mt-4">
                                    Assign Subjects
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
            <ConfirmDialog
                open={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={confirmDelete}
                title="Delete Block Section"
                description={`Are you sure you want to delete "${blockSection.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                processingLabel="Deleting..."
                processing={processing}
            />
        </AppLayout>
    );
}
