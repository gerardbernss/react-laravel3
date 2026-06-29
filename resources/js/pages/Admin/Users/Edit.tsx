import { AppInput } from '@/components/AppInput';
import InputError from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LABEL_TEXT, PAGE_PADDING, PAGE_TITLE } from '@/constants/ui';
import { type EditUser, type UserRole, useUserEdit } from '@/hooks/useUserEdit';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CircleAlert, User } from 'lucide-react';

interface Props {
    user: EditUser;
    roles: UserRole[];
}

export default function Edit({ user, roles }: Props) {
    const { breadcrumbs, hideAlert, setHideAlert, data, setData, processing, errors, handleUpdate, handleRoleChange } = useUserEdit({ user });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit User - ${user.name}`} />

            <div className={PAGE_PADDING}>
                <div className="mb-6 flex items-center gap-4">
                    <Link href="/users">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Users
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        <h1 className={PAGE_TITLE}>Edit User: {user.name}</h1>
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
                                {Object.keys(errors).length > 0 && !hideAlert && (
                                    <Alert variant={'error'} onClose={() => setHideAlert(false)}>
                                        <CircleAlert className="h-4 w-4" />
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>
                                            <ul>
                                                {Object.entries(errors).map(([key, message]) => (
                                                    <li key={key}>{message as string}</li>
                                                ))}
                                            </ul>
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <AppInput
                                    id="name"
                                    label="Name"
                                    type="text"
                                    value={data.name}
                                    placeholder="John Doe"
                                    name="name"
                                    onChange={(e) => setData('name', e.target.value)}
                                    error={errors.name}
                                />

                                <AppInput
                                    id="email"
                                    label="Email"
                                    type="email"
                                    value={data.email}
                                    placeholder="john.doe@example.com"
                                    name="email"
                                    disabled
                                    onChange={(e) => setData('email', e.target.value)}
                                    error={errors.email}
                                />

                                <AppInput
                                    id="password"
                                    label="New Password (optional)"
                                    type="password"
                                    value={data.password}
                                    placeholder="Leave blank to keep current password"
                                    name="password"
                                    onChange={(e) => setData('password', e.target.value)}
                                    error={errors.password}
                                />

                                <div className="space-y-1.5">
                                    <Label htmlFor="role_id" className={LABEL_TEXT}>Primary Role</Label>
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
                                    <InputError message={errors.role_id} />
                                </div>

                                <div className="space-y-3">
                                    <Label className={LABEL_TEXT}>Additional Roles</Label>
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        {roles.map((role) => (
                                            <div key={role.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`role-${role.id}`}
                                                    checked={data.roles.includes(role.id)}
                                                    onCheckedChange={(checked) => handleRoleChange(role.id, checked as boolean)}
                                                />
                                                <Label htmlFor={`role-${role.id}`} className="text-sm font-normal">
                                                    {role.name}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                    <InputError message={errors.roles} />
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
