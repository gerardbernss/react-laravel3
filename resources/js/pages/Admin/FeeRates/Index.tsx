import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Calculator, Edit, Eye, Plus, Search, Trash2, X } from 'lucide-react';
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
    fee_type: FeeType;
}

interface PaginatedData {
    data: FeeRate[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    feeRates: PaginatedData;
    filters: {
        search?: string;
        school_year?: string;
        semester?: string;
        category?: string;
        fee_type_id?: string;
    };
    schoolYears: string[];
    semesters: Record<string, string>;
    studentCategories: Record<string, string>;
    feeTypes: FeeType[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Fee Rates', href: '/admin/fee-rates' },
];

export default function Index({ feeRates, filters, schoolYears, semesters, studentCategories, feeTypes }: Props) {
    const { delete: destroy, processing } = useForm();
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number }>({ open: false, id: 0 });

    const handleSearch = (value: string) => {
        router.get('/admin/fee-rates', { ...filters, search: value || undefined }, { preserveState: true });
    };

    const handleFilter = (key: string, value: string) => {
        router.get('/admin/fee-rates', { ...filters, [key]: value === 'all' ? undefined : value }, { preserveState: true });
    };

    const handleDelete = (id: number) => {
        setDeleteDialog({ open: true, id });
    };

    const confirmDelete = () => {
        destroy(`/admin/fee-rates/${deleteDialog.id}`, {
            onSuccess: () => setDeleteDialog({ open: false, id: 0 }),
        });
    };

    const clearFilters = () => {
        router.get('/admin/fee-rates');
    };

    const hasFilters = filters.search || filters.school_year || filters.semester || filters.category || filters.fee_type_id;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Fee Rates" />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Fee Rates</h1>
                        <p className="mt-1 text-gray-600">Manage fee rates per school year and category</p>
                    </div>
                    <Link href="/admin/fee-rates/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Fee Rate
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-5">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search fee type..."
                                defaultValue={filters.search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* School Year Filter */}
                        <Select
                            value={filters.school_year || 'all'}
                            onValueChange={(v) => handleFilter('school_year', v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="School Year" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All School Years</SelectItem>
                                {schoolYears.map((year) => (
                                    <SelectItem key={year} value={year}>
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Semester Filter */}
                        <Select
                            value={filters.semester || 'all'}
                            onValueChange={(v) => handleFilter('semester', v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Semester" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Semesters</SelectItem>
                                {Object.entries(semesters).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Student Category Filter */}
                        <Select
                            value={filters.category || 'all'}
                            onValueChange={(v) => handleFilter('category', v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Student Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {Object.entries(studentCategories).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Fee Type Filter */}
                        <Select
                            value={filters.fee_type_id || 'all'}
                            onValueChange={(v) => handleFilter('fee_type_id', v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Fee Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Fee Types</SelectItem>
                                {feeTypes.map((type) => (
                                    <SelectItem key={type.id} value={type.id.toString()}>
                                        {type.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {hasFilters && (
                        <div className="mt-3 flex items-center gap-2">
                            <span className="text-sm text-gray-500">Active filters:</span>
                            <Button variant="ghost" size="sm" onClick={clearFilters}>
                                <X className="mr-1 h-3 w-3" />
                                Clear all
                            </Button>
                        </div>
                    )}
                </div>

                {/* Table */}
                {feeRates.data.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                        <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 z-10 bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Fee Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">School Year</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Semester</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Category</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {feeRates.data.map((rate) => (
                                        <tr key={rate.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-gray-900">{rate.fee_type.name}</p>
                                                    <p className="text-xs text-gray-500 font-mono">{rate.fee_type.code}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-medium">{rate.school_year}</td>
                                            <td className="px-4 py-3">{rate.semester}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline">
                                                    {studentCategories[rate.student_category]}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">
                                                ₱{parseFloat(rate.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge className={rate.is_active ? 'bg-green-100 text-green-800' : ''}>
                                                    {rate.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center gap-1">
                                                    <Link href={`/admin/fee-rates/${rate.id}`}>
                                                        <Button variant="outline" size="sm">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/admin/fee-rates/${rate.id}/edit`}>
                                                        <Button variant="outline" size="sm">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDelete(rate.id)}
                                                        disabled={processing}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {feeRates.last_page > 1 && (
                            <div className="flex items-center justify-between border-t px-4 py-3">
                                <p className="text-sm text-gray-600">
                                    Showing {(feeRates.current_page - 1) * feeRates.per_page + 1} to{' '}
                                    {Math.min(feeRates.current_page * feeRates.per_page, feeRates.total)} of{' '}
                                    {feeRates.total} results
                                </p>
                                <div className="flex gap-1">
                                    {feeRates.links.map((link, index) => (
                                        <Button
                                            key={index}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url)}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
                        <Calculator className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">No fee rates found</h3>
                        <p className="mt-2 text-gray-600">
                            {hasFilters
                                ? 'No fee rates match your filters. Try adjusting your search criteria.'
                                : 'Get started by creating your first fee rate.'}
                        </p>
                        {!hasFilters && (
                            <Link href="/admin/fee-rates/create">
                                <Button className="mt-4">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Fee Rate
                                </Button>
                            </Link>
                        )}
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, id: 0 })}
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
