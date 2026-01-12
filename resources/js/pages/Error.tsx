import { Button } from '@/components/ui/button';
import { Head } from '@inertiajs/react';

interface ErrorProps {
    status: number;
}

export default function ErrorPage({ status }: ErrorProps) {
    const title = {
        503: '503: Service Unavailable',
        500: '500: Server Error',
        404: '404: Page Not Found',
        403: '403: Forbidden',
    }[status] || 'An Error Occurred';

    const description = {
        503: 'Sorry, we are doing some maintenance. Please check back soon.',
        500: 'Whoops, something went wrong on our servers.',
        404: 'Sorry, the page you are looking for could not be found.',
        403: 'Sorry, you are forbidden from accessing this page.',
    }[status] || 'An unexpected error occurred.';

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center">
            <Head title={title} />
            <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-lg">
                <div className="text-6xl font-bold text-[#073066]">{status}</div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                <p className="text-gray-600">{description}</p>
                <div className="pt-6">
                    <Button
                        onClick={() => window.history.back()}
                        variant="outline"
                        className="mr-2"
                    >
                        Go Back
                    </Button>
                    <Button
                        onClick={() => (window.location.href = '/')}
                        className="bg-[#073066] hover:bg-[#05204a]"
                    >
                        Go Home
                    </Button>
                </div>
            </div>
        </div>
    );
}
