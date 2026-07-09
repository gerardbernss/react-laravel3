import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HELPER_TEXT, LABEL_TEXT } from '@/constants/ui';
import { cn } from '@/lib/utils';
import { type ComponentProps, useId } from 'react';

interface AppInputProps extends ComponentProps<typeof Input> {
    label?: string;
    error?: string;
    hint?: string;
    containerClassName?: string;
}

/** Labelled text input with optional hint text and inline error display; generates an accessible id automatically when none is provided. */
export function AppInput({ label, error, hint, id, containerClassName, className, ...props }: AppInputProps) {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
        <div className={cn('flex flex-col gap-1.5', containerClassName)}>
            {label && (
                <Label htmlFor={inputId} className={LABEL_TEXT}>
                    {label}
                </Label>
            )}
            <Input
                id={inputId}
                className={cn(className)}
                aria-invalid={!!error}
                {...props}
            />
            {hint && !error && <p className={HELPER_TEXT}>{hint}</p>}
            <InputError message={error} />
        </div>
    );
}
