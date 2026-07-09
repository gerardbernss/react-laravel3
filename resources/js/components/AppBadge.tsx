import { BADGE_BASE, BADGE_BLUE, BADGE_GRAY, BADGE_GREEN, BADGE_RED, BADGE_YELLOW } from '@/constants/ui';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type BadgeColor = 'green' | 'yellow' | 'blue' | 'red' | 'gray';

const COLOR_MAP: Record<BadgeColor, string> = {
    green: BADGE_GREEN,
    yellow: BADGE_YELLOW,
    blue: BADGE_BLUE,
    red: BADGE_RED,
    gray: BADGE_GRAY,
};

const STATUS_COLOR_MAP: Record<string, BadgeColor> = {
    // Enrollment statuses
    enrolled: 'green',
    active: 'green',
    approved: 'green',
    passed: 'green',
    completed: 'green',
    // Pending / in-progress
    pending: 'yellow',
    'for evaluation': 'yellow',
    'for exam': 'yellow',
    'awaiting payment': 'yellow',
    // Informational
    'exam taken': 'blue',
    'for enrollment': 'blue',
    submitted: 'blue',
    // Negative
    rejected: 'red',
    failed: 'red',
    withdrawn: 'red',
    cancelled: 'red',
    // Neutral / default
    inactive: 'gray',
    draft: 'gray',
};

interface AppBadgeProps {
    status: string;
    color?: BadgeColor;
    className?: string;
    children?: ReactNode;
}

/** Status badge that auto-selects a colour (green/yellow/blue/red/gray) based on a known status string, falling back to gray for unknown values. */
export function AppBadge({ status, color, className, children }: AppBadgeProps) {
    const resolvedColor = color ?? STATUS_COLOR_MAP[status.toLowerCase()] ?? 'gray';
    return (
        <span className={cn(BADGE_BASE, COLOR_MAP[resolvedColor], className)}>
            {children ?? status}
        </span>
    );
}
