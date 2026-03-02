import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

interface StudentForgotPasswordProps {
    status?: string;
}

export default function StudentForgotPassword({ status }: StudentForgotPasswordProps) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/student/forgot-password');
    };

    return (
        <AuthLayout title="Forgot Password" description="Enter your email to receive a password reset link">
            <Head title="Student Forgot Password" />

            {status && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-800">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-6">
                <div className="grid gap-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                        Email address
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        autoComplete="email"
                        autoFocus
                        placeholder="your.email@example.com"
                        className="rounded-lg border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-[#073066] focus:bg-white focus:ring-2 focus:ring-[#073066]/20"
                    />
                    <InputError message={errors.email} />
                </div>

                <Button
                    type="submit"
                    className="w-full rounded-lg bg-linear-to-r from-[#073066] to-[#004c88] py-2.5 font-semibold text-white shadow-md transition-all duration-200 hover:from-[#052247] hover:to-[#003966] hover:shadow-lg"
                    disabled={processing}
                >
                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    {processing ? 'Sending...' : 'Email password reset link'}
                </Button>

                <div className="text-center text-sm text-gray-700">
                    Remember your password?{' '}
                    <TextLink href="/login" className="font-semibold text-[#073066] hover:text-[#004c88]">
                        Back to login
                    </TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}
