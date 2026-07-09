import { useMemo, useState } from 'react';

export interface SectionRow {
    id: number;
    code: string;
    name: string;
    grade_level: string | null;
    strand: string | null;
    school_year: string | null;
    semester: string | null;
    subjects_count: number;
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
}

interface Params {
    sections: SectionRow[];
    mySubjects: SubjectEntry[];
}

/** Paginate the grade validations index for both the all-sections list and the faculty's own subjects list. */
export function useValidationsIndex({ sections, mySubjects }: Params) {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [subjectPage, setSubjectPage] = useState(1);
    const [subjectPageSize, setSubjectPageSize] = useState(10);

    const paginatedSections = useMemo(
        () => sections.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [sections, currentPage, pageSize],
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
