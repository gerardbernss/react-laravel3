import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BODY_TEXT, CARD, HELPER_TEXT, LABEL_TEXT, PAGE_PADDING, PAGE_TITLE } from '@/constants/ui';
import { useExaminationRoomCreate } from '@/hooks/useExaminationRoomCreate';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Examination Rooms', href: '/admin/examination-rooms' },
    { title: 'Create', href: '/admin/examination-rooms/create' },
];

export default function Create() {
    const { data, setData, processing, errors, handleSubmit } = useExaminationRoomCreate();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Examination Room" />

            <div className={PAGE_PADDING}>
                <div className="mb-6">
                    <Link href="/admin/examination-rooms" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Rooms
                    </Link>
                    <h1 className={`mt-2 ${PAGE_TITLE}`}>Create Examination Room</h1>
                    <p className={`mt-1 ${BODY_TEXT}`}>Add a new examination room to the system</p>
                </div>

                <form onSubmit={handleSubmit} className="max-w-2xl">
                    <div className={`${CARD} p-6`}>
                        <div className="grid gap-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="name" className={LABEL_TEXT}>Room Name *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g., Room 101"
                                        className="mt-1"
                                    />
                                    <InputError message={errors.name} className="mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="building" className={LABEL_TEXT}>Building</Label>
                                    <Input
                                        id="building"
                                        value={data.building}
                                        onChange={(e) => setData('building', e.target.value)}
                                        placeholder="e.g., Main Building"
                                        className="mt-1"
                                    />
                                    <InputError message={errors.building} className="mt-1" />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="capacity" className={LABEL_TEXT}>Capacity *</Label>
                                    <Input
                                        id="capacity"
                                        type="number"
                                        min={1}
                                        max={500}
                                        value={data.capacity}
                                        onChange={(e) => setData('capacity', parseInt(e.target.value) || 1)}
                                        className="mt-1"
                                    />
                                    <InputError message={errors.capacity} className="mt-1" />
                                    <p className={`mt-1 ${HELPER_TEXT}`}>Maximum number of examinees</p>
                                </div>
                                <div>
                                    <Label htmlFor="floor" className={LABEL_TEXT}>Floor</Label>
                                    <Input
                                        id="floor"
                                        value={data.floor}
                                        onChange={(e) => setData('floor', e.target.value)}
                                        placeholder="e.g., 1st Floor"
                                        className="mt-1"
                                    />
                                    <InputError message={errors.floor} className="mt-1" />
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
                                    Active (Room is available for scheduling)
                                </Label>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <Button type="submit" disabled={processing}>
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Create Room
                                    </>
                                )}
                            </Button>
                            <Link href="/admin/examination-rooms">
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
