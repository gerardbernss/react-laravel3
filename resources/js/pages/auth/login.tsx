import AuthenticatedSessionController from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { request } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    return (
        <AuthLayout title="Log in to your account" description="Enter your email and password below to log in">
            <Head title="Log in" />

            <Form {...AuthenticatedSessionController.store.form()} resetOnSuccess={['password']} className="flex flex-col gap-6">
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                                    Email address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                    className="rounded-lg border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-[#073066] focus:bg-white focus:ring-2 focus:ring-[#073066]/20"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                                        Password
                                    </Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-xs font-medium text-[#073066] hover:text-[#004c88]"
                                            tabIndex={5}
                                        >
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                    className="rounded-lg border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-[#073066] focus:bg-white focus:ring-2 focus:ring-[#073066]/20"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3 py-1">
                                <Checkbox id="remember" name="remember" tabIndex={3} className="border-gray-300" />
                                <Label htmlFor="remember" className="text-sm font-normal text-gray-700">
                                    Remember me
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full rounded-lg bg-linear-to-r from-[#073066] to-[#004c88] py-2.5 font-semibold text-white shadow-md transition-all duration-200 hover:from-[#052247] hover:to-[#003966] hover:shadow-lg"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                {processing ? 'Logging in...' : 'Log in'}
                            </Button>
                        </div>

                        <div className="text-center text-sm text-gray-700">
                            Forgot password?{' '}
                            <TextLink href={register()} className="font-semibold text-[#073066] hover:text-[#004c88]" tabIndex={5}>
                                Account request
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>

            {status && (
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">{status}</div>
            )}
        </AuthLayout>
    );
}
