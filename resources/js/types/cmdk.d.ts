declare module 'cmdk' {
    import * as React from 'react';
    import { DialogProps } from '@radix-ui/react-dialog';

    export interface CommandProps extends React.HTMLAttributes<HTMLDivElement> {
        label?: string;
        shouldFilter?: boolean;
        filter?: (value: string, search: string) => number;
        value?: string;
        onValueChange?: (value: string) => void;
        loop?: boolean;
        disablePointerSelection?: boolean;
    }

    export const Command: React.ForwardRefExoticComponent<CommandProps & React.RefAttributes<HTMLDivElement>>;

    // Dialog wrapper
    export interface CommandDialogProps extends DialogProps, CommandProps {}
    export const CommandDialog: React.ForwardRefExoticComponent<CommandDialogProps & React.RefAttributes<HTMLDivElement>>;

    export interface CommandInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
        onValueChange?: (search: string) => void;
    }
    export const CommandInput: React.ForwardRefExoticComponent<CommandInputProps & React.RefAttributes<HTMLInputElement>>;

    export const CommandList: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;

    export const CommandEmpty: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;

    export interface CommandGroupProps extends React.HTMLAttributes<HTMLDivElement> {
        heading?: React.ReactNode;
        value?: string;
        forceMount?: boolean;
    }
    export const CommandGroup: React.ForwardRefExoticComponent<CommandGroupProps & React.RefAttributes<HTMLDivElement>>;

    export const CommandSeparator: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;

    export interface CommandItemProps extends React.HTMLAttributes<HTMLDivElement> {
        disabled?: boolean;
        onSelect?: (value: string) => void;
        value?: string;
        keywords?: string[];
        forceMount?: boolean;
    }
    export const CommandItem: React.ForwardRefExoticComponent<CommandItemProps & React.RefAttributes<HTMLDivElement>>;

    export const CommandLoading: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;

    export const useCommandState: (state: any) => any;
}
