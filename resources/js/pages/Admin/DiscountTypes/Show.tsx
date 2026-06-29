import { AppBadge } from '@/components/AppBadge';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BODY_TEXT, CARD, PAGE_PADDING, PAGE_TITLE, SECTION_HEADING } from '@/constants/ui';
import { type DiscountType, useDiscountTypeShow } from '@/hooks/useDiscountTypeShow';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';

interface Props {
    discountType: DiscountType;
    discountTypeOptions: Record<string, string>;
    appliesToOptions: Record<string, string>;
}

function formatValue(discountType: DiscountType): string {
    if (discountType.discount_type === 'percentage') {
        return `${discountType.value}%`;
    }
    return `₱${parseFloat(discountType.value).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

export default function Show({ discountType, discountTypeOptions, appliesToOptions }: Props) {
    const { breadcrumbs, processing, showDeleteDialog, setShowDeleteDialog, confirmDelete } = useDiscountTypeShow({
        discountType,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={discountType.name} />

            <div className={PAGE_PADDING}>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <Link href="/admin/discount-types" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Back to Discounts
                        </Link>
                        <h1 className={`mt-2 ${PAGE_TITLE}`}>{discountType.name}</h1>
                        <p className={`mt-1 font-mono ${BODY_TEXT}`}>{discountType.code}</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/admin/discount-types/${discountType.id}/edit`}>
                            <Button variant="outline">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteDialog(true)}
                            disabled={processing}
                            className="text-red-600 hover:text-red-700"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                <div className={`max-w-2xl ${CARD} p-6`}>
                    <h2 className={`mb-4 ${SECTION_HEADING}`}>Discount Type Details</h2>
                    <dl className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <dt className="text-sm text-gray-500">Discount Value</dt>
                            <dd className="mt-1 text-2xl font-bold text-primary">{formatValue(discountType)}</dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-500">Discount Type</dt>
                            <dd className="mt-1">
                                <Badge variant="outline">{discountTypeOptions[discountType.discount_type]}</Badge>
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-500">Applies To</dt>
                            <dd className="mt-1 font-medium">{appliesToOptions[discountType.applies_to]}</dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-500">Requires Verification</dt>
                            <dd className="mt-1">
                                <Badge className={discountType.requires_verification ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                                    {discountType.requires_verification ? 'Yes' : 'No (Auto-apply)'}
                                </Badge>
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-500">Stackable</dt>
                            <dd className="mt-1">
                                <Badge className={discountType.is_stackable ? 'bg-green-100 text-green-800' : ''}>
                                    {discountType.is_stackable ? 'Yes' : 'No'}
                                </Badge>
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-500">Status</dt>
                            <dd className="mt-1">
                                <AppBadge status={discountType.is_active ? 'active' : 'inactive'}>
                                    {discountType.is_active ? 'Active' : 'Inactive'}
                                </AppBadge>
                            </dd>
                        </div>
                        {discountType.description && (
                            <div className="sm:col-span-2">
                                <dt className="text-sm text-gray-500">Description</dt>
                                <dd className="mt-1 text-gray-700">{discountType.description}</dd>
                            </div>
                        )}
                        <div>
                            <dt className="text-sm text-gray-500">Created</dt>
                            <dd className="mt-1 text-gray-700">{new Date(discountType.created_at).toLocaleDateString()}</dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-500">Last Updated</dt>
                            <dd className="mt-1 text-gray-700">{new Date(discountType.updated_at).toLocaleDateString()}</dd>
                        </div>
                    </dl>
                </div>
            </div>

            <ConfirmDialog
                open={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={confirmDelete}
                title="Delete Discount Type"
                description={`Are you sure you want to delete "${discountType.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                processingLabel="Deleting..."
                processing={processing}
            />
        </AppLayout>
    );
}
