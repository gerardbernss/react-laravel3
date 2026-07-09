import { TABLE_CELL, TABLE_HEADER_CELL, TABLE_HEADER_CELL_CENTER, TABLE_ROW } from '@/constants/ui';
import { cn } from '@/lib/utils';
import { type ReactNode, type TdHTMLAttributes, type ThHTMLAttributes } from 'react';

interface AppTableProps {
    children: ReactNode;
    footer?: ReactNode;
    className?: string;
    scrollable?: boolean;
}

/** Scrollable data table shell with sticky-header support; composed via AppTable.Head, Th, Body, Row, Td, and Empty sub-components. */
export function AppTable({ children, footer, className, scrollable = true }: AppTableProps) {
    return (
        <div className={cn('overflow-hidden rounded-lg border bg-white shadow-sm', className)}>
            <div className={cn(scrollable && 'max-h-[70vh] overflow-x-auto overflow-y-auto')}>
                <table className="w-full text-sm">{children}</table>
            </div>
            {footer}
        </div>
    );
}

AppTable.Head = function AppTableHead({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <thead className={cn('sticky top-0 z-10 bg-gray-50', className)}>
            <tr>{children}</tr>
        </thead>
    );
};

AppTable.Th = function AppTableTh({ children, center = false, className, ...props }: ThHTMLAttributes<HTMLTableCellElement> & { center?: boolean }) {
    return (
        <th className={cn(center ? TABLE_HEADER_CELL_CENTER : TABLE_HEADER_CELL, className)} {...props}>
            {children}
        </th>
    );
};

AppTable.Body = function AppTableBody({ children }: { children: ReactNode }) {
    return <tbody>{children}</tbody>;
};

AppTable.Row = function AppTableRow({ children, className, ...props }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLTableRowElement>) {
    return (
        <tr className={cn(TABLE_ROW, className)} {...props}>
            {children}
        </tr>
    );
};

AppTable.Td = function AppTableTd({ children, className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
    return (
        <td className={cn(TABLE_CELL, className)} {...props}>
            {children}
        </td>
    );
};

AppTable.Empty = function AppTableEmpty({ colSpan, message = 'No records found.' }: { colSpan: number; message?: string }) {
    return (
        <tr>
            <td colSpan={colSpan} className="py-16 text-center text-sm text-gray-400">
                {message}
            </td>
        </tr>
    );
};
