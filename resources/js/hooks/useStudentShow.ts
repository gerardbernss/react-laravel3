import { useForm } from '@inertiajs/react';
import { type FormEvent, useState } from 'react';

export interface PersonalData {
    id: number;
    last_name: string; first_name: string; middle_name: string | null; suffix: string | null;
    learner_reference_number: string | null; gender: string; citizenship: string; religion: string;
    date_of_birth: string; place_of_birth: string | null;
    email: string; alt_email: string | null; mobile_number: string | null;
    present_street: string | null; present_brgy: string | null; present_city: string | null;
    present_province: string | null; present_zip: string | null;
    permanent_street: string | null; permanent_brgy: string | null; permanent_city: string | null;
    permanent_province: string | null; permanent_zip: string | null;
    stopped_studying: string | null; accelerated: string | null;
    health_conditions: string[] | string | null;
    has_doctors_note: boolean | null;
    doctors_note_file: string | null;
}

export interface FamilyBackground {
    father_lname: string | null; father_fname: string | null; father_mname: string | null;
    father_living: string | null; father_contact_no: string | null; father_email: string | null;
    father_occupation: string | null;
    mother_lname: string | null; mother_fname: string | null; mother_mname: string | null;
    mother_living: string | null; mother_contact_no: string | null; mother_email: string | null;
    mother_occupation: string | null;
    guardian_lname: string | null; guardian_fname: string | null;
    guardian_relationship: string | null; guardian_contact_no: string | null; guardian_email: string | null;
    emergency_contact_name: string | null; emergency_relationship: string | null;
    emergency_mobile_phone: string | null; emergency_home_phone: string | null;
}

export interface Sibling {
    sibling_full_name: string | null; sibling_grade_level: string | null; sibling_id_number: string | null;
}

export interface EducationalBackground {
    id: number;
    school_name: string | null; school_address: string | null;
    from_grade: string | null; to_grade: string | null;
    from_year: string | null; to_year: string | null;
    honors_awards: string | null; general_average: string | null;
    class_rank: string | null; class_size: string | null;
}

export interface Documents {
    certificate_of_enrollment: string | null;
    birth_certificate: string | null;
    latest_report_card_front: string | null;
    latest_report_card_back: string | null;
}

export interface Enrollment {
    id: number; school_year: string; semester: string; year_level: string; status: string;
}

export interface StudentRecord {
    id: number; student_id_number: string | null; enrollment_status: string | null;
    current_year_level: string | null; current_school_year: string | null;
    current_semester: string | null; enrollment_date: string | null; source: string;
}

export interface Withdrawal {
    withdrawal_type: string;
    refund_amount: number;
    reason: string | null;
    processed_by: string | null;
    created_at: string;
}

interface Params {
    student: StudentRecord;
    personalData: PersonalData | null;
}

/** Manage the student detail page — withdrawal dialog with type and refund amount, posting to /admin/students/:id/withdraw. */
export function useStudentShow({ student, personalData }: Params) {
    const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);

    const withdrawForm = useForm({ withdrawal_type: 'during_enrollment', refund_amount: '0', reason: '' });

    const handleWithdraw = (e: FormEvent) => {
        e.preventDefault();
        withdrawForm.post(`/admin/students/${student.id}/withdraw`, {
            onSuccess: () => {
                setShowWithdrawDialog(false);
                withdrawForm.reset();
            },
        });
    };

    const fullName = personalData
        ? `${personalData.last_name}, ${personalData.first_name}${personalData.middle_name ? ` ${personalData.middle_name}` : ''}${personalData.suffix ? `, ${personalData.suffix}` : ''}`
        : 'Unknown';

    return { showWithdrawDialog, setShowWithdrawDialog, withdrawForm, handleWithdraw, fullName };
}
