import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

interface FeeType {
    id: number;
    name: string;
    code: string;
    category: string;
}

interface Props {
    feeTypes: FeeType[];
    semesters: Record<string, string>;
    studentCategories: Record<string, string>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Fee Rates', href: '/admin/fee-rates' },
    { title: 'Create', href: '/admin/fee-rates/create' },
];

export default function Create({ feeTypes, semesters, studentCategories }: Props) {
    // Get pre-selected fee_type_id from URL if provided
    const { url } = usePage();
    const urlParams = new URLSearchParams(url.split('?')[1] || '');
    const preselectedFeeTypeId = urlParams.get('fee_type_id') || '';

    const currentYear = new Date().getFullYear();
    const defaultSchoolYear = `${currentYear}-${currentYear + 1}`;

    const { data, setData, post, processing, errors } = useForm({
        fee_type_id: preselectedFeeTypeId,
        school_year: defaultSchoolYear,
        semester: 'Yearly',
        student_category: 'all',
        amount: '',
        effective_date: '',
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/fee-rates');
    };

    // Generate school year options
    const schoolYearOptions = [];
    for (let i = -2; i <= 3; i++) {
        const year = currentYear + i;
        schoolYearOptions.push(`${year}-${year + 1}`);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Fee Rate" />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/admin/fee-rates" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Fee Rates
                    </Link>
                    <h1 className="mt-2 text-3xl font-bold text-gray-900">Create Fee Rate</h1>
                    <p className="mt-1 text-gray-600">Set a rate for a fee type</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="max-w-2xl">
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <div className="grid gap-6">
                            {/* Fee Type */}
                            <div>
                                <Label htmlFor="fee_type_id">Fee Type *</Label>
                                <Select
                                    value={data.fee_type_id}
                                    onValueChange={(v) => setData('fee_type_id', v)}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select a fee type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {feeTypes.map((type) => (
                                            <SelectItem key={type.id} value={type.id.toString()}>
                                                {type.name} ({type.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.fee_type_id} className="mt-1" />
                            </div>

                            {/* School Year and Semester */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="school_year">School Year *</Label>
                                    <Select
                                        value={data.school_year}
                                        onValueChange={(v) => setData('school_year', v)}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select school year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {schoolYearOptions.map((year) => (
                                                <SelectItem key={year} value={year}>
                                                    {year}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.school_year} className="mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="semester">Semester *</Label>
                                    <Select
                                        value={data.semester}
                                        onValueChange={(v) => setData('semester', v)}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select semester" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(semesters).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.semester} className="mt-1" />
                                </div>
                            </div>

                            {/* Student Category and Amount */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="student_category">Student Category *</Label>
                                    <Select
                                        value={data.student_category}
                                        onValueChange={(v) => setData('student_category', v)}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(studentCategories).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.student_category} className="mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="amount">Amount (₱) *</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.amount}
                                        onChange={(e) => setData('amount', e.target.value)}
                                        placeholder="0.00"
                                        className="mt-1"
                                    />
                                    <InputError message={errors.amount} className="mt-1" />
                                </div>
                            </div>

                            {/* Effective Date */}
                            <div>
                                <Label htmlFor="effective_date">Effective Date</Label>
                                <Input
                                    id="effective_date"
                                    type="date"
                                    value={data.effective_date}
                                    onChange={(e) => setData('effective_date', e.target.value)}
                                    className="mt-1"
                                />
                                <InputError message={errors.effective_date} className="mt-1" />
                                <p className="mt-1 text-xs text-gray-500">
                                    Optional. Leave blank if the rate is effective immediately.
                                </p>
                            </div>

                            {/* Active Status */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="is_active" className="cursor-pointer">
                                    Active (Rate is available for assessment calculations)
                                </Label>
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
                                        Create Fee Rate
                                    </>
                                )}
                            </Button>
                            <Link href="/admin/fee-rates">
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
