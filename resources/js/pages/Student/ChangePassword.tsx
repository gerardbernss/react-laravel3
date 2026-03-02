import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import StudentLayout from '@/layouts/student-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { AlertCircle, CheckCircle, Key, Lock, Save } from 'lucide-react';
import { FormEventHandler } from 'react';

interface Props {
    student: {
        id: number;
        username: string;
        password_changed: boolean;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/student/dashboard',
    },
    {
        title: 'Change Password',
        href: '/student/change-password',
    },
];

export default function ChangePassword({ student }: Props) {
    const { data, setData, put, processing, errors, reset, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put('/student/change-password', {
            onSuccess: () => reset(),
        });
    };

    return (
        <StudentLayout breadcrumbs={breadcrumbs}>
            <Head title="Change Password" />

            <div className="p-6 md:p-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Change Password</h1>
                    <p className="mt-2 text-gray-600">
                        Update your password to keep your account secure
                    </p>
                </div>

                {/* Password Change Warning (if not changed yet) */}
                {!student.password_changed && (
                    <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                            <div>
                                <h3 className="font-medium text-yellow-800">Password Change Required</h3>
                                <p className="text-sm text-yellow-700">
                                    For security purposes, please change your temporary password to a new one.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success Message */}
                {recentlySuccessful && (
                    <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <div>
                                <h3 className="font-medium text-green-800">Password Changed Successfully</h3>
                                <p className="text-sm text-green-700">
                                    Your password has been updated. Please use your new password on your next login.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="max-w-xl">
                    <div className="rounded-lg border bg-white p-6 shadow-sm transition-all hover:shadow-md">
                        <div className="mb-6 flex items-center gap-2">
                            <Key className="h-5 w-5 text-gray-400" />
                            <h2 className="text-lg font-semibold text-gray-900">Update Password</h2>
                        </div>

                        <form onSubmit={submit} className="space-y-6">
                            {/* Current Password */}
                            <div>
                                <Label htmlFor="current_password">Current Password</Label>
                                <div className="relative mt-1">
                                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        id="current_password"
                                        type="password"
                                        value={data.current_password}
                                        onChange={(e) => setData('current_password', e.target.value)}
                                        className="pl-10"
                                        placeholder="Enter your current password"
                                        autoComplete="current-password"
                                    />
                                </div>
                                <InputError message={errors.current_password} className="mt-2" />
                            </div>

                            {/* New Password */}
                            <div>
                                <Label htmlFor="password">New Password</Label>
                                <div className="relative mt-1">
                                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="pl-10"
                                        placeholder="Enter your new password"
                                        autoComplete="new-password"
                                    />
                                </div>
                                <InputError message={errors.password} className="mt-2" />
                                <p className="mt-1 text-xs text-gray-500">
                                    Password must be at least 8 characters long
                                </p>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <Label htmlFor="password_confirmation">Confirm New Password</Label>
                                <div className="relative mt-1">
                                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        className="pl-10"
                                        placeholder="Confirm your new password"
                                        autoComplete="new-password"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end">
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Updating...' : 'Update Password'}
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Password Tips */}
                    <div className="mt-6 rounded-lg border bg-gray-50 p-6">
                        <h3 className="mb-3 font-medium text-gray-900">Password Security Tips</h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-start gap-2">
                                <CheckCircle className="mt-0.5 h-4 w-4 text-green-500" />
                                Use at least 8 characters
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="mt-0.5 h-4 w-4 text-green-500" />
                                Include uppercase and lowercase letters
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="mt-0.5 h-4 w-4 text-green-500" />
                                Include at least one number
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="mt-0.5 h-4 w-4 text-green-500" />
                                Include at least one special character (!@#$%^&*)
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="mt-0.5 h-4 w-4 text-green-500" />
                                Avoid using personal information
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
}
