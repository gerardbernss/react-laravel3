import { useForm } from '@inertiajs/react';
import { useState } from 'react';

export interface PersonalData {
    id: number;
    first_name: string;
    last_name: string;
    middle_name: string | null;
    suffix: string | null;
    gender: string | null;
    citizenship: string | null;
    religion: string | null;
    date_of_birth: string | null;
    place_of_birth: string | null;
    email: string;
    alt_email: string | null;
    mobile_number: string | null;
    present_street: string | null;
    present_brgy: string | null;
    present_city: string | null;
    present_province: string | null;
    present_zip: string | null;
    permanent_street: string | null;
    permanent_brgy: string | null;
    permanent_city: string | null;
    permanent_province: string | null;
    permanent_zip: string | null;
}

/** Manage the student personal info edit form, posting changes to /student/profile. */
export function useStudentPersonalInfo(personalData: PersonalData | null) {
    const [isEditing, setIsEditing] = useState(false);

    const { data, setData, put, processing, errors, reset } = useForm({
        alt_email:         personalData?.alt_email         || '',
        mobile_number:     personalData?.mobile_number     || '',
        present_street:    personalData?.present_street    || '',
        present_brgy:      personalData?.present_brgy      || '',
        present_city:      personalData?.present_city      || '',
        present_province:  personalData?.present_province  || '',
        present_zip:       personalData?.present_zip       || '',
        permanent_street:  personalData?.permanent_street  || '',
        permanent_brgy:    personalData?.permanent_brgy    || '',
        permanent_city:    personalData?.permanent_city    || '',
        permanent_province: personalData?.permanent_province || '',
        permanent_zip:     personalData?.permanent_zip     || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/student/profile', {
            onSuccess: () => setIsEditing(false),
        });
    };

    const handleCancel = () => {
        reset();
        setIsEditing(false);
    };

    return { isEditing, setIsEditing, data, setData, processing, errors, handleSubmit, handleCancel };
}
