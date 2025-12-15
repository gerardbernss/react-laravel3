import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import users from '@/routes/users';
import { useForm } from '@inertiajs/react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CircleAlert, User } from 'lucide-react';
import { useState } from 'react';

// const breadcrumbs: BreadcrumbItem[] = [
//     {
//         title: 'Edit User',
//         href: '',
//         // href: users.edit.url(),
//     },
// ];

interface Role {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    role_id?: number | null;
    roles?: Role[];
}

interface Props {
    user: User;
    roles: Role[];
}

export default function Edit({ user, roles }: Props) {
    const [hideAlert, setHideAlert] = useState<boolean>(false);
    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        password: '',
        role_id: (user.role_id ?? null) as number | null,
        roles: (user.roles?.map((r) => r.id) ?? []) as number[],
    });

    const handleUpdate = (e: React.FormEvent) => {
        setHideAlert(false);
        e.preventDefault();
        put(users.update.url(user.id));
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Users', href: '/users' },{ title: 'Edit User', href: `/users/${user.id}/edit` }]}>
            <Head title={`Edit User - ${user.name}`} />

            <div className="m-4">
                <div className="mb-6 flex items-center gap-4">
                    <Link href="/users">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Users
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        <h1 className="text-2xl font-bold">Edit User: {user.name}</h1>
                    </div>
                </div>

                <div className="max-w-4xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Role Information</CardTitle>
                            <CardDescription>Update the user details and roles.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpdate} className="space-y-6">
                                {Object?.keys(errors)?.length > 0 && !hideAlert && (
                                    <Alert variant={'error'} onClose={() => setHideAlert(false)}>
                                        <CircleAlert className="h-4 w-4" />
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>
                                            <ul>
                                                {Object?.entries(errors)?.map(([key, message]) => (
                                                    <li key={key}>{message as string}</li>
                                                ))}
                                            </ul>
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-1.5">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        type="text"
                                        value={data.name}
                                        placeholder="John Doe"
                                        id="name"
                                        name="name"
                                        onChange={(e) => setData('name', e.target.value)}
                                    />
                                    {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        disabled
                                        type="email"
                                        value={data.email}
                                        placeholder="john.doe@example.com"
                                        id="email"
                                        name="email"
                                        onChange={(e) => setData('email', e.target.value)}
                                    />
                                    {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="password">New Password (optional)</Label>
                                    <Input
                                        type="password"
                                        value={data.password}
                                        placeholder="Leave blank to keep current password"
                                        id="password"
                                        name="password"
                                        onChange={(e) => setData('password', e.target.value)}
                                    />
                                    {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="role_id">Primary Role</Label>
                                    <Select
                                        value={data.role_id?.toString() || ''}
                                        onValueChange={(value) => setData('role_id', value ? parseInt(value) : null)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a primary role (optional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map((role) => (
                                                <SelectItem key={role.id} value={role.id.toString()}>
                                                    {role.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.role_id && <p className="text-sm text-red-600">{errors.role_id}</p>}
                                </div>

                                <div className="space-y-3">
                                    <Label>Additional Roles</Label>
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        {roles.map((role) => (
                                            <div key={role.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`role-${role.id}`}
                                                    checked={data.roles.includes(role.id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setData('roles', [...data.roles, role.id]);
                                                        } else {
                                                            setData(
                                                                'roles',
                                                                data.roles.filter((id) => id !== role.id),
                                                            );
                                                        }
                                                    }}
                                                />
                                                <Label htmlFor={`role-${role.id}`} className="text-sm font-normal">
                                                    {role.name}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                    {errors.roles && <p className="text-sm text-red-600">{errors.roles}</p>}
                                </div>

                                <Button disabled={processing} type="submit">
                                    Update
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
