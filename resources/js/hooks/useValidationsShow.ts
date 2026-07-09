export interface QuarterStatus {
    status: 'draft' | 'submitted' | 'finalized';
    validation_id: number | null;
}

export interface SubjectRow {
    id: number;
    code: string;
    name: string;
    faculty_name: string | null;
    quarters: Record<string, QuarterStatus>;
}

export interface BlockSectionData {
    id: number;
    code: string;
    name: string;
    grade_level: string | null;
    school_year: string | null;
}

interface Params {
    blockSection: BlockSectionData;
}

export function useValidationsShow({ blockSection }: Params) {
    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Gradebook', href: '/teacher/gradebook' },
        { title: 'Validations', href: '/teacher/gradebook/validations' },
        { title: blockSection.code, href: '' },
    ];

    return { breadcrumbs };
}
