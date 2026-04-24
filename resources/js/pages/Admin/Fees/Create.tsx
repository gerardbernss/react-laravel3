import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, DollarSign } from 'lucide-react';

interface Props {
    categories: Record<string, string>;
    schoolLevels: Record<string, string>;
    semesters: Record<string, string>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Fee Management', href: '/admin/fees' },
    { title: 'Add Fee', href: '/admin/fees/create' },
];

export default function CreateFee({ categories, schoolLevels, semesters }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        code: '',
        category: 'miscellaneous',
        is_per_unit: false,
        is_required: true,
        school_level: 'all',
        school_year: '',
        semester: 'Yearly',
        amount: '',
        description: '',
        effective_date: '',
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/fees');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add Fee" />

            <div className="p-6 md:p-10">
                <div className="mb-6 flex items-center gap-4">
                    <Link href="/admin/fees">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3">
                        <DollarSign className="h-6 w-6 text-primary" />
                        <h1 className="text-2xl font-bold text-gray-900">Add Fee</h1>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6 rounded-lg border bg-white p-6 shadow-sm">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <Label htmlFor="name">Fee Name <span className="text-red-500">*</span></Label>
                            <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-1" placeholder="e.g. Tuition Fee" />
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                        </div>
                        <div>
                            <Label htmlFor="code">Code <span className="text-red-500">*</span></Label>
                            <Input id="code" value={data.code} onChange={(e) => setData('code', e.target.value.toUpperCase())} className="mt-1 font-mono" placeholder="e.g. TF-SHS" maxLength={20} />
                            {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <Label>Category <span className="text-red-500">*</span></Label>
                            <Select value={data.category} onValueChange={(v) => setData('category', v)}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Object.entries(categories).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
                        </div>
                        <div>
                            <Label>School Level <span className="text-red-500">*</span></Label>
                            <Select value={data.school_level} onValueChange={(v) => setData('school_level', v)}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Object.entries(schoolLevels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {errors.school_level && <p className="mt-1 text-sm text-red-600">{errors.school_level}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <Label htmlFor="school_year">School Year <span className="text-red-500">*</span></Label>
                            <Input id="school_year" value={data.school_year} onChange={(e) => setData('school_year', e.target.value)} className="mt-1" placeholder="e.g. 2024-2025" />
                            {errors.school_year && <p className="mt-1 text-sm text-red-600">{errors.school_year}</p>}
                        </div>
                        <div>
                            <Label>Semester <span className="text-red-500">*</span></Label>
                            <Select value={data.semester} onValueChange={(v) => setData('semester', v)}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Object.entries(semesters).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {errors.semester && <p className="mt-1 text-sm text-red-600">{errors.semester}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <Label htmlFor="amount">Amount (₱) <span className="text-red-500">*</span></Label>
                            <Input id="amount" type="number" min="0" step="0.01" value={data.amount} onChange={(e) => setData('amount', e.target.value)} className="mt-1" placeholder="0.00" />
                            {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
                        </div>
                        <div>
                            <Label htmlFor="effective_date">Effective Date</Label>
                            <Input id="effective_date" type="date" value={data.effective_date} onChange={(e) => setData('effective_date', e.target.value)} className="mt-1" />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="description">Description</Label>
                        <textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={2}
                            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            placeholder="Optional description..."
                        />
                    </div>

                    <div className="flex flex-wrap gap-6">
                        <div className="flex items-center gap-3">
                            <Switch id="is_per_unit" checked={data.is_per_unit} onCheckedChange={(v) => setData('is_per_unit', v)} />
                            <Label htmlFor="is_per_unit">Per Unit (multiply by student's unit load)</Label>
                        </div>
                        <div className="flex items-center gap-3">
                            <Switch id="is_required" checked={data.is_required} onCheckedChange={(v) => setData('is_required', v)} />
                            <Label htmlFor="is_required">Required</Label>
                        </div>
                        <div className="flex items-center gap-3">
                            <Switch id="is_active" checked={data.is_active} onCheckedChange={(v) => setData('is_active', v)} />
                            <Label htmlFor="is_active">Active</Label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t pt-4">
                        <Link href="/admin/fees"><Button variant="outline" type="button">Cancel</Button></Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Fee'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
