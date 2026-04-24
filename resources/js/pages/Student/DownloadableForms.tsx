import StudentLayout from '@/layouts/student-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Download } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Downloadable Forms',
        href: '/student/downloadable-forms',
    },
];

const forms = [
    { title: 'Application Form', file: '/forms/application-form.pdf' },
    { title: 'Letter of Recommendation', file: '/forms/letter-of-recommendation.pdf' },
    { title: 'Data Privacy Consent Form', file: '/forms/data-privacy-consent-form.pdf' },
];

export default function DownloadableForms() {
    return (
        <StudentLayout breadcrumbs={breadcrumbs}>
            <Head title="Downloadable Forms" />

            <div className="p-6 md:p-10">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Downloadable Forms</h1>
                </div>

                <ul className="mx-8 space-y-3">
                    {forms.map((form) => (
                        <li key={form.title} className="flex items-center gap-4">
                            <span className="text-sm text-gray-800">{form.title}</span>
                            <a href={form.file} download className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                                <Download className="h-3.5 w-3.5" />
                                Download
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </StudentLayout>
    );
}
