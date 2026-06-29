import { useForm } from '@inertiajs/react';
import { type FormEvent, useState } from 'react';

export function useStudentLogin() {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        username: '',
        password: '',
        remember: false,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post('/student/login', {
            onFinish: () => reset('password'),
        });
    };

    return { showPassword, setShowPassword, data, setData, processing, errors, submit };
}
