import { router } from '@inertiajs/react';

export interface AttendanceFilters {
    search?: string;
    school_year?: string;
    semester?: string;
}

export interface MySubjectSection {
    subject_id: number;
    subject_code: string;
    subject_name: string;
    subject_schedule: string | null;
    block_section_id: number;
    section_code: string;
    section_name: string;
    grade_level: string | null;
    enrolled_count: number;
    today_taken: boolean;
    today_present_count: number;
    missed_days_count: number;
}

export interface SectionGroup {
    label: string;
    sections: { id: number; [key: string]: unknown }[];
}

/**
 * Apply attendance index filters via Inertia navigation and compute daily attendance
 * summary statistics (rate, sections taken today, students present).
 */
export function useAttendanceFilter(
    filters: AttendanceFilters,
    groupedSections: SectionGroup[],
    mySubjectSections: MySubjectSection[],
) {
    const handleSearch = (value: string) => {
        router.get('/teacher/attendance', { ...filters, search: value || undefined }, { preserveState: true });
    };

    const handleFilter = (key: string, value: string) => {
        router.get('/teacher/attendance', { ...filters, [key]: value === 'all' ? undefined : value }, { preserveState: true });
    };

    const clearFilters = () => {
        router.get('/teacher/attendance');
    };

    const hasFilters = !!(filters.search || filters.school_year || filters.semester);
    const totalSections = groupedSections.reduce((sum, group) => sum + group.sections.length, 0);

    const totalStudents = mySubjectSections.reduce((sum, r) => sum + Number(r.enrolled_count), 0);
    const takenToday = mySubjectSections.filter((r) => r.today_taken).length;
    const presentToday = mySubjectSections.reduce((sum, r) => sum + Number(r.today_present_count), 0);
    const takenEnrolled = mySubjectSections
        .filter((r) => r.today_taken)
        .reduce((s, r) => s + Number(r.enrolled_count), 0);
    const attendanceRate =
        totalStudents > 0 && takenToday > 0 ? Math.round((presentToday / takenEnrolled) * 100) : null;

    return {
        handleSearch,
        handleFilter,
        clearFilters,
        hasFilters,
        totalSections,
        totalStudents,
        takenToday,
        presentToday,
        attendanceRate,
    };
}
