import { CARD, SECTION_HEADING } from '@/constants/ui';
import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

interface AppCardProps {
    children: ReactNode;
    className?: string;
    padding?: boolean;
}

export function AppCard({ children, className, padding = true }: AppCardProps) {
    return (
        <div className={cn(CARD, padding && 'p-6', className)}>
            {children}
        </div>
    );
}

AppCard.Header = function AppCardHeader({ title, action, className }: { title: string; action?: ReactNode; className?: string }) {
    return (
        <div className={cn('mb-4 flex items-center justify-between', className)}>
            <h3 className={SECTION_HEADING}>{title}</h3>
            {action}
        </div>
    );
};
