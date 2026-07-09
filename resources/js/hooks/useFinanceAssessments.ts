import { useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export interface Assessment {
    id: number;
    type: 'student' | 'applicant';
    assessment_number: string;
    school_year: string;
    semester: string;
    status: 'finalized' | 'partial' | 'paid' | 'draft' | 'cancelled' | 'for_enrollment';
    gross_amount: number;
    total_discounts: number;
    net_amount: number;
    total_paid: number;
    balance: number;
    student_name: string;
    student_id_number: string;
    grade_level: string;
    applicant_id: number | null;
}

export interface OpenStudentPeriod {
    id: number;
    school_year: string;
    semester: string;
}

export type AssessmentSortKey =
    | 'assessment_number'
    | 'student_name'
    | 'grade_level'
    | 'school_year'
    | 'net_amount'
    | 'total_paid'
    | 'balance'
    | 'status';

export function useFinanceAssessments(
    assessments: Assessment[],
    openStudentPeriod: OpenStudentPeriod | null,
) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedSchoolYear, setSelectedSchoolYear] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortConfig, setSortConfig] = useState<{ key: AssessmentSortKey | null; direction: 'asc' | 'desc' }>({
        key: null, direction: 'asc',
    });
    const [showGenerateDialog, setShowGenerateDialog] = useState(false);
    const { processing: generating, post: postGenerate } = useForm();

    const hasFilters = !!(searchQuery || selectedStatus || selectedSchoolYear || selectedSemester);

    const filteredItems = useMemo(() => {
        return assessments.filter((a) => {
            const q = searchQuery.toLowerCase();
            const matchesSearch =
                !q ||
                a.assessment_number.toLowerCase().includes(q) ||
                a.student_name.toLowerCase().includes(q) ||
                a.student_id_number.toLowerCase().includes(q);
            const matchesStatus = !selectedStatus || a.status === selectedStatus;
            const matchesYear = !selectedSchoolYear || a.school_year === selectedSchoolYear;
            const matchesSemester = !selectedSemester || a.semester === selectedSemester;
            return matchesSearch && matchesStatus && matchesYear && matchesSemester;
        });
    }, [assessments, searchQuery, selectedStatus, selectedSchoolYear, selectedSemester]);

    const sortedItems = useMemo(() => {
        if (!sortConfig.key) return filteredItems;
        return [...filteredItems].sort((a, b) => {
            let aVal = '';
            let bVal = '';
            if (sortConfig.key === 'assessment_number') { aVal = a.assessment_number; bVal = b.assessment_number; }
            else if (sortConfig.key === 'student_name')  { aVal = a.student_name; bVal = b.student_name; }
            else if (sortConfig.key === 'grade_level')   { aVal = a.grade_level; bVal = b.grade_level; }
            else if (sortConfig.key === 'school_year')   { aVal = a.school_year; bVal = b.school_year; }
            else if (sortConfig.key === 'net_amount')    { aVal = String(a.net_amount); bVal = String(b.net_amount); }
            else if (sortConfig.key === 'total_paid')    { aVal = String(a.total_paid); bVal = String(b.total_paid); }
            else if (sortConfig.key === 'balance')       { aVal = String(a.balance); bVal = String(b.balance); }
            else if (sortConfig.key === 'status')        { aVal = a.status; bVal = b.status; }
            return aVal.localeCompare(bVal) * (sortConfig.direction === 'asc' ? 1 : -1);
        });
    }, [filteredItems, sortConfig]);

    const paginatedItems = useMemo(
        () => sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [sortedItems, currentPage, pageSize],
    );

    const toggleSort = (key: AssessmentSortKey) =>
        setSortConfig((prev) =>
            prev.key === key
                ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                : { key, direction: 'asc' },
        );

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedStatus('');
        setSelectedSchoolYear('');
        setSelectedSemester('');
        setCurrentPage(1);
    };

    const handleGenerateAssessments = () => {
        if (!openStudentPeriod) return;
        postGenerate(`/admin/enrollment-periods/${openStudentPeriod.id}/generate-assessments`, {
            onSuccess: () => setShowGenerateDialog(false),
        });
    };

    return {
        searchQuery, setSearchQuery,
        selectedStatus, setSelectedStatus,
        selectedSchoolYear, setSelectedSchoolYear,
        selectedSemester, setSelectedSemester,
        currentPage, setCurrentPage,
        pageSize, setPageSize,
        sortConfig,
        showGenerateDialog, setShowGenerateDialog,
        generating,
        hasFilters,
        sortedItems,
        paginatedItems,
        toggleSort,
        clearFilters,
        handleGenerateAssessments,
    };
}
