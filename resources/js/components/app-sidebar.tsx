import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { usePermissions } from '@/hooks/useAuth';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import {
    BookOpen,
    Briefcase,
    Building2,
    Calculator,
    Calendar,
    CalendarCheck,
    ClipboardList,
    DollarSign,
    FilePlus,
    GraduationCap,
    IdCard,
    Key,
    KeyRound,
    LayoutGrid,
    Percent,
    Shield,
    SquareStack,
    UserPlus,
    UserRoundPen,
    Users,
} from 'lucide-react';
import AppLogo from './app-logo';

/**
 * Role-based sidebar navigation
 * Items are filtered based on user permissions
 */

const allNavItems: NavItem[] = [
    {
        title: 'Home',
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
        title: 'Student Admissions',
        href: '/admissions/applicants',
        icon: Briefcase,
        permission: 'view-permissions',
    },
    {
        title: 'Exam Assignments',
        icon: UserPlus,
        permission: 'view-permissions',
        children: [
            {
                title: 'Assign Applicants',
                href: '/exam-assignments',
                icon: UserPlus,
            },
            {
                title: 'Exam Schedules',
                href: '/exam-schedules',
                icon: Calendar,
            },
            {
                title: 'Examination Rooms',
                href: '/examination-rooms',
                icon: Building2,
            },
        ],
    },
    {
        title: 'Student ID Assignment',
        href: '/studentidassignment',
        icon: IdCard,
        permission: 'view-permissions',
    },
    {
        title: 'Portal Credentials',
        href: '/portal-credentials',
        icon: KeyRound,
        permission: 'manage-portal-credentials',
    },
    {
        title: 'Enrollments',
        href: '/enrollment/dashboard',
        icon: UserRoundPen,
        permission: 'view-permissions',
    },
    {
        title: 'Grades',
        href: '/grades',
        icon: ClipboardList,
        permission: 'view-grades',
    },
    {
        title: 'Attendance',
        href: '/attendance',
        icon: CalendarCheck,
        permission: 'view-attendance',
    },
    {
        title: 'Subjects',
        href: '/subjects',
        icon: BookOpen,
        permission: 'view-permissions',
    },
    {
        title: 'Block Sections',
        href: '/block-sections',
        icon: SquareStack,
        permission: 'view-permissions',
    },
    {
        title: 'Courses/Programs',
        href: '/programs',
        icon: GraduationCap,
        permission: 'view-permissions',
    },

    {
        title: 'Fee Management',
        icon: DollarSign,
        permission: 'view-permissions',
        children: [
            {
                title: 'Fee Types',
                href: '/admin/fee-types',
                icon: DollarSign,
            },
            {
                title: 'Fee Rates',
                href: '/admin/fee-rates',
                icon: Calculator,
            },
            {
                title: 'Discount Types',
                href: '/admin/discount-types',
                icon: Percent,
            },
        ],
    },
];

const footerNavItems: NavItem[] = [
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
