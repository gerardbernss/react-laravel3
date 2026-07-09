import { useMemo, useState } from 'react';

export interface StudentPersonalData {
    first_name: string;
    last_name: string;
    middle_name: string | null;
    suffix: string | null;
    email: string;
    gender: string | null;
}

export interface Student {
    id: number;
    student_id_number: string | null;
    enrollment_status: string | null;
    current_year_level: string | null;
    current_school_year: string | null;
    current_semester: string | null;
    personal_data: StudentPersonalData | null;
}

/** Search and paginate the students index list by name or student ID number. */
export function useStudentsIndex(students: Student[]) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const filtered = useMemo(() => {
        return students.filter((s) => {
            const name = s.personal_data
                ? `${s.personal_data.first_name} ${s.personal_data.last_name}`.toLowerCase()
                : '';
            const idNum = (s.student_id_number ?? '').toLowerCase();
            const q = search.toLowerCase();
            const matchSearch = !q || name.includes(q) || idNum.includes(q);
            const matchStatus = statusFilter === 'all' || s.enrollment_status === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [students, search, statusFilter]);

    const paginated = useMemo(
        () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [filtered, currentPage, pageSize],
    );

    return {
        search, setSearch,
        statusFilter, setStatusFilter,
        currentPage, setCurrentPage,
        pageSize, setPageSize,
        filtered,
        paginated,
    };
}
