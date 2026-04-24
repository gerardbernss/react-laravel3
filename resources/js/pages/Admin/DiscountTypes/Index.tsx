import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ChevronsLeft,
    ChevronsRight,
    Edit,
    Eye,
    Percent,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';

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
    created_at: string;
}

interface Props {
    discountTypes: DiscountType[];
    discountTypeOptions: Record<string, string>;
    appliesToOptions: Record<string, string>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Discounts', href: '/admin/discount-types' },
];

type SortKey = 'code' | 'name' | 'discount_type' | 'value' | 'status';

export default function Index({ discountTypes, discountTypeOptions, appliesToOptions }: Props) {
    const { delete: destroy, processing } = useForm();
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; name: string }>({ open: false, id: 0, name: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });

    const formatValue = (discount: DiscountType) => {
        if (discount.discount_type === 'percentage') return `${discount.value}%`;
        return `₱${parseFloat(discount.value).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
    };

    const filteredItems = useMemo(() => {
        return discountTypes.filter((d) => {
            const q = searchQuery.toLowerCase();
            const matchesSearch = !q || d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q);
            const matchesType = !selectedType || d.discount_type === selectedType;
            const matchesStatus = !selectedStatus || (selectedStatus === 'active' ? d.is_active : !d.is_active);
            return matchesSearch && matchesType && matchesStatus;
        });
    }, [discountTypes, searchQuery, selectedType, selectedStatus]);

    const sortedItems = useMemo(() => {
        if (!sortConfig.key) return filteredItems;
        return [...filteredItems].sort((a, b) => {
            let aVal = '';
            let bVal = '';
            if (sortConfig.key === 'code') { aVal = a.code; bVal = b.code; }
            else if (sortConfig.key === 'name') { aVal = a.name; bVal = b.name; }
            else if (sortConfig.key === 'discount_type') { aVal = a.discount_type; bVal = b.discount_type; }
            else if (sortConfig.key === 'value') { aVal = String(parseFloat(a.value)); bVal = String(parseFloat(b.value)); }
            else if (sortConfig.key === 'status') { aVal = a.is_active ? 'active' : 'inactive'; bVal = b.is_active ? 'active' : 'inactive'; }
            return aVal.localeCompare(bVal) * (sortConfig.direction === 'asc' ? 1 : -1);
        });
    }, [filteredItems, sortConfig]);

    const totalPages = Math.ceil(sortedItems.length / pageSize);
    const paginatedItems = useMemo(
        () => sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [sortedItems, currentPage, pageSize],
    );

    const toggleSort = (key: SortKey) =>
        setSortConfig((prev) =>
            prev.key === key ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' },
        );

    const SortIcon = ({ col }: { col: SortKey }) =>
        sortConfig.key !== col ? (
            <ChevronUp className="ml-1 inline h-3 w-3 opacity-30" />
        ) : sortConfig.direction === 'asc' ? (
            <ChevronUp className="ml-1 inline h-3 w-3" />
        ) : (
            <ChevronDown className="ml-1 inline h-3 w-3" />
        );

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedType('');
        setSelectedStatus('');
        setCurrentPage(1);
    };

    const hasFilters = searchQuery || selectedType || selectedStatus;

    const confirmDelete = () => {
        destroy(`/admin/discount-types/${deleteDialog.id}`, {
            onSuccess: () => setDeleteDialog({ open: false, id: 0, name: '' }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Discounts" />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <Percent className="h-7 w-7 text-primary" />
                            <h1 className="text-3xl font-bold text-gray-900">Discounts</h1>
                        </div>
                    </div>
                    <Link href="/admin/discount-types/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Discount
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Search</label>
                        <div className="mb-3 flex h-10 w-full items-center rounded-lg border border-gray-300 bg-white md:w-[400px]">
                            <span className="pl-3 pr-2 text-gray-500"><Search className="h-4 w-4" /></span>
                            <input
                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                                placeholder="Search by name or code..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                        <Select value={selectedType || 'all'} onValueChange={(v) => { setSelectedType(v === 'all' ? '' : v); setCurrentPage(1); }}>
                            <SelectTrigger className="w-44"><SelectValue placeholder="Discount Type" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                {Object.entries(discountTypeOptions).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={selectedStatus || 'all'} onValueChange={(v) => { setSelectedStatus(v === 'all' ? '' : v); setCurrentPage(1); }}>
                            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                        {hasFilters && <Button variant="ghost" onClick={clearFilters}>Clear</Button>}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                    <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 z-10 bg-gray-50">
                                <tr>
                                    <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500" onClick={() => toggleSort('code')}>
                                        Code <SortIcon col="code" />
                                    </th>
                                    <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500" onClick={() => toggleSort('name')}>
                                        Name <SortIcon col="name" />
                                    </th>
                                    <th className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500" onClick={() => toggleSort('discount_type')}>
                                        Type <SortIcon col="discount_type" />
                                    </th>
                                    <th className="cursor-pointer px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500" onClick={() => toggleSort('value')}>
                                        Value <SortIcon col="value" />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Applies To</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Verification</th>
                                    <th className="cursor-pointer px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500" onClick={() => toggleSort('status')}>
                                        Status <SortIcon col="status" />
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center">
                                            <Percent className="mx-auto h-10 w-10 text-gray-300" />
                                            <p className="mt-2 text-gray-500">
                                                {hasFilters ? 'No discount types match your filters.' : 'No discount types found.'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : paginatedItems.map((discount) => (
                                    <tr key={discount.id} className="border-b border-gray-200 transition-all hover:bg-slate-50">
                                        <td className="px-4 py-3 font-mono font-medium text-gray-900">{discount.code}</td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900">{discount.name}</p>
                                            {discount.description && (
                                                <p className="line-clamp-1 text-xs text-gray-500">{discount.description}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline">{discountTypeOptions[discount.discount_type]}</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-primary">{formatValue(discount)}</td>
                                        <td className="px-4 py-3 text-gray-600">{appliesToOptions[discount.applies_to]}</td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge className={discount.requires_verification ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                                                {discount.requires_verification ? 'Required' : 'Auto'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge className={discount.is_active ? 'bg-green-100 text-green-800' : ''}>
                                                {discount.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-center gap-1">
                                                <Link href={`/admin/discount-types/${discount.id}`}>
                                                    <Button variant="outline" size="sm"><Eye className="h-4 w-4" /></Button>
                                                </Link>
                                                <Link href={`/admin/discount-types/${discount.id}/edit`}>
                                                    <Button variant="outline" size="sm"><Edit className="h-4 w-4" /></Button>
                                                </Link>
                                                <Button
                                                    variant="outline" size="sm"
                                                    onClick={() => setDeleteDialog({ open: true, id: discount.id, name: discount.name })}
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

                    {/* Pagination Bar */}
                    <div className="flex items-center justify-between border-t bg-white px-4 py-3">
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-700">Rows per page:</span>
                            <select
                                value={pageSize}
                                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                                className="rounded-lg border border-gray-300 px-3 py-1 text-sm focus:outline-none"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                            <span className="text-sm text-gray-700">
                                {sortedItems.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, sortedItems.length)} of {sortedItems.length}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40">
                                <ChevronsLeft className="h-4 w-4" />
                            </button>
                            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40">
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <span className="px-4 py-2 text-sm font-medium">Page {currentPage} of {totalPages || 1}</span>
                            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40">
                                <ChevronRight className="h-4 w-4" />
                            </button>
                            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40">
                                <ChevronsRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, id: 0, name: '' })}
                onConfirm={confirmDelete}
                title="Delete Discount Type"
                description={`Are you sure you want to delete "${deleteDialog.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                processingLabel="Deleting..."
                processing={processing}
            />
        </AppLayout>
    );
}
