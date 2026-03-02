import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

interface Program {
    id: number;
    code: string;
    description: string;
    school: string;
    vocational: boolean;
    is_active: boolean;
    max_load: number;
}

interface Props {
    program: Program;
    schools: Record<string, string>;
}

export default function Edit({ program, schools }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Programs', href: '/programs' },
        { title: program.code, href: `/programs/${program.id}/edit` },
        { title: 'Edit', href: `/programs/${program.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm({
        code: program.code,
        description: program.description,
        school: program.school,
        vocational: program.vocational,
        is_active: program.is_active,
        max_load: program.max_load,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/programs/${program.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${program.code}`} />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/programs" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Programs
                    </Link>
                    <h1 className="mt-2 text-3xl font-bold text-gray-900">Edit Program</h1>
                    <p className="mt-1 text-gray-600">
                        Editing: <span className="font-medium">{program.code} - {program.description}</span>
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="max-w-2xl">
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <div className="grid gap-6">
                            {/* Code and Description */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="code">Program Code *</Label>
                                    <Input
                                        id="code"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                        placeholder="e.g., ABM, STEM"
                                        className="mt-1"
                                    />
                                    <InputError message={errors.code} className="mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="description">Description *</Label>
                                    <Input
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="e.g., Accountancy, Business, and Management"
                                        className="mt-1"
                                    />
                                    <InputError message={errors.description} className="mt-1" />
                                </div>
                            </div>

                            {/* School and Max Load */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="school">School *</Label>
                                    <Select value={data.school} onValueChange={(v) => setData('school', v)}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select school" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(schools).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.school} className="mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="max_load">Max Load (units) *</Label>
                                    <Input
                                        id="max_load"
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={data.max_load}
                                        onChange={(e) => setData('max_load', parseInt(e.target.value) || 0)}
                                        className="mt-1"
                                    />
                                    <InputError message={errors.max_load} className="mt-1" />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Maximum number of units a student can enroll in per enrollment period
                                    </p>
                                </div>
                            </div>

                            {/* Vocational */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="vocational"
                                    checked={data.vocational}
                                    onChange={(e) => setData('vocational', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="vocational" className="cursor-pointer">
                                    Vocational Program
                                </Label>
                            </div>

                            {/* Active Status */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="is_active" className="cursor-pointer">
                                    Active (Program is available for enrollment)
                                </Label>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-6 flex gap-3">
                            <Button type="submit" disabled={processing}>
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                            <Link href="/programs">
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </Link>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
