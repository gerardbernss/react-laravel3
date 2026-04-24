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

interface Props {
    discountTypeOptions: Record<string, string>;
    appliesToOptions: Record<string, string>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Discounts', href: '/admin/discount-types' },
    { title: 'Create', href: '/admin/discount-types/create' },
];

export default function Create({ discountTypeOptions, appliesToOptions }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        code: '',
        discount_type: 'percentage',
        value: '',
        applies_to: 'tuition_only',
        requires_verification: true,
        is_stackable: false,
        max_discount_cap: '',
        description: '',
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/discount-types');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Discount Type" />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/admin/discount-types" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Discounts
                    </Link>
                    <h1 className="mt-2 text-3xl font-bold text-gray-900">Create Discount Type</h1>
                    <p className="mt-1 text-gray-600">Add a new discount type for enrollment assessments</p>
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
                                        placeholder="e.g., SIB, ACAD"
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
                                        placeholder="e.g., Sibling Discount"
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
                                            <SelectValue placeholder="Select type" />
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
                                        placeholder={data.discount_type === 'percentage' ? 'e.g., 20' : 'e.g., 5000'}
                                        className="mt-1"
                                    />
                                    <InputError message={errors.value} className="mt-1" />
                                    <p className="mt-1 text-xs text-gray-500">
                                        {data.discount_type === 'percentage'
                                            ? 'Enter percentage (0-100)'
                                            : 'Enter fixed amount in pesos'}
                                    </p>
                                </div>
                            </div>

                            {/* Applies To and Max Cap */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="applies_to">Applies To *</Label>
                                    <Select value={data.applies_to} onValueChange={(v) => setData('applies_to', v)}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select scope" />
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
                                    <p className="mt-1 text-xs text-gray-500">
                                        Leave blank for no cap
                                    </p>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Brief description of this discount type..."
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
                                <p className="ml-6 text-xs text-gray-500">
                                    Check if this discount requires admin verification before applying.
                                </p>

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
                                <p className="ml-6 text-xs text-gray-500">
                                    Check if this discount can be combined with other discounts.
                                </p>

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
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Create Discount Type
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
