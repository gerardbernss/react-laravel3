import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

interface Room {
    id: number;
    name: string;
    building: string | null;
    capacity: number;
    floor: string | null;
    is_active: boolean;
}

interface Props {
    room: Room;
}

export default function Edit({ room }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Examination Rooms', href: '/examination-rooms' },
        { title: room.name, href: `/examination-rooms/${room.id}` },
        { title: 'Edit', href: `/examination-rooms/${room.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: room.name,
        building: room.building || '',
        capacity: room.capacity,
        floor: room.floor || '',
        is_active: room.is_active,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/examination-rooms/${room.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${room.name}`} />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/examination-rooms" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Rooms
                    </Link>
                    <h1 className="mt-2 text-3xl font-bold text-gray-900">Edit Examination Room</h1>
                    <p className="mt-1 text-gray-600">
                        Editing: <span className="font-medium">{room.name}</span>
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="max-w-2xl">
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <div className="grid gap-6">
                            {/* Name and Building */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="name">Room Name *</Label>
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
                                    <Label htmlFor="building">Building</Label>
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

                            {/* Capacity and Floor */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="capacity">Capacity *</Label>
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
                                    <p className="mt-1 text-xs text-gray-500">Maximum number of examinees</p>
                                </div>
                                <div>
                                    <Label htmlFor="floor">Floor</Label>
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
                                    Active (Room is available for scheduling)
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
                            <Link href="/examination-rooms">
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
