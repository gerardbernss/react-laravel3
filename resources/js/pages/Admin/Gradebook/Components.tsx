import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BODY_TEXT, CARD, FILTER_CARD, PAGE_PADDING, PAGE_TITLE } from '@/constants/ui';
import { type BlockSectionData, type GradeComponent, type SubjectData, useGradebookComponents } from '@/hooks/useGradebookComponents';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, CheckCircle, Trash2 } from 'lucide-react';

interface Props {
    blockSection: BlockSectionData;
    subject: SubjectData;
    quarter: string;
    components: GradeComponent[];
    weightTotal: number;
}

export default function GradebookComponents({ blockSection, subject, quarter, components, weightTotal }: Props) {
    const { breadcrumbs, data, setData, processing, errors, weightOk, remainingWeight, submit, deleteComponent } = useGradebookComponents({
        blockSection,
        subject,
        quarter,
        weightTotal,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Components — ${subject.code} ${quarter}`} />

            <div className={PAGE_PADDING}>
                <div className="mb-6">
                    <Link href={`/teacher/gradebook/${blockSection.id}`} className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Section
                    </Link>
                    <div className="flex items-center gap-3">
                        <h1 className={PAGE_TITLE}>
                            {subject.code} — {quarter} Components
                        </h1>
                        <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-700">{quarter}</span>
                    </div>
                    <p className={`mt-1 ${BODY_TEXT}`}>
                        {subject.name} · {blockSection.code} · {blockSection.school_year}
                    </p>
                </div>

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

                <div className="flex items-start gap-6">
                    <div className="min-w-0 flex-1">
                        {components.length > 0 ? (
                            <div className={`overflow-hidden ${CARD}`}>
                                <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead className="sticky top-0 z-10 bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">#</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Component</th>
                                                <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500">HPS</th>
                                                <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Weight %</th>
                                                <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500"></th>
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
                                <Link href={`/teacher/gradebook/${blockSection.id}/${subject.id}/${quarter}/entry`}>
                                    <Button>Go to Score Entry →</Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="sticky top-20 w-150 shrink-0">
                        <div className={FILTER_CARD}>
                            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Add Component</h2>
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
