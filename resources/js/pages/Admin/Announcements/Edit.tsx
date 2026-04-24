import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, Paperclip, Save } from 'lucide-react';
import { useState } from 'react';

interface Announcement {
    announcement_id: number;
    title: string;
    content: string;
    attachment: string | null;
    publish_start: string | null;
    publish_end: string | null;
}

interface Props {
    announcement: Announcement;
}

type PublishMode = 'now' | 'schedule' | 'draft';

function toDatetimeLocal(dt: string | null): string {
    if (!dt) return '';
    return dt.replace(' ', 'T').slice(0, 16);
}

function deriveMode(publishStart: string | null): PublishMode {
    if (!publishStart) return 'draft';
    if (new Date(publishStart) > new Date()) return 'schedule';
    return 'now';
}

export default function Edit({ announcement }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Announcements', href: '/admin/announcements' },
        { title: 'Edit', href: `/admin/announcements/${announcement.announcement_id}/edit` },
    ];

    const [publishMode, setPublishMode] = useState<PublishMode>(
        deriveMode(announcement.publish_start),
    );

    const { data, setData, post, transform, processing, errors } = useForm<{
        _method: string;
        title: string;
        content: string;
        attachment: File | null;
        publish_start: string;
        publish_end: string;
    }>({
        _method: 'PUT',
        title: announcement.title,
        content: announcement.content,
        attachment: null,
        publish_start: toDatetimeLocal(announcement.publish_start),
        publish_end: toDatetimeLocal(announcement.publish_end),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        transform((d) => {
            if (publishMode === 'now') {
                // Only overwrite publish_start if the announcement isn't already live
                if (!announcement.publish_start || new Date(announcement.publish_start) > new Date()) {
                    const now = new Date();
                    now.setSeconds(0, 0);
                    return { ...d, publish_start: now.toISOString().slice(0, 16) };
                }
                return d;
            }
            if (publishMode === 'draft') {
                return { ...d, publish_start: '', publish_end: '' };
            }
            return d;
        });

        post(`/admin/announcements/${announcement.announcement_id}`, { forceFormData: true });
    };

    const modes: { value: PublishMode; label: string; description: string }[] = [
        { value: 'now',      label: 'Publish Now',    description: 'Goes live immediately' },
        { value: 'schedule', label: 'Schedule',        description: 'Set a future publish date' },
        { value: 'draft',    label: 'Save as Draft',   description: 'Not visible until published' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Announcement" />

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/admin/announcements" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Announcements
                    </Link>
                    <h1 className="mt-2 text-3xl font-bold text-gray-900">Edit Announcement</h1>
                </div>

                <form onSubmit={handleSubmit} className="max-w-2xl">
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <div className="grid gap-6">
                            {/* Title */}
                            <div>
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="Announcement title"
                                    className="mt-1"
                                />
                                <InputError message={errors.title} className="mt-1" />
                            </div>

                            {/* Content */}
                            <div>
                                <Label htmlFor="content">Content *</Label>
                                <Textarea
                                    id="content"
                                    value={data.content}
                                    onChange={(e) => setData('content', e.target.value)}
                                    placeholder="Write the announcement content here..."
                                    className="mt-1"
                                    rows={6}
                                />
                                <InputError message={errors.content} className="mt-1" />
                            </div>

                            {/* Publish Settings */}
                            <div>
                                <Label>Publish Settings</Label>
                                <div className="mt-2 space-y-2">
                                    {modes.map((mode) => (
                                        <label
                                            key={mode.value}
                                            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                                                publishMode === mode.value
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="publish_mode"
                                                value={mode.value}
                                                checked={publishMode === mode.value}
                                                onChange={() => setPublishMode(mode.value)}
                                                className="mt-0.5 accent-primary"
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{mode.label}</p>
                                                <p className="text-xs text-gray-500">{mode.description}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                {/* Schedule date fields — only shown when Schedule is selected */}
                                {publishMode === 'schedule' && (
                                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                                        <div>
                                            <Label htmlFor="publish_start">Publish Start *</Label>
                                            <Input
                                                id="publish_start"
                                                type="datetime-local"
                                                value={data.publish_start}
                                                onChange={(e) => setData('publish_start', e.target.value)}
                                                className="mt-1"
                                            />
                                            <InputError message={errors.publish_start} className="mt-1" />
                                        </div>
                                        <div>
                                            <Label htmlFor="publish_end">Publish End</Label>
                                            <Input
                                                id="publish_end"
                                                type="datetime-local"
                                                value={data.publish_end}
                                                onChange={(e) => setData('publish_end', e.target.value)}
                                                className="mt-1"
                                            />
                                            <InputError message={errors.publish_end} className="mt-1" />
                                            <p className="mt-1 text-xs text-gray-500">Leave blank for no expiry</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Attachment */}
                            <div>
                                <Label htmlFor="attachment">Attachment</Label>
                                {announcement.attachment && (
                                    <div className="mt-1 mb-2 flex items-center gap-2 text-sm text-gray-600">
                                        <Paperclip className="h-4 w-4" />
                                        <a
                                            href={`/storage/${announcement.attachment}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                        >
                                            {announcement.attachment.split('/').pop()}
                                        </a>
                                    </div>
                                )}
                                <Input
                                    id="attachment"
                                    type="file"
                                    onChange={(e) => setData('attachment', e.target.files?.[0] ?? null)}
                                    className="mt-1"
                                />
                                <InputError message={errors.attachment} className="mt-1" />
                                <p className="mt-1 text-xs text-gray-500">
                                    {announcement.attachment
                                        ? 'Upload a new file to replace the existing one. Max 10 MB.'
                                        : 'Max 10 MB.'}
                                </p>
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
                                        {publishMode === 'now' ? 'Save & Publish' : publishMode === 'schedule' ? 'Save & Schedule' : 'Save as Draft'}
                                    </>
                                )}
                            </Button>
                            <Link href="/admin/announcements">
                                <Button type="button" variant="outline">Cancel</Button>
                            </Link>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
