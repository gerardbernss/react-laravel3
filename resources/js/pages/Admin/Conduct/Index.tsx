import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BODY_TEXT, CARD, FILTER_CARD, PAGE_PADDING, PAGE_TITLE } from '@/constants/ui';
import { useConductIndex, type ConductCategory, type ConductCriteria } from '@/hooks/useConductIndex';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';

interface Props {
    categories: ConductCategory[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Conduct Categories', href: '/conduct-categories' },
];

type Hook = ReturnType<typeof useConductIndex>;

interface CriteriaRowProps {
    criterion: ConductCriteria;
    onDelete: (id: number, name: string) => void;
}

function CriteriaRow({ criterion: c, onDelete }: CriteriaRowProps) {
    return (
        <tr>
            <td className="py-1.5">
                <span className="font-medium text-gray-800">{c.name}</span>
                {c.description && <span className="ml-2 text-xs text-gray-500">{c.description}</span>}
            </td>
            <td className="py-1.5 text-right text-gray-600">{c.max_score}</td>
            <td className="py-1.5 text-right text-gray-400">{c.order}</td>
            <td className="py-1.5 text-right">
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-1.5 text-red-400 hover:bg-red-50"
                    onClick={() => onDelete(c.id, c.name)}
                >
                    <Trash2 className="h-3 w-3" />
                </Button>
            </td>
        </tr>
    );
}

interface AddCriteriaFormProps {
    categoryId: number;
    criteriaForm: Hook['criteriaForm'];
    processing: boolean;
    onSubmit: (e: React.FormEvent, categoryId: number) => void;
    onCancel: () => void;
}

function AddCriteriaForm({ categoryId, criteriaForm, processing, onSubmit, onCancel }: AddCriteriaFormProps) {
    return (
        <form onSubmit={(e) => onSubmit(e, categoryId)} className="rounded border bg-white p-3">
            <div className="grid gap-2 sm:grid-cols-4">
                <div className="sm:col-span-2">
                    <Input
                        placeholder="Criterion name"
                        value={criteriaForm.data.name}
                        onChange={(e) => criteriaForm.setData('name', e.target.value)}
                        required
                        className="h-8 text-sm"
                    />
                </div>
                <Input
                    type="number"
                    placeholder="Max score"
                    value={criteriaForm.data.max_score}
                    onChange={(e) => criteriaForm.setData('max_score', parseFloat(e.target.value) || 100)}
                    min={1}
                    max={100}
                    step={0.01}
                    className="h-8 text-sm"
                />
                <Input
                    type="number"
                    placeholder="Order"
                    value={criteriaForm.data.order}
                    onChange={(e) => criteriaForm.setData('order', parseInt(e.target.value) || 0)}
                    min={0}
                    className="h-8 text-sm"
                />
                <div className="sm:col-span-4">
                    <Input
                        placeholder="Description (optional)"
                        value={criteriaForm.data.description}
                        onChange={(e) => criteriaForm.setData('description', e.target.value)}
                        className="h-8 text-sm"
                    />
                </div>
            </div>
            <div className="mt-2 flex gap-2">
                <Button type="submit" size="sm" disabled={processing}>Add</Button>
                <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
            </div>
        </form>
    );
}

interface CategoryCardProps {
    category: ConductCategory;
    isExpanded: boolean;
    addingCriteriaFor: number | null;
    criteriaForm: Hook['criteriaForm'];
    onToggle: (id: number) => void;
    onDeleteCategory: (id: number, name: string) => void;
    onDeleteCriteria: (id: number, name: string) => void;
    onAddCriteria: (id: number) => void;
    onCancelCriteria: () => void;
    onSubmitCriteria: (e: React.FormEvent, categoryId: number) => void;
}

function CategoryCard({
    category,
    isExpanded,
    addingCriteriaFor,
    criteriaForm,
    onToggle,
    onDeleteCategory,
    onDeleteCriteria,
    onAddCriteria,
    onCancelCriteria,
    onSubmitCriteria,
}: CategoryCardProps) {
    return (
        <div className={`overflow-hidden ${CARD}`}>
            <div
                className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-gray-50"
                onClick={() => onToggle(category.id)}
            >
                <div className="flex items-center gap-3">
                    {isExpanded
                        ? <ChevronDown className="h-4 w-4 text-gray-400" />
                        : <ChevronRight className="h-4 w-4 text-gray-400" />}
                    <div>
                        <span className="font-semibold text-gray-900">{category.name}</span>
                        {category.description && (
                            <span className="ml-2 text-sm text-gray-500">{category.description}</span>
                        )}
                        {!category.is_active && (
                            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Inactive</span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs text-gray-400">{category.criteria.length} criteria</span>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-red-500 hover:bg-red-50"
                        onClick={() => onDeleteCategory(category.id, category.name)}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {isExpanded && (
                <div className="border-t bg-gray-50 px-4 py-3">
                    {category.criteria.length > 0 && (
                        <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                            <table className="mb-3 w-full text-sm">
                                <thead className="sticky top-0 z-10 bg-gray-50">
                                    <tr className="text-left text-xs text-gray-500">
                                        <th className="pb-1 font-medium">Criterion</th>
                                        <th className="pb-1 font-medium text-right">Max Score</th>
                                        <th className="pb-1 font-medium text-right">Order</th>
                                        <th className="pb-1" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {category.criteria.map((c) => (
                                        <CriteriaRow
                                            key={c.id}
                                            criterion={c}
                                            onDelete={onDeleteCriteria}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {addingCriteriaFor === category.id ? (
                        <AddCriteriaForm
                            categoryId={category.id}
                            criteriaForm={criteriaForm}
                            processing={criteriaForm.processing}
                            onSubmit={onSubmitCriteria}
                            onCancel={onCancelCriteria}
                        />
                    ) : (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onAddCriteria(category.id)}>
                            <Plus className="mr-1 h-3 w-3" /> Add Criterion
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}

export default function ConductIndex({ categories }: Props) {
    const {
        expanded,
        addingCategory, setAddingCategory,
        addingCriteriaFor, setAddingCriteriaFor,
        deleteCategoryDialog, setDeleteCategoryDialog,
        deleteCriteriaDialog, setDeleteCriteriaDialog,
        categoryForm,
        criteriaForm,
        toggleExpand,
        submitCategory,
        submitCriteria,
        confirmDeleteCategory,
        confirmDeleteCriteria,
    } = useConductIndex();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Conduct Categories" />

            <div className={PAGE_PADDING}>
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className={PAGE_TITLE}>Conduct Categories</h1>
                        <p className={`mt-1 ${BODY_TEXT}`}>Manage conduct assessment categories and criteria.</p>
                    </div>
                    <Button onClick={() => setAddingCategory(true)}>
                        <Plus className="mr-1 h-4 w-4" /> Add Category
                    </Button>
                </div>

                {addingCategory && (
                    <form onSubmit={submitCategory} className={`mb-6 ${FILTER_CARD}`}>
                        <h3 className="mb-3 font-semibold text-gray-900">New Category</h3>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="sm:col-span-2">
                                <Input
                                    placeholder="Category name"
                                    value={categoryForm.data.name}
                                    onChange={(e) => categoryForm.setData('name', e.target.value)}
                                    required
                                />
                            </div>
                            <Input
                                type="number"
                                placeholder="Order"
                                value={categoryForm.data.order}
                                onChange={(e) => categoryForm.setData('order', parseInt(e.target.value) || 0)}
                                min={0}
                            />
                            <div className="sm:col-span-3">
                                <Input
                                    placeholder="Description (optional)"
                                    value={categoryForm.data.description}
                                    onChange={(e) => categoryForm.setData('description', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                            <Button type="submit" size="sm" disabled={categoryForm.processing}>Save</Button>
                            <Button type="button" size="sm" variant="ghost" onClick={() => { setAddingCategory(false); categoryForm.reset(); }}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                )}

                {categories.length === 0 && !addingCategory ? (
                    <div className={`${CARD} p-12 text-center`}>
                        <p className={BODY_TEXT}>No conduct categories yet. Add one to get started.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {categories.map((category) => (
                            <CategoryCard
                                key={category.id}
                                category={category}
                                isExpanded={!!expanded[category.id]}
                                addingCriteriaFor={addingCriteriaFor}
                                criteriaForm={criteriaForm}
                                onToggle={toggleExpand}
                                onDeleteCategory={(id, name) => setDeleteCategoryDialog({ open: true, id, name })}
                                onDeleteCriteria={(id, name) => setDeleteCriteriaDialog({ open: true, id, name })}
                                onAddCriteria={setAddingCriteriaFor}
                                onCancelCriteria={() => { setAddingCriteriaFor(null); criteriaForm.reset(); }}
                                onSubmitCriteria={submitCriteria}
                            />
                        ))}
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={deleteCategoryDialog.open}
                onClose={() => setDeleteCategoryDialog({ open: false, id: 0, name: '' })}
                onConfirm={confirmDeleteCategory}
                title="Delete Category"
                description={`Delete "${deleteCategoryDialog.name}" and all its criteria? This action cannot be undone.`}
                confirmLabel="Delete"
                processingLabel="Deleting..."
            />
            <ConfirmDialog
                open={deleteCriteriaDialog.open}
                onClose={() => setDeleteCriteriaDialog({ open: false, id: 0, name: '' })}
                onConfirm={confirmDeleteCriteria}
                title="Delete Criterion"
                description={`Delete "${deleteCriteriaDialog.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                processingLabel="Deleting..."
            />
        </AppLayout>
    );
}
