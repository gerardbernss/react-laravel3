import { useMemo, useState } from 'react';

export interface BlockSection {
    id: number;
    code: string;
    name: string;
    grade_level: string | null;
    strand: string | null;
    school_year: string | null;
    semester: string | null;
    subjects_count: number;
    enrollments_count: number;
}

export interface SubjectEntry {
    subject_id: number;
    subject_code: string;
    subject_name: string;
    block_section_id: number;
    section_code: string;
    section_name: string;
    grade_level: string | null;
    school_year: string | null;
    semester: string | null;
}

/** Paginate the faculty gradebook's sections list and assigned subjects list independently. */
export function useGradebook(mySubjects: SubjectEntry[], blockSections: BlockSection[]) {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [subjectPage, setSubjectPage] = useState(1);
    const [subjectPageSize, setSubjectPageSize] = useState(10);

    const paginatedSections = useMemo(
        () => blockSections.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [blockSections, currentPage, pageSize],
    );

    const paginatedSubjects = useMemo(
        () => mySubjects.slice((subjectPage - 1) * subjectPageSize, subjectPage * subjectPageSize),
        [mySubjects, subjectPage, subjectPageSize],
    );

    return {
        currentPage, setCurrentPage,
        pageSize, setPageSize,
        subjectPage, setSubjectPage,
        subjectPageSize, setSubjectPageSize,
        paginatedSections,
        paginatedSubjects,
    };
}
