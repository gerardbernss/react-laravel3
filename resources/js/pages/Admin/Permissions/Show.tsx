import { AppBadge } from '@/components/AppBadge';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BODY_TEXT, HELPER_TEXT, LABEL_TEXT, PAGE_PADDING, PAGE_TITLE, SECTION_HEADING } from '@/constants/ui';
import { usePermissions } from '@/hooks/useAuth';
import { usePermissionShow } from '@/hooks/usePermissionShow';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Permission } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Calendar, Key, Users } from 'lucide-react';

interface Props {
    permission: Permission;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Permissions', href: '/permissions' },
    { title: 'Permission Details', href: '/permissions/show' },
];

export default function Show({ permission }: Props) {
    const { hasPermission } = usePermissions();
    const { processing, showDeleteDialog, setShowDeleteDialog, confirmDelete } = usePermissionShow({ permission });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Permission: ${permission.name}`} />

            <div className={PAGE_PADDING}>
                <div className="mb-6 flex items-center gap-4">
                    <Link href="/permissions">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Permissions
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        <h1 className={PAGE_TITLE}>Permission Details</h1>
                    </div>
                </div>

                <div className="max-w-4xl">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
                                        <label className={LABEL_TEXT}>Name</label>
                                        <p className="text-lg font-semibold">{permission.name}</p>
                                    </div>

                                    <div>
                                        <label className={LABEL_TEXT}>Slug</label>
                                        <Badge variant="outline" className="font-mono">
                                            {permission.slug}
                                        </Badge>
                                    </div>

                                    <div>
                                        <label className={LABEL_TEXT}>Description</label>
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
                                        <label className={LABEL_TEXT}>Total Users with this Permission</label>
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
                                        <Button variant="destructive" className="w-full" disabled={processing} onClick={() => setShowDeleteDialog(true)}>
                                            Delete Permission
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {permission.roles && permission.roles.length > 0 ? (
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
                                        {permission.roles.map((role) => (
                                            <TableRow key={role.id}>
                                                <TableCell className="font-medium">{role.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-mono text-xs">
                                                        {role.slug}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <AppBadge status={role.is_active ? 'active' : 'inactive'}>
                                                        {role.is_active ? 'Active' : 'Inactive'}
                                                    </AppBadge>
                                                </TableCell>
                                                <TableCell>{role.users?.length || 0}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="mt-6">
                            <CardContent className="py-8 text-center">
                                <Users className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                <h3 className={`mb-2 ${SECTION_HEADING}`}>No roles assigned</h3>
                                <p className={BODY_TEXT}>This permission is not currently assigned to any roles.</p>
                                <p className={`mt-2 ${HELPER_TEXT}`}>No users will have access to this permission until it's assigned to at least one role.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            <ConfirmDialog
                open={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={confirmDelete}
                title="Delete Permission"
                description={`Are you sure you want to delete "${permission.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                processingLabel="Deleting..."
                processing={processing}
            />
        </AppLayout>
    );
}
