import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { FormControl } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCitizenships } from '@/hooks/use-citizenships';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';

interface CitizenshipSelectProps {
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function CitizenshipSelect({ value, onChange, placeholder = 'Select citizenship', disabled }: CitizenshipSelectProps) {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { citizenships } = useCitizenships();

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
                        {value ? citizenships.find((c) => c.value === value)?.label || value : placeholder}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search citizenship..." onValueChange={setSearchTerm} />
                    <CommandList>
                        <CommandEmpty>No citizenship found.</CommandEmpty>
                        <CommandGroup>
                            {citizenships.map((citizenship) => (
                                <CommandItem
                                    key={citizenship.label}
                                    value={citizenship.label}
                                    onSelect={() => {
                                        onChange(citizenship.value);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn('mr-2 h-4 w-4', value === citizenship.value ? 'opacity-100' : 'opacity-0')}
                                    />
                                    {citizenship.label}
                                </CommandItem>
                            ))}
                            {searchTerm && !citizenships.some((c) => c.label.toLowerCase() === searchTerm.toLowerCase()) && (
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
