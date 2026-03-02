import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { DollarSign, Edit, Eye, Plus, Search, Trash2, X } from 'lucide-react';
import { useState } from 'react';

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
}

interface PaginatedData {
    data: FeeType[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    feeTypes: PaginatedData;
    filters: {
        search?: string;
        category?: string;
        status?: string;
    };
    categories: Record<string, string>;
    appliesTo: Record<string, string>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Fee Types', href: '/admin/fee-types' },
];

export default function Index({ feeTypes, filters, categories, appliesTo }: Props) {
    const { delete: destroy, processing } = useForm();
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; name: string }>({ open: false, id: 0, name: '' });

    const handleSearch = (value: string) => {
        router.get('/admin/fee-types', { ...filters, search: value || undefined }, { preserveState: true });
    };

    const handleFilter = (key: string, value: string) => {
        router.get('/admin/fee-types', { ...filters, [key]: value === 'all' ? undefined : value }, { preserveState: true });
    };

    const handleDelete = (id: number, name: string) => {
        setDeleteDialog({ open: true, id, name });
    };

    const confirmDelete = () => {
        destroy(`/admin/fee-types/${deleteDialog.id}`, {
            onSuccess: () => setDeleteDialog({ open: false, id: 0, name: '' }),
        });
    };

    const clearFilters = () => {
        router.get('/admin/fee-types');
    };

    const hasFilters = filters.search || filters.category || filters.status;

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
            <Head title="Fee Types" />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Fee Types</h1>
                        <p className="mt-1 text-gray-600">Manage fee types for enrollment assessments</p>
                    </div>
                    <Link href="/admin/fee-types/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Fee Type
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-4">
                        {/* Search */}
                        <div className="relative md:col-span-2">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search by name or code..."
                                defaultValue={filters.search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Category Filter */}
                        <Select
                            value={filters.category || 'all'}
                            onValueChange={(v) => handleFilter('category', v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {Object.entries(categories).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Status Filter */}
                        <Select value={filters.status || 'all'} onValueChange={(v) => handleFilter('status', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
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
                {feeTypes.data.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                        <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 z-10 bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Code</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Category</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Per Unit</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Required</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Applies To</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {feeTypes.data.map((feeType) => (
                                        <tr key={feeType.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-mono font-medium text-gray-900">{feeType.code}</td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-gray-900">{feeType.name}</p>
                                                    {feeType.description && (
                                                        <p className="text-xs text-gray-500 line-clamp-1">
                                                            {feeType.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge className={getCategoryBadgeColor(feeType.category)}>
                                                    {categories[feeType.category]}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {feeType.is_per_unit ? (
                                                    <Badge className="bg-green-100 text-green-800">Yes</Badge>
                                                ) : (
                                                    <Badge variant="outline">No</Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {feeType.is_required ? (
                                                    <Badge className="bg-green-100 text-green-800">Yes</Badge>
                                                ) : (
                                                    <Badge variant="outline">No</Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {appliesTo[feeType.applies_to]}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge className={feeType.is_active ? 'bg-green-100 text-green-800' : ''}>
                                                    {feeType.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center gap-1">
                                                    <Link href={`/admin/fee-types/${feeType.id}`}>
                                                        <Button variant="outline" size="sm">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/admin/fee-types/${feeType.id}/edit`}>
                                                        <Button variant="outline" size="sm">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDelete(feeType.id, feeType.name)}
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
                        {feeTypes.last_page > 1 && (
                            <div className="flex items-center justify-between border-t px-4 py-3">
                                <p className="text-sm text-gray-600">
                                    Showing {(feeTypes.current_page - 1) * feeTypes.per_page + 1} to{' '}
                                    {Math.min(feeTypes.current_page * feeTypes.per_page, feeTypes.total)} of{' '}
                                    {feeTypes.total} results
                                </p>
                                <div className="flex gap-1">
                                    {feeTypes.links.map((link, index) => (
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
                        <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">No fee types found</h3>
                        <p className="mt-2 text-gray-600">
                            {hasFilters
                                ? 'No fee types match your filters. Try adjusting your search criteria.'
                                : 'Get started by creating your first fee type.'}
                        </p>
                        {!hasFilters && (
                            <Link href="/admin/fee-types/create">
                                <Button className="mt-4">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Fee Type
                                </Button>
                            </Link>
                        )}
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, id: 0, name: '' })}
                onConfirm={confirmDelete}
                title="Delete Fee Type"
                description={`Are you sure you want to delete "${deleteDialog.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                processingLabel="Deleting..."
                processing={processing}
            />
        </AppLayout>
    );
}
