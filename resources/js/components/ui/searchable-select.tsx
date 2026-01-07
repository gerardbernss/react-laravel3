import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { FormControl } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';

export interface Option {
    value: string;
    label: string;
    [key: string]: any;
}

interface SearchableSelectProps {
    value?: string;
    onChange: (value: string, option?: Option) => void;
    options: Option[];
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    disabled?: boolean;
    creatable?: boolean;
}

export function SearchableSelect({
    value,
    onChange,
    options,
    placeholder = 'Select option',
    searchPlaceholder = 'Search...',
    emptyMessage = 'No option found.',
    disabled,
    creatable = false,
}: SearchableSelectProps) {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const selectedOption = options.find((o) => o.value === value) || (creatable && value ? { value, label: value } : null);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <FormControl>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        disabled={disabled}
                        className={cn('w-full justify-between', !value && 'text-muted-foreground')}
                    >
                        {selectedOption ? selectedOption.label : placeholder}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} onValueChange={setSearchTerm} />
                    <CommandList>
                        <CommandEmpty>{emptyMessage}</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => {
                                        onChange(option.value, option);
                                        setOpen(false);
                                    }}
                                >
                                    <Check className={cn('mr-2 h-4 w-4', value === option.value ? 'opacity-100' : 'opacity-0')} />
                                    {option.label}
                                </CommandItem>
                            ))}
                            {creatable && searchTerm && !options.some((o) => o.label.toLowerCase() === searchTerm.toLowerCase()) && (
                                <CommandItem
                                    value={searchTerm}
                                    onSelect={() => {
                                        onChange(searchTerm);
                                        setOpen(false);
                                    }}
                                >
                                    <Check className={cn('mr-2 h-4 w-4', value === searchTerm ? 'opacity-100' : 'opacity-0')} />
                                    Use "{searchTerm}"
                                </CommandItem>
                            )}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
