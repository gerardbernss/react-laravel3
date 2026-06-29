import { getSchoolYearOptions } from '@/lib/school-year';
import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

export interface SiblingEntry {
    sibling_full_name: string;
    sibling_grade_level: string;
    sibling_id_number: string;
}

export function useStudentCreate() {
    const { data, setData, post, processing, errors } = useForm<{
        last_name: string; first_name: string; middle_name: string; suffix: string;
        learner_reference_number: string; gender: string; citizenship: string; religion: string;
        date_of_birth: string; place_of_birth: string;
        email: string; alt_email: string; mobile_number: string;
        present_street: string; present_brgy: string; present_city: string;
        present_province: string; present_zip: string;
        permanent_street: string; permanent_brgy: string; permanent_city: string;
        permanent_province: string; permanent_zip: string;
        stopped_studying: string; accelerated: string;
        student_id_number: string; current_year_level: string;
        current_school_year: string; current_semester: string; enrollment_status: string;
        father_lname: string; father_fname: string; father_mname: string; father_living: string;
        father_contact_no: string; father_email: string; father_occupation: string;
        mother_lname: string; mother_fname: string; mother_mname: string; mother_living: string;
        mother_contact_no: string; mother_email: string; mother_occupation: string;
        guardian_lname: string; guardian_fname: string; guardian_mname: string;
        guardian_relationship: string; guardian_contact_no: string; guardian_email: string;
        emergency_contact_name: string; emergency_relationship: string;
        emergency_mobile_phone: string; emergency_home_phone: string; emergency_email: string;
        siblings: SiblingEntry[];
    }>({
        last_name: '', first_name: '', middle_name: '', suffix: '',
        learner_reference_number: '', gender: '', citizenship: '', religion: '',
        date_of_birth: '', place_of_birth: '',
        email: '', alt_email: '', mobile_number: '',
        present_street: '', present_brgy: '', present_city: '', present_province: '', present_zip: '',
        permanent_street: '', permanent_brgy: '', permanent_city: '', permanent_province: '', permanent_zip: '',
        stopped_studying: '', accelerated: '',
        student_id_number: '', current_year_level: '', current_school_year: getSchoolYearOptions()[0],
        current_semester: '', enrollment_status: 'Active',
        father_lname: '', father_fname: '', father_mname: '', father_living: '',
        father_contact_no: '', father_email: '', father_occupation: '',
        mother_lname: '', mother_fname: '', mother_mname: '', mother_living: '',
        mother_contact_no: '', mother_email: '', mother_occupation: '',
        guardian_lname: '', guardian_fname: '', guardian_mname: '',
        guardian_relationship: '', guardian_contact_no: '', guardian_email: '',
        emergency_contact_name: '', emergency_relationship: '',
        emergency_mobile_phone: '', emergency_home_phone: '', emergency_email: '',
        siblings: [],
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/students');
    };

    const addSibling = () =>
        setData('siblings', [...data.siblings, { sibling_full_name: '', sibling_grade_level: '', sibling_id_number: '' }]);

    const removeSibling = (i: number) =>
        setData('siblings', data.siblings.filter((_, idx) => idx !== i));

    const updateSibling = (i: number, field: keyof SiblingEntry, value: string) => {
        const updated = [...data.siblings];
        updated[i] = { ...updated[i], [field]: value };
        setData('siblings', updated);
    };

    return { data, setData, processing, errors, handleSubmit, addSibling, removeSibling, updateSibling };
}
