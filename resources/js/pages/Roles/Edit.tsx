import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Role, type Permission } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Shield } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Roles', href: '/roles' },
    { title: 'Edit Role', href: '/roles/edit' },
];

interface PageProps {
    role: Role;
    permissions: Permission[];
}

export default function Edit() {
    const { role, permissions } = usePage().props as PageProps;

    const { data, setData, put, processing, errors } = useForm({
        name: role.name || '',
        description: role.description || '',
        is_active: role.is_active ?? true,
        permissions: role.permissions?.map(p => p.id) || [],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/roles/${role.id}`);
    };

    const handlePermissionChange = (permissionId: number, checked: boolean) => {
        if (checked) {
            setData('permissions', [...data.permissions, permissionId]);
        } else {
            setData('permissions', data.permissions.filter(id => id !== permissionId));
        }
    };

    const isSuperAdmin = role.slug === 'super-admin';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Role - ${role.name}`} />
            
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
                        <h1 className="text-2xl font-bold">Edit Role: {role.name}</h1>
                    </div>
                </div>

                {isSuperAdmin && (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-800">
                            <Shield className="h-5 w-5" />
                            <span className="font-medium">Super Admin Role</span>
                        </div>
                        <p className="text-yellow-700 text-sm mt-1">
                            This is a protected role with special privileges. Some restrictions may apply.
                        </p>
                    </div>
                )}

                <div className="max-w-4xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Role Information</CardTitle>
                            <CardDescription>
                                Update the role details and permissions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Role Name *</Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="e.g., Content Manager"
                                            className={errors.name ? 'border-red-500' : ''}
                                            disabled={isSuperAdmin}
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-red-500">{errors.name}</p>
                                        )}
                                        {isSuperAdmin && (
                                            <p className="text-sm text-gray-500">
                                                Super Admin role name cannot be changed
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="is_active">Status</Label>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="is_active"
                                                checked={data.is_active}
                                                onCheckedChange={(checked) => setData('is_active', checked as boolean)}
                                                disabled={isSuperAdmin}
                                            />
                                            <Label htmlFor="is_active">Active</Label>
                                        </div>
                                        {isSuperAdmin && (
                                            <p className="text-sm text-gray-500">
                                                Super Admin role must remain active
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Describe what this role is for..."
                                        rows={3}
                                        className={errors.description ? 'border-red-500' : ''}
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-red-500">{errors.description}</p>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <Label>Permissions</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {permissions.map((permission) => (
                                            <div key={permission.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`permission-${permission.id}`}
                                                    checked={data.permissions.includes(permission.id)}
                                                    onCheckedChange={(checked) => 
                                                        handlePermissionChange(permission.id, checked as boolean)
                                                    }
                                                />
                                                <Label 
                                                    htmlFor={`permission-${permission.id}`}
                                                    className="text-sm font-normal"
                                                >
                                                    {permission.name}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                    {errors.permissions && (
                                        <p className="text-sm text-red-500">{errors.permissions}</p>
                                    )}
                                </div>

                                <div className="flex justify-end gap-4">
                                    <Link href="/roles">
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
