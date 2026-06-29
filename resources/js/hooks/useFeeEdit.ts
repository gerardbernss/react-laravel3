import { getSchoolYearOptions } from '@/lib/school-year';
import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

export interface Fee {
    id: number;
    name: string;
    code: string;
    category: string;
    is_per_unit: boolean;
    is_required: boolean;
    school_level: string;
    school_year: string;
    semester: string;
    amount: number;
    description: string | null;
    effective_date: string | null;
    is_active: boolean;
}

interface Params {
    fee: Fee;
}

export function useFeeEdit({ fee }: Params) {
    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Fee Management', href: '/admin/fees' },
        { title: `Edit: ${fee.name}`, href: `/admin/fees/${fee.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: fee.name,
        code: fee.code,
        category: fee.category,
        is_per_unit: fee.is_per_unit,
        is_required: fee.is_required,
        school_level: fee.school_level,
        school_year: fee.school_year,
        semester: fee.semester,
        amount: String(fee.amount),
        description: fee.description ?? '',
        effective_date: fee.effective_date ?? '',
        is_active: fee.is_active,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(`/admin/fees/${fee.id}`);
    };

    const opts = getSchoolYearOptions();
    const schoolYearOptions = opts.includes(data.school_year) ? opts : [data.school_year, ...opts];

    return { breadcrumbs, data, setData, processing, errors, handleSubmit, schoolYearOptions };
}
