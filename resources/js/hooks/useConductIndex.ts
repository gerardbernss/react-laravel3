import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';

export interface ConductCriteria {
    id: number;
    name: string;
    description: string | null;
    max_score: number;
    order: number;
}

export interface ConductCategory {
    id: number;
    name: string;
    description: string | null;
    order: number;
    is_active: boolean;
    criteria: ConductCriteria[];
}

export function useConductIndex() {
    const [expanded, setExpanded] = useState<Record<number, boolean>>({});
    const [addingCategory, setAddingCategory] = useState(false);
    const [addingCriteriaFor, setAddingCriteriaFor] = useState<number | null>(null);
    const [deleteCategoryDialog, setDeleteCategoryDialog] = useState<{ open: boolean; id: number; name: string }>({
        open: false, id: 0, name: '',
    });
    const [deleteCriteriaDialog, setDeleteCriteriaDialog] = useState<{ open: boolean; id: number; name: string }>({
        open: false, id: 0, name: '',
    });

    const categoryForm = useForm({ name: '', description: '', order: 0 });
    const criteriaForm = useForm({ name: '', description: '', max_score: 100, order: 0 });

    const toggleExpand = (id: number) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

    const submitCategory = (e: React.FormEvent) => {
        e.preventDefault();
        categoryForm.post('/teacher/conduct-categories', {
            onSuccess: () => { setAddingCategory(false); categoryForm.reset(); },
        });
    };

    const submitCriteria = (e: React.FormEvent, categoryId: number) => {
        e.preventDefault();
        criteriaForm.post(`/teacher/conduct-categories/${categoryId}/criteria`, {
            onSuccess: () => { setAddingCriteriaFor(null); criteriaForm.reset(); },
        });
    };

    const confirmDeleteCategory = () => {
        router.delete(`/teacher/conduct-categories/${deleteCategoryDialog.id}`, {
            onSuccess: () => setDeleteCategoryDialog({ open: false, id: 0, name: '' }),
        });
    };

    const confirmDeleteCriteria = () => {
        router.delete(`/teacher/conduct-criteria/${deleteCriteriaDialog.id}`, {
            onSuccess: () => setDeleteCriteriaDialog({ open: false, id: 0, name: '' }),
        });
    };

    return {
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
    };
}
