import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LABEL_TEXT } from '@/constants/ui';
import { cn } from '@/lib/utils';
import { useId, type ReactNode } from 'react';

interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

interface AppSelectProps {
    label?: string;
    placeholder?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    options?: SelectOption[];
    children?: ReactNode;
    error?: string;
    disabled?: boolean;
    className?: string;
    containerClassName?: string;
}

export function AppSelect({
    label,
    placeholder = 'Select...',
    value,
    onValueChange,
    options,
    children,
    error,
    disabled,
    className,
    containerClassName,
}: AppSelectProps) {
    const id = useId();

    return (
        <div className={cn('flex flex-col gap-1.5', containerClassName)}>
            {label && (
                <Label htmlFor={id} className={LABEL_TEXT}>
                    {label}
                </Label>
            )}
            <Select value={value} onValueChange={onValueChange} disabled={disabled}>
                <SelectTrigger id={id} className={cn(className)} aria-invalid={!!error}>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {options
                        ? options.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
                                  {opt.label}
                              </SelectItem>
                          ))
                        : children}
                </SelectContent>
            </Select>
            <InputError message={error} />
        </div>
    );
}
