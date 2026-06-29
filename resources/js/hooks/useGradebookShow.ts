export interface QuarterData {
    component_count: number;
    scored_students: number;
    total_students: number;
    weight_total: number;
    validation_status: 'draft' | 'submitted' | 'finalized';
}

export interface SubjectRow {
    id: number;
    code: string;
    name: string;
    faculty_name: string | null;
    quarters: Record<string, QuarterData>;
}

export interface BlockSectionData {
    id: number;
    code: string;
    name: string;
    grade_level: string | null;
    school_year: string | null;
    semester: string | null;
}

interface Params {
    blockSection: BlockSectionData;
}

export function useGradebookShow({ blockSection }: Params) {
    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Gradebook', href: '/gradebook' },
        { title: blockSection.code, href: `/gradebook/${blockSection.id}` },
    ];

    return { breadcrumbs };
}
