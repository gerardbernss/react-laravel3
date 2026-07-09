import { AppInput } from '@/components/AppInput';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { HELPER_TEXT, LABEL_TEXT, PAGE_PADDING, PAGE_TITLE } from '@/constants/ui';
import { useRoleEdit } from '@/hooks/useRoleEdit';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Permission, type Role } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Shield } from 'lucide-react';

interface Props {
    role: Role;
    permissions: Permission[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Roles', href: '/admin/roles' },
    { title: 'Edit Role', href: '/admin/roles/edit' },
];

/** Admin role edit form with permission checkbox assignment; guards the super-admin role from modification. */
export default function Edit({ role, permissions }: Props) {
    const { data, setData, processing, errors, isSuperAdmin, handleSubmit, handlePermissionChange } = useRoleEdit({ role });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Role - ${role.name}`} />

            <div className={PAGE_PADDING}>
                <div className="mb-6 flex items-center gap-4">
                    <Link href="/admin/roles" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Roles
                    </Link>
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        <h1 className={PAGE_TITLE}>Edit Role: {role.name}</h1>
                    </div>
                </div>

                {isSuperAdmin && (
                    <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                        <div className="flex items-center gap-2 text-yellow-800">
                            <Shield className="h-5 w-5" />
                            <span className="font-medium">Super Admin Role</span>
                        </div>
                        <p className="mt-1 text-sm text-yellow-700">This is a protected role with special privileges. Some restrictions may apply.</p>
                    </div>
                )}

                <div className="max-w-4xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Role Information</CardTitle>
                            <CardDescription>Update the role details and permissions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <AppInput
                                        id="name"
                                        label="Role Name *"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g., Content Manager"
                                        disabled={isSuperAdmin}
                                        error={errors.name}
                                        hint={isSuperAdmin ? 'Super Admin role name cannot be changed' : undefined}
                                    />

                                    <div className="space-y-2">
                                        <Label htmlFor="is_active" className={LABEL_TEXT}>Status</Label>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="is_active"
                                                checked={data.is_active}
                                                onCheckedChange={(checked) => setData('is_active', checked as boolean)}
                                                disabled={isSuperAdmin}
                                            />
                                            <Label htmlFor="is_active">Active</Label>
                                        </div>
                                        {isSuperAdmin && <p className={HELPER_TEXT}>Super Admin role must remain active</p>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className={LABEL_TEXT}>Description</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Describe what this role is for..."
                                        rows={3}
                                        className={errors.description ? 'border-red-500' : ''}
                                    />
                                    <InputError message={errors.description} />
                                </div>

                                <div className="space-y-4">
                                    <Label className={LABEL_TEXT}>Permissions</Label>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {permissions.map((permission) => (
                                            <div key={permission.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`permission-${permission.id}`}
                                                    checked={data.permissions.includes(permission.id)}
                                                    onCheckedChange={(checked) => handlePermissionChange(permission.id, checked as boolean)}
                                                />
                                                <Label htmlFor={`permission-${permission.id}`} className="text-sm font-normal">
                                                    {permission.name}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                    <InputError message={errors.permissions} />
                                </div>

                                <div className="flex justify-end gap-4">
                                    <Link href="/admin/roles">
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
                                    </Link>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Updating...' : 'Update Role'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
