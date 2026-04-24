import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, BookOpen, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface BlockSection {
    id: number;
    name: string;
    code: string;
    grade_level: string;
    school_year: string;
    pivot: {
        teacher: string | null;
    };
}

interface Subject {
    id: number;
    code: string;
    name: string;
    description: string | null;
    units: number;
    type: string;
    grade_level: string | null;
    semester: string | null;
    default_schedule: { display: string; room: string | null } | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    block_sections: BlockSection[];
}

interface Props {
    subject: Subject;
}

export default function Show({ subject }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Subjects', href: '/subjects' },
        { title: subject.code, href: `/subjects/${subject.id}` },
    ];

    const { delete: destroy, processing } = useForm();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const confirmDelete = () => {
        destroy(`/subjects/${subject.id}`, {
            onSuccess: () => setShowDeleteDialog(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${subject.code} - ${subject.name}`} />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/subjects" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Subjects
                    </Link>

                    <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-gray-900">{subject.code}</h1>
                                <Badge className={subject.is_active ? 'bg-green-100 text-green-800' : ''}>
                                    {subject.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            <p className="mt-1 text-xl text-gray-600">{subject.name}</p>
                        </div>

                        <div className="flex gap-2">
                            <Link href={`/subjects/${subject.id}/edit`}>
                                <Button variant="outline">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} disabled={processing}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Subject Details */}
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                            <BookOpen className="h-5 w-5" />
                            Subject Details
                        </h2>

                        <dl className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                <dt className="text-sm text-gray-500">Subject Code</dt>
                                <dd className="text-sm font-medium text-gray-900">{subject.code}</dd>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <dt className="text-sm text-gray-500">Subject Name</dt>
                                <dd className="text-sm font-medium text-gray-900">{subject.name}</dd>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <dt className="text-sm text-gray-500">Units</dt>
                                <dd className="text-sm font-medium text-gray-900">{subject.units}</dd>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <dt className="text-sm text-gray-500">Type</dt>
                                <dd className="text-sm">
                                    <Badge variant="outline">{subject.type}</Badge>
                                </dd>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <dt className="text-sm text-gray-500">Grade Level</dt>
                                <dd className="text-sm font-medium text-gray-900">{subject.grade_level || '—'}</dd>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <dt className="text-sm text-gray-500">Semester</dt>
                                <dd className="text-sm font-medium text-gray-900">{subject.semester || '—'}</dd>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <dt className="text-sm text-gray-500">Schedule</dt>
                                <dd className="text-sm font-medium text-gray-900">{subject.default_schedule?.display ?? '—'}</dd>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <dt className="text-sm text-gray-500">Room</dt>
                                <dd className="text-sm font-medium text-gray-900">{subject.default_schedule?.room ?? '—'}</dd>
                            </div>
                            {subject.description && (
                                <div className="border-t pt-4">
                                    <dt className="mb-2 text-sm text-gray-500">Description</dt>
                                    <dd className="text-sm text-gray-700">{subject.description}</dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    {/* Assigned Block Sections */}
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900">
                            Assigned to Block Sections ({subject.block_sections?.length || 0})
                        </h2>

                        {subject.block_sections && subject.block_sections.length > 0 ? (
                            <div className="space-y-3">
                                {subject.block_sections.map((section) => (
                                    <div key={section.id} className="rounded-lg border p-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900">{section.name}</p>
                                                <p className="text-sm text-gray-500">
                                                    {section.grade_level} • {section.school_year}
                                                </p>
                                            </div>
                                            <Link href={`/block-sections/${section.id}`}>
                                                <Button variant="ghost" size="sm">
                                                    View
                                                </Button>
                                            </Link>
                                        </div>
                                        {section.pivot.teacher && (
                                            <div className="mt-2 border-t pt-2 text-xs text-gray-500">
                                                <span>Teacher: {section.pivot.teacher}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500">Not assigned to any block sections yet.</p>
                        )}
                    </div>
                </div>
            </div>
            <ConfirmDialog
                open={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={confirmDelete}
                title="Delete Subject"
                description={`Are you sure you want to delete "${subject.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                processingLabel="Deleting..."
                processing={processing}
            />
        </AppLayout>
    );
}
