import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BODY_TEXT, CARD, HELPER_TEXT, LABEL_TEXT, PAGE_PADDING, PAGE_TITLE } from '@/constants/ui';
import { type Program, useProgramEdit } from '@/hooks/useProgramEdit';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

interface Props {
    program: Program;
    schools: Record<string, string>;
}

/** Admin program edit form for updating a program's name, code, and school assignment. */
export default function Edit({ program, schools }: Props) {
    const { breadcrumbs, data, setData, processing, errors, handleSubmit } = useProgramEdit({ program });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${program.code}`} />

            <div className={PAGE_PADDING}>
                <div className="mb-6">
                    <Link href="/admin/programs" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Programs
                    </Link>
                    <h1 className={`mt-2 ${PAGE_TITLE}`}>Edit Program</h1>
                    <p className={`mt-1 ${BODY_TEXT}`}>
                        Editing: <span className="font-medium">{program.code} - {program.description}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="max-w-2xl">
                    <div className={`${CARD} p-6`}>
                        <div className="grid gap-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="code" className={LABEL_TEXT}>Program Code *</Label>
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
                                    <Label htmlFor="description" className={LABEL_TEXT}>Description *</Label>
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

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="school" className={LABEL_TEXT}>School *</Label>
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
                                    <Label htmlFor="max_load" className={LABEL_TEXT}>Max Load (units) *</Label>
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
                                    <p className={`mt-1 ${HELPER_TEXT}`}>Maximum number of units a student can enroll in per enrollment period</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="is_active" className={`cursor-pointer ${LABEL_TEXT}`}>
                                    Active (Program is available for enrollment)
                                </Label>
                            </div>
                        </div>

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
                            <Link href="/admin/programs">
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
