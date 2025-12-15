import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePermissions } from '@/hooks/useAuth';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Permission } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Calendar, Key, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Permissions', href: '/permissions' },
    { title: 'Permission Details', href: '/permissions/show' },
];

interface PageProps {
    permission: Permission;
}

export default function Show() {
    const { permission } = usePage().props as PageProps;
    const { hasPermission } = usePermissions();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Permission: ${permission.name}`} />

            <div className="m-4">
                <div className="mb-6 flex items-center gap-4">
                    <Link href="/permissions">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Permissions
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        <h1 className="text-2xl font-bold">Permission Details</h1>
                    </div>
                </div>

                <div className="max-w-4xl">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Permission Information */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Key className="h-5 w-5" />
                                        {permission.name}
                                    </CardTitle>
                                    <CardDescription>Permission details and information</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Name</label>
                                        <p className="text-lg font-semibold">{permission.name}</p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Slug</label>
                                        <Badge variant="outline" className="font-mono">
                                            {permission.slug}
                                        </Badge>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Description</label>
                                        <p className="text-gray-600">{permission.description || 'No description provided'}</p>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-gray-500" />
                                            <span className="text-sm text-gray-600">
                                                Created: {new Date(permission.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-gray-500" />
                                            <span className="text-sm text-gray-600">
                                                Updated: {new Date(permission.updated_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Total Users with this Permission</label>
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-blue-500" />
                                            <span className="text-lg font-semibold text-blue-600">
                                                {permission.roles?.reduce((total, role) => total + (role.users?.length || 0), 0) || 0}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Actions Sidebar */}
                        <div>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Actions</CardTitle>
                                    <CardDescription>Available actions for this permission</CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-1 space-y-1">
                                    {hasPermission('update-permissions') && (
                                        <Link href={`/permissions/${permission.id}/edit`} className="w-full">
                                            <Button className="w-full">Edit Permission</Button>
                                        </Link>
                                    )}

                                    {hasPermission('delete-permissions') && (
                                        <Button
                                            variant="destructive"
                                            className="w-full"
                                            onClick={() => {
                                                if (confirm(`Are you sure you want to delete "${permission.name}"?`)) {
                                                    // Handle delete - would need to implement delete form
                                                }
                                            }}
                                        >
                                            Delete Permission
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Roles with this permission */}
                    {permission?.roles && permission?.roles.length > 0 && (
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Roles with this Permission
                                </CardTitle>
                                <CardDescription>Roles that currently have this permission assigned</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Role Name</TableHead>
                                            <TableHead>Slug</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Users with this Role</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {permission?.roles.map((role) => (
                                            <TableRow key={role.id}>
                                                <TableCell className="font-medium">{role.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-mono text-xs">
                                                        {role.slug}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={role.is_active ? 'default' : 'secondary'}>
                                                        {role.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{role.users?.length || 0}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

                    {(!permission.roles || permission.roles.length === 0) && (
                        <Card className="mt-6">
                            <CardContent className="py-8 text-center">
                                <Users className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                <h3 className="mb-2 text-lg font-medium text-gray-900">No roles assigned</h3>
                                <p className="text-gray-500">This permission is not currently assigned to any roles.</p>
                                <p className="text-sm text-gray-400 mt-2">No users will have access to this permission until it's assigned to at least one role.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
