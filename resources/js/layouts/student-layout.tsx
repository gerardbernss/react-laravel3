import { StudentSidebar } from '@/components/student-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { type BreadcrumbItem } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { type PropsWithChildren, useEffect } from 'react';
import { Toaster, toast } from 'sonner';

interface StudentLayoutProps extends PropsWithChildren {
    breadcrumbs?: BreadcrumbItem[];
}

export default function StudentLayout({ children, breadcrumbs = [] }: StudentLayoutProps) {
    const { props: pageProps } = usePage<{
        flash?: {
            message?: string;
            success?: string;
            error?: string;
            info?: string;
            warning?: string;
        };
    }>();

    // Check authentication when page becomes visible (handles back button)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // Reload to check auth status when user returns to page
                router.reload({ only: ['auth'] });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    useEffect(() => {
        if (pageProps.flash?.message) {
            toast.success(pageProps.flash.message, {
                duration: 4000,
                position: 'top-right',
            });
        }

        if (pageProps.flash?.success) {
            toast.success(pageProps.flash.success, {
                duration: 4000,
                position: 'top-right',
            });
        }

        if (pageProps.flash?.error) {
            toast.error(pageProps.flash.error, {
                duration: 4000,
                position: 'top-right',
            });
        }

        if (pageProps.flash?.info) {
            toast.info(pageProps.flash.info, {
                duration: 4000,
                position: 'top-right',
            });
        }

        if (pageProps.flash?.warning) {
            toast.warning(pageProps.flash.warning, {
                duration: 4000,
                position: 'top-right',
            });
        }
    }, [pageProps.flash]);

    return (
        <>
            <Toaster
                position="top-right"
                richColors
                toastOptions={{
                    style: {
                        zIndex: 99999,
                    },
                }}
            />
            <SidebarProvider defaultOpen>
                <StudentSidebar />
                <SidebarInset>
                <div className="flex h-full flex-1 flex-col overflow-hidden rounded-xl">
                    {/* Header with breadcrumbs */}
                    {breadcrumbs.length > 0 && (
                        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-6">
                            <nav className="flex items-center gap-2 text-sm">
                                {breadcrumbs.map((item, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        {index > 0 && <span className="text-gray-400">/</span>}
                                        <span className={index === breadcrumbs.length - 1 ? 'font-medium text-gray-900' : 'text-gray-500'}>
                                            {item.title}
                                        </span>
                                    </div>
                                ))}
                            </nav>
                        </header>
                    )}

                    {/* Main content */}
                    <main className="flex-1 overflow-auto bg-gray-50">
                        {children}
                    </main>
                </div>
            </SidebarInset>
        </SidebarProvider>
        </>
    );
}
