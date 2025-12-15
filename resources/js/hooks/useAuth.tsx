import { usePage } from '@inertiajs/react';
import { type SharedData, type User } from '@/types';

export function useAuth() {
    const { auth } = usePage<SharedData>().props;
    return auth;
}

export function useUser(): User {
    const { user } = useAuth();
    return user;
}

export function usePermissions() {
    const user = useUser();
    
    const hasPermission = (permission: string): boolean => {
        if (!user.roles) return false;
        
        return user.roles.some(role => 
            role.permissions?.some(perm => perm.slug === permission)
        );
    };

    const hasAnyPermission = (permissions: string[]): boolean => {
        return permissions.some(permission => hasPermission(permission));
    };

    const hasAllPermissions = (permissions: string[]): boolean => {
        return permissions.every(permission => hasPermission(permission));
    };

    return {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
    };
}

export function useRoles() {
    const user = useUser();
    
    const hasRole = (role: string): boolean => {
        if (!user.roles) return false;
        
        return user.roles.some(r => r.slug === role);
    };

    const hasAnyRole = (roles: string[]): boolean => {
        return roles.some(role => hasRole(role));
    };

    const hasAllRoles = (roles: string[]): boolean => {
        return roles.every(role => hasRole(role));
    };

    const isAdmin = (): boolean => {
        return hasAnyRole(['super-admin', 'admin']);
    };

    const isSuperAdmin = (): boolean => {
        return hasRole('super-admin');
    };

    return {
        hasRole,
        hasAnyRole,
        hasAllRoles,
        isAdmin,
        isSuperAdmin,
    };
}

export function useCan() {
    const { hasPermission } = usePermissions();
    const { hasRole } = useRoles();
    
    const can = (action: string, resource?: any): boolean => {
        // Check for specific permissions first
        if (hasPermission(action)) {
            return true;
        }
        
        // Check for role-based permissions
        if (hasRole('super-admin')) {
            return true;
        }
        
        return false;
    };

    return { can };
}
