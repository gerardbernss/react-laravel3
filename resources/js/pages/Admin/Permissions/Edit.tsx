import { AppInput } from '@/components/AppInput';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LABEL_TEXT, PAGE_PADDING, PAGE_TITLE } from '@/constants/ui';
import { usePermissionEdit } from '@/hooks/usePermissionEdit';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Permission } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Key } from 'lucide-react';

interface Props {
    permission: Permission;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Permissions', href: '/admin/permissions' },
    { title: 'Edit Permission', href: '/admin/permissions/edit' },
];

/** Admin permission edit form for renaming an existing permission. */
export default function Edit({ permission }: Props) {
    const { data, setData, processing, errors, handleSubmit } = usePermissionEdit({ permission });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Permission" />

            <div className={PAGE_PADDING}>
                <div className="mb-6 flex items-center gap-4">
                    <Link href="/admin/permissions" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Permissions
                    </Link>
                    <div className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        <h1 className={PAGE_TITLE}>Edit Permission</h1>
                    </div>
                </div>

                <div className="max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Permission Information</CardTitle>
                            <CardDescription>Update the permission details. Edit the slug directly or leave it as-is.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <AppInput
                                    id="name"
                                    label="Permission Name *"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g., Manage Users"
                                    error={errors.name}
                                />

                                <AppInput
                                    id="slug"
                                    label="Slug"
                                    type="text"
                                    value={data.slug}
                                    onChange={(e) => setData('slug', e.target.value)}
                                    placeholder="e.g., manage-users"
                                    error={errors.slug}
                                    hint="Lowercase letters, numbers, and hyphens only."
                                />

                                <div className="space-y-2">
                                    <Label htmlFor="description" className={LABEL_TEXT}>Description</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Describe what this permission allows..."
                                        rows={3}
                                        className={errors.description ? 'border-red-500' : ''}
                                    />
                                    <InputError message={errors.description} />
                                </div>

                                <div className="flex justify-end gap-4">
                                    <Link href="/admin/permissions">
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
                                    </Link>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Updating...' : 'Update Permission'}
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
