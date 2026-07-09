import { router } from '@inertiajs/react';
import { type FormEvent, useState } from 'react';

interface Filters {
    search?: string;
    status?: string;
    category?: string;
}

interface Params {
    filters: Filters;
}

export function useEnrollmentDashboard({ filters }: Params) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters.status ?? 'all');
    const [categoryFilter, setCategoryFilter] = useState(filters.category ?? 'all');

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            '/admin/enrollment/dashboard',
            {
                search: search || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                category: categoryFilter !== 'all' ? categoryFilter : undefined,
            },
            { preserveState: true },
        );
    };

    return { search, setSearch, statusFilter, setStatusFilter, categoryFilter, setCategoryFilter, handleSearch };
}
