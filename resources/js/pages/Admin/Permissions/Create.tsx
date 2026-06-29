import { AppInput } from '@/components/AppInput';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LABEL_TEXT, PAGE_PADDING, PAGE_TITLE } from '@/constants/ui';
import { usePermissionCreate } from '@/hooks/usePermissionCreate';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Key } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Permissions', href: '/permissions' },
    { title: 'Create Permission', href: '/permissions/create' },
];

export default function Create() {
    const { data, setData, processing, errors, handleSubmit } = usePermissionCreate();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Permission" />

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
                        <h1 className={PAGE_TITLE}>Create New Permission</h1>
                    </div>
                </div>

                <div className="max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Permission Information</CardTitle>
                            <CardDescription>Create a new permission that can be assigned to roles.</CardDescription>
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
                                    hint="The slug will be automatically generated from the name."
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
                                    <Link href="/permissions">
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
                                    </Link>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Creating...' : 'Create Permission'}
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
