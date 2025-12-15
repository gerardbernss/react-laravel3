import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { usePermissions } from '@/hooks/useAuth';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, FilePlus, FileSearchIcon, Folder, Key, LayoutGrid, Shield, UserRoundPen, Users } from 'lucide-react';
import AppLogo from './app-logo';

/**
 * Role-based sidebar navigation
 * Items are filtered based on user permissions
 */

const allNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Application',
        href: '/applications/start',
        icon: FilePlus,
        permission: 'view-permissions',
    },
    {
        title: 'Evaluation/Assessment',
        href: '/admissions/applicants',
        icon: FileSearchIcon,
        permission: 'view-permissions',
    },
    {
        title: 'Student ID Assignment',
        href: '/studentidassignment',
        icon: UserRoundPen,
        permission: 'view-permissions',
    },

    {
        title: 'Users',
        href: '/users',
        icon: Users,
        permission: 'view-users',
    },
    {
        title: 'Roles',
        href: '/roles',
        icon: Shield,
        permission: 'view-roles',
    },
    {
        title: 'Permissions',
        href: '/permissions',
        icon: Key,
        permission: 'view-permissions',
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { hasPermission } = usePermissions();

    // Filter navigation items based on user permissions
    const mainNavItems = allNavItems.filter((item) => {
        // Dashboard is always visible
        if (item.title === 'Dashboard') return true;

        // Check permission if specified
        if (item.permission) {
            return hasPermission(item.permission);
        }

        // Default to visible if no permission specified
        return true;
    });

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
