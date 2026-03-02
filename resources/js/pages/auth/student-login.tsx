import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

interface StudentLoginProps {
    status?: string;
}

export default function StudentLogin({ status }: StudentLoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        username: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/student/login', {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout title="Student Portal Login" description="Enter your portal credentials to access your account">
            <Head title="Student Login" />

            <form onSubmit={submit} className="flex flex-col gap-6">
                <div className="grid gap-5">
                    <div className="grid gap-2">
                        <Label htmlFor="username" className="text-sm font-semibold text-gray-700">
                            Email (Username)
                        </Label>
                        <Input
                            id="username"
                            type="email"
                            name="username"
                            value={data.username}
                            onChange={(e) => setData('username', e.target.value)}
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            placeholder="your.email@example.com"
                            className="rounded-lg border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-[#073066] focus:bg-white focus:ring-2 focus:ring-[#073066]/20"
                        />
                        <InputError message={errors.username} />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                                Password
                            </Label>
                            <TextLink
                                href="/student/forgot-password"
                                className="text-xs font-medium text-[#073066] hover:text-[#004c88]"
                                tabIndex={5}
                            >
                                Forgot password?
                            </TextLink>
                        </div>
                        <Input
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            placeholder="Password"
                            className="rounded-lg border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-[#073066] focus:bg-white focus:ring-2 focus:ring-[#073066]/20"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="flex items-center space-x-3 py-1">
                        <Checkbox
                            id="remember"
                            name="remember"
                            checked={data.remember}
                            onCheckedChange={(checked) => setData('remember', checked as boolean)}
                            tabIndex={3}
                            className="border-gray-300"
                        />
                        <Label htmlFor="remember" className="text-sm font-normal text-gray-700">
                            Remember me
                        </Label>
                    </div>

                    <Button
                        type="submit"
                        className="mt-2 w-full rounded-lg bg-linear-to-r from-[#073066] to-[#004c88] py-2.5 font-semibold text-white shadow-md transition-all duration-200 hover:from-[#052247] hover:to-[#003966] hover:shadow-lg"
                        tabIndex={4}
                        disabled={processing}
                    >
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        {processing ? 'Logging in...' : 'Log in to Student Portal'}
                    </Button>
                </div>

                <div className="text-center text-sm text-gray-700">
                    Admin/Staff?{' '}
                    <TextLink href="/login" className="font-semibold text-[#073066] hover:text-[#004c88]" tabIndex={5}>
                        Login here
                    </TextLink>
                </div>
            </form>

            {status && (
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">{status}</div>
            )}
        </AuthLayout>
    );
}
