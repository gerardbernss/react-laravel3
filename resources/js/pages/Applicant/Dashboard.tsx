import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { FileText } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/applicant/dashboard',
    },
];

export default function Dashboard({ applicant, message }: { applicant: any, message?: string }) {
    if (!applicant) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Applicant Dashboard" />
                <div className="flex h-full flex-col items-center justify-center p-4">
                     <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>Welcome</CardTitle>
                            <CardDescription>
                                {message || 'No application found.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <p className="text-sm text-gray-500">Please contact the admissions office if you believe this is an error.</p>
                        </CardContent>
                     </Card>
                </div>
            </AppLayout>
        );
    }

    const { personal_data, application_number, application_status } = applicant;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Applicant Dashboard" />
            <div className="flex flex-col gap-6 p-4 md:p-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Applicant Portal</h1>
                        <p className="text-muted-foreground">Manage your application and personal information.</p>
                    </div>
                    <Link href="/applicant/profile/edit">
                        <Button className="bg-[#073066] hover:bg-[#052247]">
                            Edit Information
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Application Status Card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Application Status</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{application_status || 'Pending'}</div>
                            <p className="text-xs text-muted-foreground">
                                Application #: {application_number}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Personal Info Summary */}
                    <Card className="col-span-1 md:col-span-2 lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Full Name</p>
                                    <p className="text-base font-semibold">
                                        {personal_data.last_name}, {personal_data.first_name} {personal_data.middle_name}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Email</p>
                                    <p className="text-base">{personal_data.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Contact Number</p>
                                    <p className="text-base">{personal_data.mobile_number}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Gender</p>
                                    <p className="text-base">{personal_data.gender}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
