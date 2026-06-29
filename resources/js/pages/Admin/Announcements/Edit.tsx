import { AppCard } from '@/components/AppCard';
import { AppInput } from '@/components/AppInput';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { HELPER_TEXT, LABEL_TEXT, PAGE_PADDING, PAGE_TITLE } from '@/constants/ui';
import { PUBLISH_MODES, useAnnouncementForm } from '@/hooks/useAnnouncementForm';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Loader2, Paperclip, Save } from 'lucide-react';

interface Announcement {
    announcement_id: number;
    title: string;
    content: string;
    target_audience: string;
    attachment: string | null;
    publish_start: string | null;
    publish_end: string | null;
}

interface Props {
    announcement: Announcement;
}

export default function Edit({ announcement }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Announcements', href: '/admin/announcements' },
        { title: 'Edit', href: `/admin/announcements/${announcement.announcement_id}/edit` },
    ];

    const { data, setData, processing, errors, publishMode, setPublishMode, handleSubmit, submitLabel, processingLabel } =
        useAnnouncementForm(announcement);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Announcement" />

            <div className={PAGE_PADDING}>
                <div className="mb-6">
                    <Link href="/admin/announcements" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Announcements
                    </Link>
                    <h1 className={`mt-2 ${PAGE_TITLE}`}>Edit Announcement</h1>
                </div>

                <form onSubmit={handleSubmit} className="max-w-2xl">
                    <AppCard>
                        <div className="grid gap-6">
                            <AppInput
                                id="title"
                                label="Title *"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                placeholder="Announcement title"
                                error={errors.title}
                            />

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="content" className={LABEL_TEXT}>Content *</Label>
                                <Textarea
                                    id="content"
                                    value={data.content}
                                    onChange={(e) => setData('content', e.target.value)}
                                    placeholder="Write the announcement content here..."
                                    rows={6}
                                />
                                <InputError message={errors.content} />
                            </div>

                            <div>
                                <Label className={LABEL_TEXT}>Visible To</Label>
                                <div className="mt-2 grid grid-cols-3 gap-2">
                                    {(['all', 'students', 'applicants'] as const).map((v) => (
                                        <label
                                            key={v}
                                            className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors ${
                                                data.target_audience === v
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="target_audience"
                                                value={v}
                                                checked={data.target_audience === v}
                                                onChange={() => setData('target_audience', v)}
                                                className="accent-primary"
                                            />
                                            <span className="text-sm font-medium capitalize text-gray-900">
                                                {v === 'all' ? 'Everyone' : v}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                <InputError message={errors.target_audience} className="mt-1" />
                            </div>

                            <div>
                                <Label className={LABEL_TEXT}>Publish Settings</Label>
                                <div className="mt-2 space-y-2">
                                    {PUBLISH_MODES.map((mode) => (
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
                                                <p className={HELPER_TEXT}>{mode.description}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                {publishMode !== 'draft' && (
                                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                                        {publishMode === 'schedule' && (
                                            <AppInput
                                                id="publish_start"
                                                label="Publish Start *"
                                                type="datetime-local"
                                                value={data.publish_start}
                                                onChange={(e) => setData('publish_start', e.target.value)}
                                                error={errors.publish_start}
                                            />
                                        )}
                                        <div className={publishMode === 'now' ? 'md:col-span-2' : ''}>
                                            <AppInput
                                                id="publish_end"
                                                label="Publish End"
                                                type="datetime-local"
                                                value={data.publish_end}
                                                onChange={(e) => setData('publish_end', e.target.value)}
                                                hint="Leave blank for no expiry"
                                                error={errors.publish_end}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="attachment" className={LABEL_TEXT}>Attachment</Label>
                                {announcement.attachment && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
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
                                />
                                <p className={HELPER_TEXT}>
                                    {announcement.attachment
                                        ? 'Upload a new file to replace the existing one. Max 10 MB.'
                                        : 'Max 10 MB.'}
                                </p>
                                <InputError message={errors.attachment} />
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <Button type="submit" disabled={processing}>
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {processingLabel}
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        {submitLabel}
                                    </>
                                )}
                            </Button>
                            <Link href="/admin/announcements">
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </Link>
                        </div>
                    </AppCard>
                </form>
            </div>
        </AppLayout>
    );
}
