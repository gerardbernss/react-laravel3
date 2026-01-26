import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { home } from '@/routes';
import { Head, Link } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface LoginDemoProps {
    status?: string;
    canResetPassword?: boolean;
}

export default function LoginDemo({ status, canResetPassword = true }: LoginDemoProps) {
    const [userType, setUserType] = useState('Student');
    const [portalId, setPortalId] = useState('');
    const [password, setPassword] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setProcessing(true);
        console.log('Form submitted:', { userType, portalId, password });
        setTimeout(() => setProcessing(false), 1000);
    };

    return (
        <>
            <Head title="Student Login" />

            <div
                className="relative flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10"
                style={{
                    backgroundImage: 'url(/images/login-bg.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed',
                }}
            >
                {/* Blur and blue fade overlay */}
                <div
                    className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                    style={{
                        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.5) 0%, rgba(30, 58, 138, 0.4) 100%)',
                        backdropFilter: 'blur(5px)',
                    }}
                ></div>

                <div className="relative z-10 flex w-full max-w-md flex-col gap-6">
                    <div className="flex flex-col gap-6">
                        <Card className="rounded-xl border-border">
                            <Link href={home()} className="flex items-center gap-2 self-center font-medium">
                                <img src="/images/slu-logo2.png" alt="SLU Logo" className="h-15 w-auto" />
                            </Link>
                            <CardHeader className="px-10 pb-0 text-center">
                                <CardTitle className="text-xl text-foreground">User Login</CardTitle>
                            </CardHeader>
                            <CardContent className="px-10 py-8">
                                <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                                    <div className="grid gap-6">
                                        {/* User Type Selection */} {/* Portal ID Field */}
                                        <div className="grid gap-2">
                                            <Label htmlFor="portalId" className="text-foreground">
                                                Portal Year/ID
                                            </Label>
                                            <Input
                                                id="portalId"
                                                type="text"
                                                value={portalId}
                                                onChange={(e) => setPortalId(e.target.value)}
                                                placeholder="1921207"
                                                className="text-foreground placeholder:text-muted-foreground"
                                                required
                                            />
                                        </div>
                                        {/* Password Field */}
                                        <div className="grid gap-2">
                                            <div className="flex items-center">
                                                <Label htmlFor="password" className="text-foreground">
                                                    Password
                                                </Label>
                                                {canResetPassword && (
                                                    <Link href="#" className="ml-auto text-sm font-medium text-primary hover:opacity-80">
                                                        Forgot password?
                                                    </Link>
                                                )}
                                            </div>
                                            <Input
                                                id="password"
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Password"
                                                className="text-foreground placeholder:text-muted-foreground"
                                                required
                                            />
                                        </div>
                                        {/* Submit Button */}
                                        <Button
                                            type="submit"
                                            className="mt-4 w-full bg-[#073066] text-primary-foreground hover:bg-primary/90"
                                            disabled={processing}
                                        >
                                            {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                            {processing ? 'Signing in...' : 'Sign in'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
