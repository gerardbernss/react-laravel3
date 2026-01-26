import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { home } from '@/routes';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    name?: string;
    title?: string;
    description?: string;
}>) {
    return (
        <div
            className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden p-6 md:p-10"
            style={{
                backgroundImage: `url('/images/login-bg.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            {/* Blueish fade overlay with blur effect */}
            <div className="absolute inset-0 bg-linear-to-br from-[#073066]/70 via-[#004c88]/60 to-[#073066]/70 backdrop-blur-sm" />

            <div className="relative z-10 flex w-full max-w-md flex-col gap-6">
                <Link href={home()} className="flex items-center gap-2 self-center font-medium">
                    <img src="/images/slu-logo.png" alt="SLU Logo" className="h-16 w-16 object-contain drop-shadow-lg" />
                </Link>

                <div className="flex flex-col gap-6">
                    <Card className="rounded-2xl border-0 shadow-2xl">
                        <CardHeader className="border-b border-gray-100 px-10 pt-8 pb-6 text-center">
                            <CardTitle className="text-2xl font-bold text-[#073066]">{title}</CardTitle>
                            <CardDescription className="mt-2 text-gray-600">{description}</CardDescription>
                        </CardHeader>
                        <CardContent className="px-10 py-8">{children}</CardContent>
                    </Card>

                    <div className="text-center text-sm font-medium text-white/90">
                        <p>© 2026 Saint Louis University. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
