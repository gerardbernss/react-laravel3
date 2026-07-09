import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

interface Params {
    token: string;
    email: string;
}

/** Manage the student portal password reset form, posting token and new password to /student/reset-password. */
export function useStudentResetPassword({ token, email }: Params) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post('/student/reset-password', {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return { data, setData, processing, errors, submit };
}
