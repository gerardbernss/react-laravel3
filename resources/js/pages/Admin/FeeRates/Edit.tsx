import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

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
    fee_type: FeeType;
}

interface Props {
    feeRate: FeeRate;
    feeTypes: FeeType[];
    semesters: Record<string, string>;
    studentCategories: Record<string, string>;
}

export default function Edit({ feeRate, feeTypes, semesters, studentCategories }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Fee Rates', href: '/admin/fee-rates' },
        { title: `${feeRate.fee_type.name} - ${feeRate.school_year}`, href: `/admin/fee-rates/${feeRate.id}` },
        { title: 'Edit', href: `/admin/fee-rates/${feeRate.id}/edit` },
    ];

    const currentYear = new Date().getFullYear();

    const { data, setData, put, processing, errors } = useForm({
        fee_type_id: feeRate.fee_type_id.toString(),
        school_year: feeRate.school_year,
        semester: feeRate.semester,
        student_category: feeRate.student_category,
        amount: feeRate.amount,
        effective_date: feeRate.effective_date || '',
        is_active: feeRate.is_active,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/fee-rates/${feeRate.id}`);
    };

    // Generate school year options
    const schoolYearOptions = [];
    for (let i = -2; i <= 3; i++) {
        const year = currentYear + i;
        schoolYearOptions.push(`${year}-${year + 1}`);
    }
    // Ensure current rate's school year is included
    if (!schoolYearOptions.includes(feeRate.school_year)) {
        schoolYearOptions.unshift(feeRate.school_year);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Fee Rate" />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/admin/fee-rates" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Fee Rates
                    </Link>
                    <h1 className="mt-2 text-3xl font-bold text-gray-900">Edit Fee Rate</h1>
                    <p className="mt-1 text-gray-600">Update rate for {feeRate.fee_type.name}</p>
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
                                    Active
                                </Label>
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
