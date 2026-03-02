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
    categories: Record<string, string>;
    appliesTo: Record<string, string>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Fee Types', href: '/admin/fee-types' },
    { title: 'Create', href: '/admin/fee-types/create' },
];

export default function Create({ categories, appliesTo }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        code: '',
        category: 'miscellaneous',
        is_per_unit: false,
        is_required: true,
        applies_to: 'all',
        description: '',
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/fee-types');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Fee Type" />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/admin/fee-types" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Fee Types
                    </Link>
                    <h1 className="mt-2 text-3xl font-bold text-gray-900">Create Fee Type</h1>
                    <p className="mt-1 text-gray-600">Add a new fee type for enrollment assessments</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="max-w-2xl">
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <div className="grid gap-6">
                            {/* Code and Name */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="code">Fee Code *</Label>
                                    <Input
                                        id="code"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                        placeholder="e.g., TF, REG, LIB"
                                        maxLength={20}
                                        className="mt-1"
                                    />
                                    <InputError message={errors.code} className="mt-1" />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Short code for reports (max 20 chars)
                                    </p>
                                </div>
                                <div>
                                    <Label htmlFor="name">Fee Name *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g., Tuition Fee, Registration Fee"
                                        className="mt-1"
                                    />
                                    <InputError message={errors.name} className="mt-1" />
                                </div>
                            </div>

                            {/* Category and Applies To */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="category">Category *</Label>
                                    <Select value={data.category} onValueChange={(v) => setData('category', v)}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(categories).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.category} className="mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="applies_to">Applies To *</Label>
                                    <Select value={data.applies_to} onValueChange={(v) => setData('applies_to', v)}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select who this applies to" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(appliesTo).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.applies_to} className="mt-1" />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Brief description of the fee type..."
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
                                        id="is_per_unit"
                                        checked={data.is_per_unit}
                                        onChange={(e) => setData('is_per_unit', e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <Label htmlFor="is_per_unit" className="cursor-pointer">
                                        Per Unit Fee
                                    </Label>
                                </div>
                                <p className="ml-6 text-xs text-gray-500">
                                    Check if this fee is charged per unit (e.g., Tuition Fee). Leave unchecked for fixed fees.
                                </p>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is_required"
                                        checked={data.is_required}
                                        onChange={(e) => setData('is_required', e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <Label htmlFor="is_required" className="cursor-pointer">
                                        Required Fee
                                    </Label>
                                </div>
                                <p className="ml-6 text-xs text-gray-500">
                                    Check if this fee is mandatory for all applicable students.
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
                                <p className="ml-6 text-xs text-gray-500">
                                    Only active fee types can be used in assessments.
                                </p>
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
                                        Create Fee Type
                                    </>
                                )}
                            </Button>
                            <Link href="/admin/fee-types">
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
