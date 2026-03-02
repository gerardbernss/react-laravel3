import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface FeeRate {
    id: number;
    school_year: string;
    semester: string;
    student_category: string;
    amount: string;
    is_active: boolean;
}

interface FeeType {
    id: number;
    name: string;
    code: string;
    category: string;
    is_per_unit: boolean;
    is_required: boolean;
    applies_to: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    rates: FeeRate[];
}

interface Props {
    feeType: FeeType;
    categories: Record<string, string>;
    appliesTo: Record<string, string>;
}

export default function Show({ feeType, categories, appliesTo }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Fee Types', href: '/admin/fee-types' },
        { title: feeType.name, href: `/admin/fee-types/${feeType.id}` },
    ];

    const { delete: destroy, processing } = useForm();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const confirmDelete = () => {
        destroy(`/admin/fee-types/${feeType.id}`, {
            onSuccess: () => setShowDeleteDialog(false),
        });
    };

    const getCategoryBadgeColor = (category: string) => {
        switch (category) {
            case 'tuition':
                return 'bg-blue-100 text-blue-800';
            case 'miscellaneous':
                return 'bg-purple-100 text-purple-800';
            case 'laboratory':
                return 'bg-orange-100 text-orange-800';
            case 'special':
                return 'bg-pink-100 text-pink-800';
            default:
                return '';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={feeType.name} />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <Link href="/admin/fee-types" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Back to Fee Types
                        </Link>
                        <h1 className="mt-2 text-3xl font-bold text-gray-900">{feeType.name}</h1>
                        <p className="mt-1 font-mono text-gray-600">{feeType.code}</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/admin/fee-types/${feeType.id}/edit`}>
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

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Details Card */}
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900">Fee Type Details</h2>
                        <dl className="grid gap-4">
                            <div>
                                <dt className="text-sm text-gray-500">Category</dt>
                                <dd className="mt-1">
                                    <Badge className={getCategoryBadgeColor(feeType.category)}>
                                        {categories[feeType.category]}
                                    </Badge>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm text-gray-500">Applies To</dt>
                                <dd className="mt-1 font-medium">{appliesTo[feeType.applies_to]}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-gray-500">Per Unit Fee</dt>
                                <dd className="mt-1">
                                    <Badge className={feeType.is_per_unit ? 'bg-green-100 text-green-800' : ''}>
                                        {feeType.is_per_unit ? 'Yes' : 'No'}
                                    </Badge>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm text-gray-500">Required</dt>
                                <dd className="mt-1">
                                    <Badge className={feeType.is_required ? 'bg-green-100 text-green-800' : ''}>
                                        {feeType.is_required ? 'Yes' : 'No'}
                                    </Badge>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm text-gray-500">Status</dt>
                                <dd className="mt-1">
                                    <Badge className={feeType.is_active ? 'bg-green-100 text-green-800' : ''}>
                                        {feeType.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </dd>
                            </div>
                            {feeType.description && (
                                <div>
                                    <dt className="text-sm text-gray-500">Description</dt>
                                    <dd className="mt-1 text-gray-700">{feeType.description}</dd>
                                </div>
                            )}
                            <div>
                                <dt className="text-sm text-gray-500">Created</dt>
                                <dd className="mt-1 text-gray-700">
                                    {new Date(feeType.created_at).toLocaleDateString()}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* Rates Card */}
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Fee Rates</h2>
                            <Link href={`/admin/fee-rates/create?fee_type_id=${feeType.id}`}>
                                <Button size="sm">Add Rate</Button>
                            </Link>
                        </div>

                        {feeType.rates && feeType.rates.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-semibold">School Year</th>
                                            <th className="px-3 py-2 text-left font-semibold">Semester</th>
                                            <th className="px-3 py-2 text-left font-semibold">Category</th>
                                            <th className="px-3 py-2 text-right font-semibold">Amount</th>
                                            <th className="px-3 py-2 text-center font-semibold">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {feeType.rates.map((rate) => (
                                            <tr key={rate.id} className="hover:bg-gray-50">
                                                <td className="px-3 py-2">{rate.school_year}</td>
                                                <td className="px-3 py-2">{rate.semester}</td>
                                                <td className="px-3 py-2">{rate.student_category}</td>
                                                <td className="px-3 py-2 text-right font-medium">
                                                    ₱{parseFloat(rate.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    <Badge className={rate.is_active ? 'bg-green-100 text-green-800' : ''}>
                                                        {rate.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="py-8 text-center text-gray-500">
                                <p>No rates configured for this fee type.</p>
                                <Link href={`/admin/fee-rates/create?fee_type_id=${feeType.id}`}>
                                    <Button size="sm" className="mt-2">
                                        Add First Rate
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <ConfirmDialog
                open={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={confirmDelete}
                title="Delete Fee Type"
                description={`Are you sure you want to delete "${feeType.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                processingLabel="Deleting..."
                processing={processing}
            />
        </AppLayout>
    );
}
