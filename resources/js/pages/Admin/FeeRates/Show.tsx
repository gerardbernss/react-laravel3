import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface FeeType {
    id: number;
    name: string;
    code: string;
    category: string;
}

interface FeeRate {
    id: number;
    fee_type_id: number;
    school_year: string;
    semester: string;
    student_category: string;
    amount: string;
    effective_date: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    fee_type: FeeType;
}

interface Props {
    feeRate: FeeRate;
    semesters: Record<string, string>;
    studentCategories: Record<string, string>;
}

export default function Show({ feeRate, semesters, studentCategories }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Fee Rates', href: '/admin/fee-rates' },
        { title: `${feeRate.fee_type.name} - ${feeRate.school_year}`, href: `/admin/fee-rates/${feeRate.id}` },
    ];

    const { delete: destroy, processing } = useForm();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const confirmDelete = () => {
        destroy(`/admin/fee-rates/${feeRate.id}`, {
            onSuccess: () => setShowDeleteDialog(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${feeRate.fee_type.name} - ${feeRate.school_year}`} />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <Link href="/admin/fee-rates" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Back to Fee Rates
                        </Link>
                        <h1 className="mt-2 text-3xl font-bold text-gray-900">{feeRate.fee_type.name}</h1>
                        <p className="mt-1 text-gray-600">{feeRate.school_year} • {feeRate.semester}</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/admin/fee-rates/${feeRate.id}/edit`}>
                            <Button variant="outline">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(true)} disabled={processing} className="text-red-600 hover:text-red-700">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                {/* Details Card */}
                <div className="max-w-2xl rounded-lg border bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">Fee Rate Details</h2>
                    <dl className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <dt className="text-sm text-gray-500">Fee Type</dt>
                            <dd className="mt-1">
                                <Link href={`/admin/fee-types/${feeRate.fee_type.id}`} className="font-medium text-primary hover:underline">
                                    {feeRate.fee_type.name}
                                </Link>
                                <span className="ml-2 text-sm text-gray-500 font-mono">({feeRate.fee_type.code})</span>
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-500">School Year</dt>
                            <dd className="mt-1 font-medium">{feeRate.school_year}</dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-500">Semester</dt>
                            <dd className="mt-1 font-medium">{semesters[feeRate.semester]}</dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-500">Student Category</dt>
                            <dd className="mt-1">
                                <Badge variant="outline">{studentCategories[feeRate.student_category]}</Badge>
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-500">Amount</dt>
                            <dd className="mt-1 text-2xl font-bold text-primary">
                                ₱{parseFloat(feeRate.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-500">Status</dt>
                            <dd className="mt-1">
                                <Badge className={feeRate.is_active ? 'bg-green-100 text-green-800' : ''}>
                                    {feeRate.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </dd>
                        </div>
                        {feeRate.effective_date && (
                            <div>
                                <dt className="text-sm text-gray-500">Effective Date</dt>
                                <dd className="mt-1 font-medium">
                                    {new Date(feeRate.effective_date).toLocaleDateString()}
                                </dd>
                            </div>
                        )}
                        <div>
                            <dt className="text-sm text-gray-500">Created</dt>
                            <dd className="mt-1 text-gray-700">
                                {new Date(feeRate.created_at).toLocaleDateString()}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-500">Last Updated</dt>
                            <dd className="mt-1 text-gray-700">
                                {new Date(feeRate.updated_at).toLocaleDateString()}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>
            <ConfirmDialog
                open={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={confirmDelete}
                title="Delete Fee Rate"
                description="Are you sure you want to delete this fee rate? This action cannot be undone."
                confirmLabel="Delete"
                processingLabel="Deleting..."
                processing={processing}
            />
        </AppLayout>
    );
}
