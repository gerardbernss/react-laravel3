import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Briefcase, FileText, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

export default function Dashboard() {
    const admissionLinks = [
        {
            title: 'Applicants',
            href: '/admissions/applicants',
            description: 'Manage student applications',
            icon: Users,
        },
        {
            title: 'Entrance Exams',
            href: '/admissions/entrance-exams',
            description: 'Schedule and record entrance exams',
            icon: FileText,
        },
        {
            title: 'Assessments',
            href: '/admissions/assessments',
            description: 'Create and review assessments',
            icon: Briefcase,
        },
        {
            title: 'Portal Credentials',
            href: '/admissions/portal-credentials',
            description: 'Generate student portal credentials',
            icon: FileText,
        },
        {
            title: 'Enrollments',
            href: '/admissions/enrollments',
            description: 'Process student enrollments',
            icon: Users,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="mb-6">
                    <h2 className="mb-4 text-2xl font-bold text-foreground">Student Admissions System</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {admissionLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:border-primary hover:shadow-lg"
                                >
                                    <div className="absolute inset-0 -z-10 bg-linear-to-br from-primary/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                                                {link.title}
                                            </h3>
                                            <p className="mt-1 text-sm text-muted-foreground">{link.description}</p>
                                        </div>
                                        <Icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                </div>
                <div className="relative min-h-screen flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </div>
        </AppLayout>
    );
}
