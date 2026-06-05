import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, CheckCircle, Trash2 } from 'lucide-react';

interface GradeComponent {
    id: number;
    name: string;
    hps: number;
    weight: number;
    order: number;
}

interface BlockSectionData {
    id: number;
    code: string;
    name: string;
    school_year: string | null;
}

interface SubjectData {
    id: number;
    code: string;
    name: string;
}

interface Props {
    blockSection: BlockSectionData;
    subject: SubjectData;
    quarter: string;
    components: GradeComponent[];
    weightTotal: number;
}

export default function GradebookComponents({ blockSection, subject, quarter, components, weightTotal }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Gradebook', href: '/gradebook' },
        { title: blockSection.code, href: `/gradebook/${blockSection.id}` },
        { title: `${subject.code} ${quarter}`, href: `/gradebook/${blockSection.id}/${subject.id}/${quarter}/components` },
    ];

    const { data, setData, post, processing, errors, reset } = useForm({
        block_section_id: blockSection.id,
        subject_id: subject.id,
        grading_quarter: quarter,
        name: '',
        hps: '',
        weight: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/gradebook/components', {
            onSuccess: () => reset('name', 'hps', 'weight'),
        });
    }

    function deleteComponent(id: number) {
        if (!confirm('Delete this component? All scores for it will be lost.')) return;
        router.delete(`/gradebook/components/${id}`);
    }

    const weightOk = Math.abs(weightTotal - 100) < 0.01;
    const remainingWeight = Math.max(0, 100 - weightTotal);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Components — ${subject.code} ${quarter}`} />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6">
                    <Link href={`/gradebook/${blockSection.id}`} className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Section
                    </Link>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {subject.code} — {quarter} Components
                        </h1>
                        <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-700">{quarter}</span>
                    </div>
                    <p className="mt-1 text-gray-600">
                        {subject.name} · {blockSection.code} · {blockSection.school_year}
                    </p>
                </div>

                {/* Weight summary */}
                <div
                    className={`mb-6 flex items-center gap-2 rounded-lg border p-3 text-sm ${weightOk ? 'border-green-300 bg-green-50 text-green-800' : 'border-amber-300 bg-amber-50 text-amber-800'}`}
                >
                    {weightOk ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-amber-600" />}
                    <span>
                        Total weight: <strong>{weightTotal.toFixed(2)}%</strong>
                        {!weightOk && ` — needs ${remainingWeight.toFixed(2)}% more to reach 100%`}
                        {weightOk && ' — ready for grade computation'}
                    </span>
                </div>

                {/* Two-column layout: table left, form right */}
                <div className="flex items-start gap-6">
                    {/* Components table — takes remaining space */}
                    <div className="min-w-0 flex-1">
                        {components.length > 0 ? (
                            <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                                <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 z-10 bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">#</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                Component
                                            </th>
                                            <th className="px-4 py-2 text-center text-xs font-medium tracking-wider text-gray-500 uppercase">HPS</th>
                                            <th className="px-4 py-2 text-center text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                Weight %
                                            </th>
                                            <th className="px-4 py-2 text-center text-xs font-medium tracking-wider text-gray-500 uppercase"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {components.map((c, idx) => (
                                            <tr key={c.id} className="transition-colors hover:bg-gray-50">
                                                <td className="px-4 py-3 text-xs text-gray-400">{idx + 1}</td>
                                                <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                                                <td className="px-4 py-3 text-center text-gray-700">{c.hps}</td>
                                                <td className="px-4 py-3 text-center text-gray-700">{c.weight}%</td>
                                                <td className="px-4 py-3 text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                                        onClick={() => deleteComponent(c.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-lg border border-dashed bg-white p-10 text-center text-gray-400 shadow-sm">
                                <p className="text-sm">No components yet. Add one using the form.</p>
                            </div>
                        )}

                        {components.length > 0 && weightOk && (
                            <div className="mt-4 flex justify-end">
                                <Link href={`/gradebook/${blockSection.id}/${subject.id}/${quarter}/entry`}>
                                    <Button>Go to Score Entry →</Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Add component form — fixed width, smaller than table */}
                    <div className="sticky top-20 w-150 shrink-0">
                        <div className="rounded-lg border bg-white p-4 shadow-sm">
                            <h2 className="mb-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">Add Component</h2>
                            <form onSubmit={submit} className="flex flex-col gap-3">
                                <div>
                                    <Label htmlFor="name" className="text-xs">
                                        Name
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g. Quiz 1"
                                        className="mt-1 h-8 text-sm"
                                    />
                                    {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="hps" className="text-xs">
                                        HPS (Highest Possible Score)
                                    </Label>
                                    <Input
                                        id="hps"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={data.hps}
                                        onChange={(e) => setData('hps', e.target.value)}
                                        placeholder="e.g. 50"
                                        className="mt-1 h-8 text-sm"
                                    />
                                    {errors.hps && <p className="mt-1 text-xs text-red-600">{errors.hps}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="weight" className="text-xs">
                                        Weight %
                                    </Label>
                                    <Input
                                        id="weight"
                                        type="number"
                                        min="0.01"
                                        max="100"
                                        step="0.01"
                                        value={data.weight}
                                        onChange={(e) => setData('weight', e.target.value)}
                                        placeholder={`e.g. ${remainingWeight.toFixed(0)}`}
                                        className="mt-1 h-8 text-sm"
                                    />
                                    {errors.weight && <p className="mt-1 text-xs text-red-600">{errors.weight}</p>}
                                </div>
                                <Button type="submit" disabled={processing} size="sm" className="mt-1 w-full">
                                    {processing ? 'Adding…' : 'Add Component'}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
