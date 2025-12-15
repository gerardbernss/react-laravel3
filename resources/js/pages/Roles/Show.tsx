import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Role } from '@/types';
import { usePermissions } from '@/hooks/useAuth';
import { Head, Link, usePage, useForm } from '@inertiajs/react';
import { ArrowLeft, Shield, Users, Calendar, CheckCircle, XCircle } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Roles', href: '/roles' },
    { title: 'Role Details', href: '/roles/show' },
];

interface PageProps {
    role: Role;
}

export default function Show() {
    const { role } = usePage().props as PageProps;
    const { hasPermission } = usePermissions();
    const { delete: destroy, processing } = useForm();

    const isSuperAdmin = role.slug === 'super-admin';

    const handleRemoveRole = (userId: number, userName: string) => {
        if (confirm(`Remove ${userName} from ${role.name} role?`)) {
            destroy(`/users/${userId}/remove-role`, {
                data: { role_id: role.id }
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Role Details - ${role.name}`} />
            
            <div className="m-4">
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/roles">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Roles
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        <h1 className="text-2xl font-bold">{role.name}</h1>
                    </div>
                </div>

                {isSuperAdmin && (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-800">
                            <Shield className="h-5 w-5" />
                            <span className="font-medium">Super Admin Role</span>
                        </div>
                        <p className="text-yellow-700 text-sm mt-1">
                            This is a protected role with full system access and special privileges.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Role Information */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    Role Information
                                </CardTitle>
                                <CardDescription>
                                    Basic information about this role
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Name</label>
                                        <p className="text-lg font-semibold">{role.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Slug</label>
                                        <p className="text-lg font-mono bg-gray-100 px-2 py-1 rounded">{role.slug}</p>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Description</label>
                                    <p className="text-lg">{role.description || 'No description provided'}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Status</label>
                                        <div className="mt-1">
                                            <Badge variant={role.is_active ? 'default' : 'secondary'}>
                                                {role.is_active ? (
                                                    <><CheckCircle className="h-3 w-3 mr-1" />Active</>
                                                ) : (
                                                    <><XCircle className="h-3 w-3 mr-1" />Inactive</>
                                                )}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Created</label>
                                        <p className="text-lg flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            {new Date(role.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Actions */}
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Actions</CardTitle>
                                <CardDescription>
                                    Available actions for this role
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {hasPermission('update-roles') && (
                                    <Link href={`/roles/${role.id}/edit`} className="block">
                                        <Button className="w-full">
                                            Edit Role
                                        </Button>
                                    </Link>
                                )}
                                
                                {hasPermission('view-roles') && (
                                    <Link href="/roles" className="block">
                                        <Button variant="outline" className="w-full">
                                            View All Roles
                                        </Button>
                                    </Link>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Permissions */}
                <div className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Permissions</CardTitle>
                            <CardDescription>
                                Permissions assigned to this role ({role.permissions?.length || 0} total)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {role.permissions && role.permissions.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {role.permissions.map((permission) => (
                                        <div key={permission.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            <div>
                                                <p className="font-medium">{permission.name}</p>
                                                {permission.description && (
                                                    <p className="text-sm text-gray-500">{permission.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p>No permissions assigned to this role</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Users with this role */}
                <div className="mt-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Users with this Role
                                    </CardTitle>
                                    <CardDescription>
                                        Users currently assigned to this role ({role.users?.length || 0} total)
                                    </CardDescription>
                                </div>
                                {hasPermission('assign-roles') && (
                                    <Link href={`/users?assign_role=${role.id}`}>
                                        <Button size="sm">
                                            <Users className="h-4 w-4 mr-2" />
                                            Assign User
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {role.users && role.users.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Joined</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {role.users.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">{user.name}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>
                                                    <Badge variant={user.email_verified_at ? 'default' : 'secondary'}>
                                                        {user.email_verified_at ? 'Verified' : 'Unverified'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        {hasPermission('update-users') && (
                                                            <Link href={`/users/${user.id}/edit`}>
                                                                <Button size="sm" variant="outline">
                                                                    Edit
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        {hasPermission('assign-roles') && (
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline"
                                                                disabled={processing}
                                                                onClick={() => handleRemoveRole(user.id, user.name)}
                                                            >
                                                                Remove Role
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p>No users assigned to this role</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
