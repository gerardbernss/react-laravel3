import { Button } from '@/components/ui/button';
import { Head } from '@inertiajs/react';
import { CheckCircle, FileText, Home, Mail } from 'lucide-react';

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
                <p className="mb-6 text-gray-600">Thank you for submitting your application to Saint Louis University.</p>

                {/* Portal Credentials Notice */}
                <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-4 text-left">
                    <div className="flex items-start gap-3">
                        <Mail className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                        <div>
                            <p className="font-semibold text-blue-800">Check your email</p>
                            <p className="mt-0.5 text-sm text-blue-700">
                                Your student portal login credentials have been sent to your email address. Use them to log in and track your
                                application status.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Next Steps */}
                <div className="mb-8 space-y-3 text-left text-sm text-gray-600">
                    <p className="flex items-start gap-2">
                        <span className="font-semibold text-gray-900">1.</span>
                        <span>Our admissions team will review your application and documents</span>
                    </p>
                    <p className="flex items-start gap-2">
                        <span className="font-semibold text-gray-900">2.</span>
                        <span>Log in to your student portal to check your evaluation result</span>
                    </p>
                    <p className="flex items-start gap-2">
                        <span className="font-semibold text-gray-900">3.</span>
                        <span>Check your email and portal regularly for updates</span>
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
                        className="flex flex-1 items-center justify-center gap-2"
                    >
                        <Home className="h-4 w-4" />
                        Home
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => (window.location.href = '/applications/start')}
                        className="flex flex-1 items-center justify-center gap-2"
                    >
                        <FileText className="h-4 w-4" />
                        New Application
                    </Button>
                </div>
            </div>
        </div>
    );
}
