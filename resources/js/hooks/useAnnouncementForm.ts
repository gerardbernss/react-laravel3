import { useForm } from '@inertiajs/react';
import { type FormEvent, useState } from 'react';

export type PublishMode = 'now' | 'schedule' | 'draft';

export interface AnnouncementData {
    announcement_id: number;
    title: string;
    content: string;
    target_audience: string;
    attachment: string | null;
    publish_start: string | null;
    publish_end: string | null;
}

export const PUBLISH_MODES: { value: PublishMode; label: string; description: string }[] = [
    { value: 'now', label: 'Publish Now', description: 'Goes live immediately' },
    { value: 'schedule', label: 'Schedule', description: 'Set a future publish date' },
    { value: 'draft', label: 'Save as Draft', description: 'Not visible until published' },
];

function toDatetimeLocal(dt: string | null): string {
    if (!dt) return '';
    return dt.replace(' ', 'T').slice(0, 16);
}

function deriveMode(publishStart: string | null): PublishMode {
    if (!publishStart) return 'draft';
    if (new Date(publishStart) > new Date()) return 'schedule';
    return 'now';
}

/**
 * Manage the create/edit announcement form, translating the publish mode (now/schedule/draft)
 * into the correct timestamps before posting to /admin/announcements.
 */
export function useAnnouncementForm(announcement?: AnnouncementData) {
    const isEdit = !!announcement;

    const [publishMode, setPublishMode] = useState<PublishMode>(
        announcement ? deriveMode(announcement.publish_start) : 'now',
    );

    const { data, setData, post, transform, processing, errors } = useForm({
        _method: isEdit ? 'PUT' : '',
        title: announcement?.title ?? '',
        content: announcement?.content ?? '',
        target_audience: announcement?.target_audience ?? 'all',
        attachment: null as File | null,
        publish_start: toDatetimeLocal(announcement?.publish_start ?? null),
        publish_end: toDatetimeLocal(announcement?.publish_end ?? null),
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        transform((d) => {
            if (publishMode === 'now') {
                const alreadyLive =
                    announcement?.publish_start && new Date(announcement.publish_start) <= new Date();
                if (!alreadyLive) {
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

        const url = isEdit
            ? `/admin/announcements/${announcement!.announcement_id}`
            : '/admin/announcements';

        post(url, { forceFormData: true });
    };

    const submitLabel =
        isEdit
            ? publishMode === 'now'
                ? 'Save & Publish'
                : publishMode === 'schedule'
                  ? 'Save & Schedule'
                  : 'Save as Draft'
            : publishMode === 'now'
              ? 'Publish Now'
              : publishMode === 'schedule'
                ? 'Schedule'
                : 'Save as Draft';

    const processingLabel = isEdit ? 'Saving...' : 'Creating...';

    return {
        data,
        setData,
        processing,
        errors,
        publishMode,
        setPublishMode,
        handleSubmit,
        submitLabel,
        processingLabel,
    };
}
