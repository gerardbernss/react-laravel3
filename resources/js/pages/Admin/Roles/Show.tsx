import { AppBadge } from '@/components/AppBadge';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BODY_TEXT, PAGE_PADDING, PAGE_TITLE } from '@/constants/ui';
import { usePermissions } from '@/hooks/useAuth';
import { useRoleShow } from '@/hooks/useRoleShow';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Role } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Calendar, CheckCircle, Shield, Users, XCircle } from 'lucide-react';

interface Props {
    role: Role;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Roles', href: '/roles' },
    { title: 'Role Details', href: '/roles/show' },
];

export default function Show({ role }: Props) {
    const { hasPermission } = usePermissions();
    const { isSuperAdmin, processing, removeDialog, setRemoveDialog, handleRemoveRole, confirmRemoveRole } = useRoleShow({ role });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Role Details - ${role.name}`} />

            <div className={PAGE_PADDING}>
                <div className="mb-6 flex items-center gap-4">
                    <Link href="/roles">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Roles
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        <h1 className={PAGE_TITLE}>{role.name}</h1>
                    </div>
                </div>

                {isSuperAdmin && (
                    <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                        <div className="flex items-center gap-2 text-yellow-800">
                            <Shield className="h-5 w-5" />
                            <span className="font-medium">Super Admin Role</span>
                        </div>
                        <p className="mt-1 text-sm text-yellow-700">This is a protected role with full system access and special privileges.</p>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    Role Information
                                </CardTitle>
                                <CardDescription>Basic information about this role</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Name</label>
                                        <p className="text-lg font-semibold">{role.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Slug</label>
                                        <p className="rounded bg-gray-100 px-2 py-1 font-mono text-lg">{role.slug}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Description</label>
                                    <p className="text-lg">{role.description || 'No description provided'}</p>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Status</label>
                                        <div className="mt-1">
                                            <AppBadge status={role.is_active ? 'active' : 'inactive'}>
                                                {role.is_active ? (
                                                    <>
                                                        <CheckCircle className="mr-1 h-3 w-3" />
                                                        Active
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="mr-1 h-3 w-3" />
                                                        Inactive
                                                    </>
                                                )}
                                            </AppBadge>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Created</label>
                                        <p className="flex items-center gap-1 text-lg">
                                            <Calendar className="h-4 w-4" />
                                            {new Date(role.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Actions</CardTitle>
                                <CardDescription>Available actions for this role</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {hasPermission('update-roles') && (
                                    <Link href={`/roles/${role.id}/edit`} className="block">
                                        <Button className="w-full">Edit Role</Button>
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

                <div className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Permissions</CardTitle>
                            <CardDescription>Permissions assigned to this role ({role.permissions?.length || 0} total)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {role.permissions && role.permissions.length > 0 ? (
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                                    {role.permissions.map((permission) => (
                                        <div key={permission.id} className="flex items-center gap-2 rounded-lg bg-gray-50 p-3">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            <div>
                                                <p className="font-medium">{permission.name}</p>
                                                {permission.description && <p className="text-sm text-gray-500">{permission.description}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center">
                                    <Shield className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                                    <p className={BODY_TEXT}>No permissions assigned to this role</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Users with this Role
                                    </CardTitle>
                                    <CardDescription>Users currently assigned to this role ({role.users?.length || 0} total)</CardDescription>
                                </div>
                                {hasPermission('assign-roles') && (
                                    <Link href={`/users?assign_role=${role.id}`}>
                                        <Button size="sm">
                                            <Users className="mr-2 h-4 w-4" />
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
                                                <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
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
                                <div className="py-8 text-center">
                                    <Users className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                                    <p className={BODY_TEXT}>No users assigned to this role</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ConfirmDialog
                open={removeDialog.open}
                onClose={() => setRemoveDialog({ open: false, userId: 0, userName: '' })}
                onConfirm={confirmRemoveRole}
                title="Remove Role"
                description={`Are you sure you want to remove ${removeDialog.userName} from the ${role.name} role?`}
                confirmLabel="Remove"
                processingLabel="Removing..."
                processing={processing}
                variant="warning"
            />
        </AppLayout>
    );
}
