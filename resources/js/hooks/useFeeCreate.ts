import { getSchoolYearOptions } from '@/lib/school-year';
import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

/** Manage the fee create form, posting to /admin/fees. */
export function useFeeCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        code: '',
        category: 'miscellaneous',
        is_per_unit: false,
        is_required: true,
        school_level: 'all',
        school_year: getSchoolYearOptions()[0],
        semester: 'Yearly',
        amount: '',
        description: '',
        effective_date: '',
        is_active: true,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/admin/fees');
    };

    return { data, setData, processing, errors, handleSubmit };
}
