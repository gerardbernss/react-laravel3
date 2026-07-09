import { AppBadge } from '@/components/AppBadge';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TablePagination } from '@/components/ui/table-pagination';
import { BODY_TEXT, CARD, LABEL_TEXT, PAGE_PADDING, PAGE_TITLE, TABLE_HEADER_CELL, TABLE_HEADER_CELL_CENTER, TABLE_ROW, TABLE_ROW_ACTION, TABLE_ROW_ACTION_DANGER } from '@/constants/ui';
import { formatDiscountValue, useDiscountTypes, type DiscountSortKey, type DiscountType } from '@/hooks/useDiscountTypes';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ChevronDown, ChevronUp, Eye, Pencil, Percent, Plus, Search, Trash2 } from 'lucide-react';

interface Props {
    discountTypes: DiscountType[];
    discountTypeOptions: Record<string, string>;
    appliesToOptions: Record<string, string>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Discounts', href: '/admin/discount-types' },
];

function SortIcon({ col, sortConfig }: { col: DiscountSortKey; sortConfig: { key: DiscountSortKey | null; direction: 'asc' | 'desc' } }) {
    if (sortConfig.key !== col) return <ChevronUp className="ml-1 inline h-3 w-3 opacity-30" />;
    return sortConfig.direction === 'asc'
        ? <ChevronUp className="ml-1 inline h-3 w-3" />
        : <ChevronDown className="ml-1 inline h-3 w-3" />;
}

interface DiscountTypeRowProps {
    discount: DiscountType;
    discountTypeOptions: Record<string, string>;
    appliesToOptions: Record<string, string>;
    processing: boolean;
    onDelete: (id: number, name: string) => void;
}

function DiscountTypeRow({ discount, discountTypeOptions, appliesToOptions, processing, onDelete }: DiscountTypeRowProps) {
    return (
        <tr className={TABLE_ROW}>
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
            <td className="px-4 py-3 text-right font-medium text-primary">{formatDiscountValue(discount)}</td>
            <td className="px-4 py-3 text-gray-600">{appliesToOptions[discount.applies_to]}</td>
            <td className="px-4 py-3 text-center">
                <AppBadge status={discount.is_active ? 'active' : 'inactive'}>
                    {discount.is_active ? 'Active' : 'Inactive'}
                </AppBadge>
            </td>
            <td className="px-4 py-3">
                <div className="flex justify-center gap-1">
                    <Link href={`/admin/discount-types/${discount.id}`}>
                        <button className={TABLE_ROW_ACTION}>
                            <Eye className="h-3 w-3" /> View
                        </button>
                    </Link>
                    <Link href={`/admin/discount-types/${discount.id}/edit`}>
                        <button className={TABLE_ROW_ACTION}>
                            <Pencil className="h-3 w-3" /> Edit
                        </button>
                    </Link>
                    <button
                        onClick={() => onDelete(discount.id, discount.name)}
                        disabled={processing}
                        className={TABLE_ROW_ACTION_DANGER}
                    >
                        <Trash2 className="h-3 w-3" /> Delete
                    </button>
                </div>
            </td>
        </tr>
    );
}

/** Admin discount types list with search and delete actions. */
export default function Index({ discountTypes, discountTypeOptions, appliesToOptions }: Props) {
    const {
        processing,
        deleteDialog,
        setDeleteDialog,
        searchQuery,
        setSearchQuery,
        selectedType,
        setSelectedType,
        selectedStatus,
        setSelectedStatus,
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        sortConfig,
        hasFilters,
        sortedItems,
        paginatedItems,
        toggleSort,
        clearFilters,
        confirmDelete,
    } = useDiscountTypes(discountTypes);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Discounts" />

            <div className={PAGE_PADDING}>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className={PAGE_TITLE}>Discounts</h1>
                    <Link href="/admin/discount-types/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Discount
                        </Button>
                    </Link>
                </div>

                <div className="mb-6 flex flex-wrap items-end gap-3">
                    <div>
                        <label className={`mb-1 block ${LABEL_TEXT}`}>Search</label>
                        <div className="relative w-full sm:w-[300px]">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search by name or code..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="pl-10"
                            />
                        </div>
                    </div>
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

                <div className={`overflow-hidden ${CARD}`}>
                    <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 z-10 bg-gray-50">
                                <tr>
                                    <th className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('code')}>
                                        Code <SortIcon col="code" sortConfig={sortConfig} />
                                    </th>
                                    <th className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('name')}>
                                        Name <SortIcon col="name" sortConfig={sortConfig} />
                                    </th>
                                    <th className={`${TABLE_HEADER_CELL} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('discount_type')}>
                                        Type <SortIcon col="discount_type" sortConfig={sortConfig} />
                                    </th>
                                    <th className="cursor-pointer px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100" onClick={() => toggleSort('value')}>
                                        Value <SortIcon col="value" sortConfig={sortConfig} />
                                    </th>
                                    <th className={TABLE_HEADER_CELL}>Applies To</th>
                                    <th className={`${TABLE_HEADER_CELL_CENTER} cursor-pointer hover:bg-gray-100`} onClick={() => toggleSort('status')}>
                                        Status <SortIcon col="status" sortConfig={sortConfig} />
                                    </th>
                                    <th className={TABLE_HEADER_CELL_CENTER}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center">
                                            <Percent className="mx-auto h-10 w-10 text-gray-300" />
                                            <p className={`mt-2 ${BODY_TEXT}`}>
                                                {hasFilters ? 'No discount types match your filters.' : 'No discount types found.'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : paginatedItems.map((discount) => (
                                    <DiscountTypeRow
                                        key={discount.id}
                                        discount={discount}
                                        discountTypeOptions={discountTypeOptions}
                                        appliesToOptions={appliesToOptions}
                                        processing={processing}
                                        onDelete={(id, name) => setDeleteDialog({ open: true, id, name })}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <TablePagination
                        total={sortedItems.length}
                        pageSize={pageSize}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
                    />
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
