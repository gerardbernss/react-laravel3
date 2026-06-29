import { useBarangays } from '@/hooks/use-barangays';
import { useCities } from '@/hooks/use-cities';
import { useProvinces } from '@/hooks/use-provinces';
import { useRegions } from '@/hooks/use-regions';
import { getSchoolYearOptions } from '@/lib/school-year';
import { useForm } from '@inertiajs/react';
import { type FormEvent, useMemo, useState } from 'react';

export interface StudentRecord {
    id: number;
    student_id_number: string | null;
    enrollment_status: string | null;
    current_year_level: string | null;
    current_school_year: string | null;
    current_semester: string | null;
}

export interface PersonalData {
    last_name: string; first_name: string; middle_name: string | null; suffix: string | null;
    learner_reference_number: string | null; gender: string; citizenship: string; religion: string;
    date_of_birth: string; place_of_birth: string | null;
    email: string; alt_email: string | null; mobile_number: string | null;
    present_street: string | null; present_brgy: string | null; present_city: string | null;
    present_province: string | null; present_zip: string | null;
    permanent_street: string | null; permanent_brgy: string | null; permanent_city: string | null;
    permanent_province: string | null; permanent_zip: string | null;
    health_conditions: string[] | string | null;
    has_doctors_note: boolean | null;
    stopped_studying: string | null; accelerated: string | null;
}

export interface Sibling {
    sibling_full_name: string; sibling_grade_level: string; sibling_id_number: string;
}

export interface Documents {
    certificate_of_enrollment: string | null;
    birth_certificate: string | null;
    latest_report_card_front: string | null;
    latest_report_card_back: string | null;
}

function parseHealthConditions(raw: string[] | string | null): string[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try { return JSON.parse(raw); } catch { return []; }
}

interface Params {
    student: StudentRecord;
    personalData: PersonalData | null;
    initialSiblings: Sibling[];
}

export function useStudentEdit({ student, personalData, initialSiblings }: Params) {
    const initHC = parseHealthConditions(personalData?.health_conditions ?? null);

    const { data, setData, post, processing, errors } = useForm<{
        _method: string;
        current_year_level: string; current_school_year: string;
        current_semester: string; enrollment_status: string;
        last_name: string; first_name: string; middle_name: string; suffix: string;
        learner_reference_number: string; gender: string; citizenship: string; religion: string;
        date_of_birth: string; place_of_birth: string;
        email: string; alt_email: string; mobile_number: string;
        present_street: string; present_brgy: string; present_city: string;
        present_province: string; present_zip: string;
        permanent_street: string; permanent_brgy: string; permanent_city: string;
        permanent_province: string; permanent_zip: string;
        health_conditions: string[];
        has_doctors_note: boolean;
        doctors_note_file: File | null;
        siblings: Sibling[];
        certificate_of_enrollment: File | null;
        birth_certificate: File | null;
        latest_report_card_front: File | null;
        latest_report_card_back: File | null;
    }>({
        _method: 'PUT',
        current_year_level:  student.current_year_level  ?? '',
        current_school_year: student.current_school_year ?? '',
        current_semester:    student.current_semester    ?? '',
        enrollment_status:   student.enrollment_status   ?? 'Active',
        last_name:                personalData?.last_name                ?? '',
        first_name:               personalData?.first_name               ?? '',
        middle_name:              personalData?.middle_name              ?? '',
        suffix:                   personalData?.suffix                   ?? '',
        learner_reference_number: personalData?.learner_reference_number ?? '',
        gender:                   personalData?.gender                   ?? '',
        citizenship:              personalData?.citizenship              ?? '',
        religion:                 personalData?.religion                 ?? '',
        date_of_birth:            personalData?.date_of_birth            ?? '',
        place_of_birth:           personalData?.place_of_birth           ?? '',
        email:                    personalData?.email                    ?? '',
        alt_email:                personalData?.alt_email                ?? '',
        mobile_number:            personalData?.mobile_number            ?? '',
        present_street:   personalData?.present_street   ?? '',
        present_brgy:     personalData?.present_brgy     ?? '',
        present_city:     personalData?.present_city     ?? '',
        present_province: personalData?.present_province ?? '',
        present_zip:      personalData?.present_zip      ?? '',
        permanent_street:   personalData?.permanent_street   ?? '',
        permanent_brgy:     personalData?.permanent_brgy     ?? '',
        permanent_city:     personalData?.permanent_city     ?? '',
        permanent_province: personalData?.permanent_province ?? '',
        permanent_zip:      personalData?.permanent_zip      ?? '',
        health_conditions: initHC,
        has_doctors_note: personalData?.has_doctors_note ?? false,
        doctors_note_file: null,
        siblings: initialSiblings.map((s) => ({
            sibling_full_name:   s.sibling_full_name   ?? '',
            sibling_grade_level: s.sibling_grade_level ?? '',
            sibling_id_number:   s.sibling_id_number   ?? '',
        })),
        certificate_of_enrollment: null,
        birth_certificate: null,
        latest_report_card_front: null,
        latest_report_card_back: null,
    });

    const [presentRegionCode,   setPresentRegionCode]   = useState('');
    const [presentProvinceCode, setPresentProvinceCode] = useState('');
    const [presentCityCode,     setPresentCityCode]     = useState('');
    const [permRegionCode,      setPermRegionCode]      = useState('');
    const [permProvinceCode,    setPermProvinceCode]    = useState('');
    const [permCityCode,        setPermCityCode]        = useState('');

    const { regions }                             = useRegions();
    const { provinces: presentProvinces }         = useProvinces(presentRegionCode);
    const { cities: presentCities }               = useCities(presentProvinceCode);
    const { barangays: presentBarangays }         = useBarangays(presentCityCode);
    const { provinces: permProvinces }            = useProvinces(permRegionCode);
    const { cities: permCities }                  = useCities(permProvinceCode);
    const { barangays: permBarangays }            = useBarangays(permCityCode);

    const schoolYearOptions = useMemo(() => {
        const opts = getSchoolYearOptions();
        const v = data.current_school_year;
        return opts.includes(v) ? opts : [v, ...opts];
    }, [data.current_school_year]);

    const hasAnyCondition = data.health_conditions.length > 0;

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(`/students/${student.id}`);
    };

    const toggleCondition = (condition: string) => {
        const current = data.health_conditions;
        setData('health_conditions', current.includes(condition) ? current.filter((c) => c !== condition) : [...current, condition]);
    };

    const addSibling = () =>
        setData('siblings', [...data.siblings, { sibling_full_name: '', sibling_grade_level: '', sibling_id_number: '' }]);

    const removeSibling = (i: number) =>
        setData('siblings', data.siblings.filter((_, idx) => idx !== i));

    const updateSibling = (i: number, field: keyof Sibling, value: string) => {
        const updated = [...data.siblings];
        updated[i] = { ...updated[i], [field]: value };
        setData('siblings', updated);
    };

    return {
        data, setData, processing, errors,
        handleSubmit, toggleCondition,
        addSibling, removeSibling, updateSibling,
        hasAnyCondition, schoolYearOptions,
        presentRegionCode, setPresentRegionCode,
        presentProvinceCode, setPresentProvinceCode,
        presentCityCode, setPresentCityCode,
        permRegionCode, setPermRegionCode,
        permProvinceCode, setPermProvinceCode,
        permCityCode, setPermCityCode,
        regions,
        presentProvinces, presentCities, presentBarangays,
        permProvinces, permCities, permBarangays,
    };
}
