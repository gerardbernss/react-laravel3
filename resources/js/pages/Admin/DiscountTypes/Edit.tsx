import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

interface DiscountType {
    id: number;
    name: string;
    code: string;
    discount_type: string;
    value: string;
    applies_to: string;
    requires_verification: boolean;
    is_stackable: boolean;
    max_discount_cap: string | null;
    description: string | null;
    is_active: boolean;
}

interface Props {
    discountType: DiscountType;
    discountTypeOptions: Record<string, string>;
    appliesToOptions: Record<string, string>;
}

export default function Edit({ discountType, discountTypeOptions, appliesToOptions }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Discount Types', href: '/admin/discount-types' },
        { title: discountType.name, href: `/admin/discount-types/${discountType.id}` },
        { title: 'Edit', href: `/admin/discount-types/${discountType.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: discountType.name,
        code: discountType.code,
        discount_type: discountType.discount_type,
        value: discountType.value,
        applies_to: discountType.applies_to,
        requires_verification: discountType.requires_verification,
        is_stackable: discountType.is_stackable,
        max_discount_cap: discountType.max_discount_cap || '',
        description: discountType.description || '',
        is_active: discountType.is_active,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/discount-types/${discountType.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${discountType.name}`} />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/admin/discount-types" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Discount Types
                    </Link>
                    <h1 className="mt-2 text-3xl font-bold text-gray-900">Edit Discount Type</h1>
                    <p className="mt-1 text-gray-600">Update {discountType.name}</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="max-w-2xl">
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <div className="grid gap-6">
                            {/* Code and Name */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="code">Discount Code *</Label>
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
                                    <Label htmlFor="name">Discount Name *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="mt-1"
                                    />
                                    <InputError message={errors.name} className="mt-1" />
                                </div>
                            </div>

                            {/* Discount Type and Value */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="discount_type">Discount Type *</Label>
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
                                    <Label htmlFor="value">
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

                            {/* Applies To and Max Cap */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="applies_to">Applies To *</Label>
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
                                    <Label htmlFor="max_discount_cap">Maximum Discount Cap (₱)</Label>
                                    <Input
                                        id="max_discount_cap"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.max_discount_cap}
                                        onChange={(e) => setData('max_discount_cap', e.target.value)}
                                        placeholder="Optional"
                                        className="mt-1"
                                    />
                                    <InputError message={errors.max_discount_cap} className="mt-1" />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className="mt-1"
                                    rows={3}
                                />
                                <InputError message={errors.description} className="mt-1" />
                            </div>

                            {/* Checkboxes */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="requires_verification"
                                        checked={data.requires_verification}
                                        onChange={(e) => setData('requires_verification', e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <Label htmlFor="requires_verification" className="cursor-pointer">
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
                                    <Label htmlFor="is_stackable" className="cursor-pointer">
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
                                    <Label htmlFor="is_active" className="cursor-pointer">
                                        Active
                                    </Label>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
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
