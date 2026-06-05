import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface ConductCriteria {
    id: number;
    name: string;
    description: string | null;
    max_score: number;
    order: number;
}

interface ConductCategory {
    id: number;
    name: string;
    description: string | null;
    order: number;
    is_active: boolean;
    criteria: ConductCriteria[];
}

interface Props {
    categories: ConductCategory[];
}

export default function ConductIndex({ categories }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Conduct Categories', href: '/conduct-categories' },
    ];

    const [expanded, setExpanded] = useState<Record<number, boolean>>({});
    const [addingCategory, setAddingCategory] = useState(false);
    const [addingCriteriaFor, setAddingCriteriaFor] = useState<number | null>(null);

    const categoryForm = useForm({ name: '', description: '', order: 0 });
    const criteriaForm = useForm({ name: '', description: '', max_score: 100, order: 0 });

    const toggleExpand = (id: number) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

    const submitCategory = (e: React.FormEvent) => {
        e.preventDefault();
        categoryForm.post('/conduct-categories', {
            onSuccess: () => { setAddingCategory(false); categoryForm.reset(); },
        });
    };

    const submitCriteria = (e: React.FormEvent, categoryId: number) => {
        e.preventDefault();
        criteriaForm.post(`/conduct-categories/${categoryId}/criteria`, {
            onSuccess: () => { setAddingCriteriaFor(null); criteriaForm.reset(); },
        });
    };

    const deleteCategory = (id: number) => {
        if (!confirm('Delete this category and all its criteria?')) return;
        router.delete(`/conduct-categories/${id}`);
    };

    const deleteCriteria = (id: number) => {
        if (!confirm('Delete this criterion?')) return;
        router.delete(`/conduct-criteria/${id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Conduct Categories" />

            <div className="p-6 md:p-10">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Conduct Categories</h1>
                        <p className="mt-1 text-gray-600">Manage conduct assessment categories and criteria.</p>
                    </div>
                    <Button onClick={() => setAddingCategory(true)}>
                        <Plus className="mr-1 h-4 w-4" /> Add Category
                    </Button>
                </div>

                {addingCategory && (
                    <form onSubmit={submitCategory} className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
                        <h3 className="mb-3 font-semibold text-gray-900">New Category</h3>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="sm:col-span-2">
                                <input
                                    type="text"
                                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Category name"
                                    value={categoryForm.data.name}
                                    onChange={(e) => categoryForm.setData('name', e.target.value)}
                                    required
                                />
                            </div>
                            <input
                                type="number"
                                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Order"
                                value={categoryForm.data.order}
                                onChange={(e) => categoryForm.setData('order', parseInt(e.target.value) || 0)}
                                min={0}
                            />
                            <div className="sm:col-span-3">
                                <input
                                    type="text"
                                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Description (optional)"
                                    value={categoryForm.data.description}
                                    onChange={(e) => categoryForm.setData('description', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                            <Button type="submit" size="sm" disabled={categoryForm.processing}>Save</Button>
                            <Button type="button" size="sm" variant="ghost" onClick={() => { setAddingCategory(false); categoryForm.reset(); }}>Cancel</Button>
                        </div>
                    </form>
                )}

                {categories.length === 0 && !addingCategory ? (
                    <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
                        <p className="text-gray-500">No conduct categories yet. Add one to get started.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {categories.map((category) => (
                            <div key={category.id} className="overflow-hidden rounded-lg border bg-white shadow-sm">
                                <div
                                    className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-gray-50"
                                    onClick={() => toggleExpand(category.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        {expanded[category.id] ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                                        <div>
                                            <span className="font-semibold text-gray-900">{category.name}</span>
                                            {category.description && <span className="ml-2 text-sm text-gray-500">{category.description}</span>}
                                            {!category.is_active && <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Inactive</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                        <span className="text-xs text-gray-400">{category.criteria.length} criteria</span>
                                        <Button size="sm" variant="ghost" className="h-7 px-2 text-red-500 hover:bg-red-50" onClick={() => deleteCategory(category.id)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                {expanded[category.id] && (
                                    <div className="border-t bg-gray-50 px-4 py-3">
                                        {category.criteria.length > 0 && (
                                            <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                                            <table className="mb-3 w-full text-sm">
                                                <thead className="sticky top-0 z-10 bg-gray-50">
                                                    <tr className="text-left text-xs text-gray-500">
                                                        <th className="pb-1 font-medium">Criterion</th>
                                                        <th className="pb-1 font-medium text-right">Max Score</th>
                                                        <th className="pb-1 font-medium text-right">Order</th>
                                                        <th className="pb-1"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {category.criteria.map((c) => (
                                                        <tr key={c.id}>
                                                            <td className="py-1.5">
                                                                <span className="font-medium text-gray-800">{c.name}</span>
                                                                {c.description && <span className="ml-2 text-xs text-gray-500">{c.description}</span>}
                                                            </td>
                                                            <td className="py-1.5 text-right text-gray-600">{c.max_score}</td>
                                                            <td className="py-1.5 text-right text-gray-400">{c.order}</td>
                                                            <td className="py-1.5 text-right">
                                                                <Button size="sm" variant="ghost" className="h-6 px-1.5 text-red-400 hover:bg-red-50" onClick={() => deleteCriteria(c.id)}>
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            </div>
                                        )}

                                        {addingCriteriaFor === category.id ? (
                                            <form onSubmit={(e) => submitCriteria(e, category.id)} className="rounded border bg-white p-3">
                                                <div className="grid gap-2 sm:grid-cols-4">
                                                    <div className="sm:col-span-2">
                                                        <input
                                                            type="text"
                                                            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            placeholder="Criterion name"
                                                            value={criteriaForm.data.name}
                                                            onChange={(e) => criteriaForm.setData('name', e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <input
                                                        type="number"
                                                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Max score"
                                                        value={criteriaForm.data.max_score}
                                                        onChange={(e) => criteriaForm.setData('max_score', parseFloat(e.target.value) || 100)}
                                                        min={1}
                                                        max={100}
                                                        step={0.01}
                                                    />
                                                    <input
                                                        type="number"
                                                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Order"
                                                        value={criteriaForm.data.order}
                                                        onChange={(e) => criteriaForm.setData('order', parseInt(e.target.value) || 0)}
                                                        min={0}
                                                    />
                                                    <div className="sm:col-span-4">
                                                        <input
                                                            type="text"
                                                            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            placeholder="Description (optional)"
                                                            value={criteriaForm.data.description}
                                                            onChange={(e) => criteriaForm.setData('description', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="mt-2 flex gap-2">
                                                    <Button type="submit" size="sm" disabled={criteriaForm.processing}>Add</Button>
                                                    <Button type="button" size="sm" variant="ghost" onClick={() => { setAddingCriteriaFor(null); criteriaForm.reset(); }}>Cancel</Button>
                                                </div>
                                            </form>
                                        ) : (
                                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAddingCriteriaFor(category.id)}>
                                                <Plus className="mr-1 h-3 w-3" /> Add Criterion
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
