import { Button } from '@/components/ui/button';
import { Head } from '@inertiajs/react';
import { CheckCircle, FileText, Home } from 'lucide-react';

export default function ApplicationSuccess() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Head title="Application Successful" />
            <div className="mx-auto w-full max-w-md text-center">
                {/* Success Icon */}
                <div className="mb-6 flex justify-center">
                    <CheckCircle className="h-16 w-16 text-green-500" strokeWidth={2} />
                </div>

                {/* Main Message */}
                <h1 className="mb-2 text-2xl font-bold text-gray-900">Application Submitted!</h1>
                <p className="mb-8 text-gray-600">Thank you for submitting your application to Saint Louis University.</p>

                {/* Next Steps */}
                <div className="mb-8 space-y-3 text-left text-sm text-gray-600">
                    <p className="flex items-start gap-2">
                        <span className="font-semibold text-gray-900">1.</span>
                        <span>Our admissions team will review your application</span>
                    </p>
                    <p className="flex items-start gap-2">
                        <span className="font-semibold text-gray-900">2.</span>
                        <span>You'll receive a confirmation email with your reference number</span>
                    </p>
                    <p className="flex items-start gap-2">
                        <span className="font-semibold text-gray-900">3.</span>
                        <span>Check your email regularly for updates</span>
                    </p>
                </div>

                {/* Contact */}
                <div className="mb-8 text-sm text-gray-600">
                    <p className="mb-1">Need help?</p>
                    <p>
                        <a href="mailto:admissions@slu.edu.ph" className="text-blue-600 hover:underline">
                            admissions@slu.edu.ph
                        </a>
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <Button
                        onClick={() => (window.location.href = '/dashboard')}
                        className="flex flex-1 items-center justify-center gap-2 bg-[#073066] text-white hover:bg-[#05509e]"
                    >
                        <Home className="h-4 w-4" />
                        Home
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => (window.location.href = '/applications/applicants/create')}
                        className="flex flex-1 items-center justify-center gap-2 border-2 border-[#073066] text-[#073066] hover:bg-blue-50"
                    >
                        <FileText className="h-4 w-4" />
                        New Application
                    </Button>
                </div>
            </div>
        </div>
    );
}
