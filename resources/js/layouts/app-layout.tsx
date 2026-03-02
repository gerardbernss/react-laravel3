import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { type ReactNode, useEffect } from 'react';
import { Toaster, toast } from 'sonner';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => {
    const { props: pageProps } = usePage<{
        flash?: {
            message?: string; // Add this
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
        console.log('AppLayout - Flash messages:', pageProps.flash);

        // Handle generic 'message' as success
        if (pageProps.flash?.message) {
            console.log('Showing message toast:', pageProps.flash.message);
            toast.success(pageProps.flash.message, {
                duration: 4000,
                position: 'top-right',
            });
        }

        if (pageProps.flash?.success) {
            console.log('Showing success toast:', pageProps.flash.success);
            toast.success(pageProps.flash.success, {
                duration: 4000,
                position: 'top-right',
            });
        }

        if (pageProps.flash?.error) {
            console.log('Showing error toast:', pageProps.flash.error);
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
            <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
                {children}
            </AppLayoutTemplate>
        </>
    );
};
