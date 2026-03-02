import { NavFooter } from '@/components/nav-footer';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, useForm, usePage } from '@inertiajs/react';
import { BookOpen, GraduationCap, Home, Key, User } from 'lucide-react';
import AppLogo from './app-logo';
import { NavMain } from './nav-main';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';

/**
 * Student portal sidebar navigation
 * Limited tabs: Dashboard, Enrollment, Personal Info
 */

const studentNavItems: NavItem[] = [
    {
        title: 'Home',
        href: '/student/dashboard',
        icon: Home,
    },
    {
        title: 'Enrollment',
        href: '/student/enrollment',
        icon: GraduationCap,
    },
    {
        title: 'Personal Information',
        href: '/student/personal-info',
        icon: User,
    },
    {
        title: 'Change Password',
        href: '/student/change-password',
        icon: Key,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Help & Support',
        href: '#',
        icon: BookOpen,
    },
];

function StudentNavUser() {
    const { auth } = usePage<{
        auth: { student: { name: string; email: string; personal_data?: { first_name: string; last_name: string } } | null };
    }>().props;
    const student = auth.student;

    const { post } = useForm();

    const handleLogout = () => {
        post('/student/logout');
    };

    if (!student) return null;

    const initials = student.personal_data
        ? `${student.personal_data.first_name[0]}${student.personal_data.last_name[0]}`
        : student.name.substring(0, 2).toUpperCase();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="cursor-pointer">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-xs text-primary-foreground">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{student.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{student.email}</span>
                    </div>
                </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/student/personal-info">
                        <User className="mr-2 h-4 w-4" />
                        Personal Info
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/student/change-password">
                        <Key className="mr-2 h-4 w-4" />
                        Change Password
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function StudentSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/student/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={studentNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <StudentNavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
