import { cn } from '@/lib/utils';
import { type HTMLAttributes } from 'react';

/** Display a validation error message in red; renders nothing when message is absent. */
export default function InputError({ message, className = '', ...props }: HTMLAttributes<HTMLParagraphElement> & { message?: string }) {
    return message ? (
        <p {...props} className={cn('text-sm text-red-600 dark:text-red-400', className)}>
            {message}
        </p>
    ) : null;
}
