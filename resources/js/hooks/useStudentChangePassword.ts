import { useForm } from '@inertiajs/react';

/** Manage the student change-password form, posting to /student/password. */
export function useStudentChangePassword() {
    const { data, setData, put, processing, errors, reset, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/student/password', {
            onSuccess: () => reset(),
        });
    };

    return { data, setData, processing, errors, recentlySuccessful, submit };
}
