import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Edit, GraduationCap, Plus, Search, Trash2, X } from 'lucide-react';
import { useState } from 'react';

interface Program {
    id: number;
    code: string;
    description: string;
    school: string;
    vocational: boolean;
    is_active: boolean;
    max_load: number;
    created_at: string;
}

interface PaginatedData {
    data: Program[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    programs: PaginatedData;
    filters: {
        search?: string;
        school?: string;
        status?: string;
    };
    schools: Record<string, string>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Programs', href: '/programs' },
];

export default function Index({ programs, filters, schools }: Props) {
    const { delete: destroy, processing } = useForm();
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: number; name: string }>({ open: false, id: 0, name: '' });

    const handleSearch = (value: string) => {
        router.get('/programs', { ...filters, search: value || undefined }, { preserveState: true });
    };

    const handleFilter = (key: string, value: string) => {
        router.get('/programs', { ...filters, [key]: value === 'all' ? undefined : value }, { preserveState: true });
    };

    const handleDelete = (id: number, name: string) => {
        setDeleteDialog({ open: true, id, name });
    };

    const confirmDelete = () => {
        destroy(`/programs/${deleteDialog.id}`, {
            onSuccess: () => setDeleteDialog({ open: false, id: 0, name: '' }),
        });
    };

    const clearFilters = () => {
        router.get('/programs');
    };

    const hasFilters = filters.search || filters.school || filters.status;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Courses/Programs" />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Programs</h1>
                        <p className="mt-1 text-gray-600">Manage academic programs</p>
                    </div>
                    <Link href="/programs/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Program
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-4">
                        {/* Search */}
                        <div className="relative md:col-span-2">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search by code or description..."
                                defaultValue={filters.search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* School Filter */}
                        <Select value={filters.school || 'all'} onValueChange={(v) => handleFilter('school', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="School" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Schools</SelectItem>
                                {Object.entries(schools).map(([key, label]) => (
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
                {programs.data.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                        <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 z-10 bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Code</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Description
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">School</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Vocational
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase">Max Load</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {programs.data.map((program) => (
                                        <tr key={program.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-900">{program.code}</td>
                                            <td className="px-4 py-3 text-gray-900">{program.description}</td>
                                            <td className="px-4 py-3 text-gray-600">{program.school}</td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant="outline" className={program.vocational ? 'bg-purple-50 text-purple-700' : ''}>
                                                    {program.vocational ? 'Yes' : 'No'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center">{program.max_load}</td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge className={program.is_active ? 'bg-green-100 text-green-800' : ''}>
                                                    {program.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center gap-1">
                                                    <Link href={`/programs/${program.id}/edit`}>
                                                        <Button variant="outline" size="sm">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDelete(program.id, program.code)}
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
                        {programs.last_page > 1 && (
                            <div className="flex items-center justify-between border-t px-4 py-3">
                                <p className="text-sm text-gray-600">
                                    Showing {(programs.current_page - 1) * programs.per_page + 1} to{' '}
                                    {Math.min(programs.current_page * programs.per_page, programs.total)} of {programs.total} results
                                </p>
                                <div className="flex gap-1">
                                    {programs.links.map((link, index) => (
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
                        <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">No programs found</h3>
                        <p className="mt-2 text-gray-600">
                            {hasFilters
                                ? 'No programs match your filters. Try adjusting your search criteria.'
                                : 'Get started by creating your first program.'}
                        </p>
                        {!hasFilters && (
                            <Link href="/programs/create">
                                <Button className="mt-4">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Program
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
                title="Delete Program"
                description={`Are you sure you want to delete "${deleteDialog.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                processingLabel="Deleting..."
                processing={processing}
            />
        </AppLayout>
    );
}
