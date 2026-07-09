import { router } from '@inertiajs/react';
import { useState } from 'react';

interface Filters {
    status?: string;
    category?: string;
    school_year?: string;
}

interface Params {
    filters: Filters;
}

export function useEnrollmentReport({ filters }: Params) {
    const [statusFilter, setStatusFilter] = useState(filters.status ?? 'all');
    const [categoryFilter, setCategoryFilter] = useState(filters.category ?? 'all');
    const [schoolYear, setSchoolYear] = useState(filters.school_year ?? 'all');

    const handleFilter = () => {
        router.get(
            '/admin/enrollment/report',
            {
                status: statusFilter !== 'all' ? statusFilter : undefined,
                category: categoryFilter !== 'all' ? categoryFilter : undefined,
                school_year: schoolYear !== 'all' ? schoolYear : undefined,
            },
            { preserveState: true },
        );
    };

    return { statusFilter, setStatusFilter, categoryFilter, setCategoryFilter, schoolYear, setSchoolYear, handleFilter };
}
