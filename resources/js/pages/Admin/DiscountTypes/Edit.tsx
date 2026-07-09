import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BODY_TEXT, CARD, LABEL_TEXT, PAGE_PADDING, PAGE_TITLE } from '@/constants/ui';
import { type DiscountType, useDiscountTypeEdit } from '@/hooks/useDiscountTypeEdit';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

interface Props {
    discountType: DiscountType;
    discountTypeOptions: Record<string, string>;
    appliesToOptions: Record<string, string>;
}

/** Admin discount type edit form for updating an existing discount's name, type, value, and applicable fee categories. */
export default function Edit({ discountType, discountTypeOptions, appliesToOptions }: Props) {
    const { data, setData, processing, errors, handleSubmit, breadcrumbs } = useDiscountTypeEdit({ discountType });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${discountType.name}`} />

            <div className={PAGE_PADDING}>
                <div className="mb-6">
                    <Link href="/admin/discount-types" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Discounts
                    </Link>
                    <h1 className={`mt-2 ${PAGE_TITLE}`}>Edit Discount Type</h1>
                    <p className={`mt-1 ${BODY_TEXT}`}>Update {discountType.name}</p>
                </div>

                <form onSubmit={handleSubmit} className="max-w-2xl">
                    <div className={`${CARD} p-6`}>
                        <div className="grid gap-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="code" className={LABEL_TEXT}>Discount Code *</Label>
                                    <Input
                                        id="code"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                        maxLength={20}
                                        className="mt-1"
                                    />
                                    <InputError message={errors.code} className="mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="name" className={LABEL_TEXT}>Discount Name *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="mt-1"
                                    />
                                    <InputError message={errors.name} className="mt-1" />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="discount_type" className={LABEL_TEXT}>Discount Type *</Label>
                                    <Select value={data.discount_type} onValueChange={(v) => setData('discount_type', v)}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(discountTypeOptions).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.discount_type} className="mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="value" className={LABEL_TEXT}>
                                        Value * {data.discount_type === 'percentage' ? '(%)' : '(₱)'}
                                    </Label>
                                    <Input
                                        id="value"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max={data.discount_type === 'percentage' ? 100 : undefined}
                                        value={data.value}
                                        onChange={(e) => setData('value', e.target.value)}
                                        className="mt-1"
                                    />
                                    <InputError message={errors.value} className="mt-1" />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="applies_to" className={LABEL_TEXT}>Applies To *</Label>
                                <Select value={data.applies_to} onValueChange={(v) => setData('applies_to', v)}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(appliesToOptions).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.applies_to} className="mt-1" />
                            </div>

                            <div>
                                <Label htmlFor="description" className={LABEL_TEXT}>Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className="mt-1"
                                    rows={3}
                                />
                                <InputError message={errors.description} className="mt-1" />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="requires_verification"
                                        checked={data.requires_verification}
                                        onChange={(e) => setData('requires_verification', e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <Label htmlFor="requires_verification" className={`cursor-pointer ${LABEL_TEXT}`}>
                                        Requires Verification
                                    </Label>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is_stackable"
                                        checked={data.is_stackable}
                                        onChange={(e) => setData('is_stackable', e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <Label htmlFor="is_stackable" className={`cursor-pointer ${LABEL_TEXT}`}>
                                        Stackable
                                    </Label>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <Label htmlFor="is_active" className={`cursor-pointer ${LABEL_TEXT}`}>
                                        Active
                                    </Label>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <Button type="submit" disabled={processing}>
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                            <Link href="/admin/discount-types">
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </Link>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
