import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface TablePaginationProps {
    total: number;
    pageSize: number;
    currentPage: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    pageSizeOptions?: number[];
}

export function TablePagination({
    total,
    pageSize,
    currentPage,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [5, 10, 25, 50],
}: TablePaginationProps) {
    const totalPages = Math.ceil(total / pageSize) || 1;
    const from = total > 0 ? (currentPage - 1) * pageSize + 1 : 0;
    const to = Math.min(currentPage * pageSize, total);

    return (
        <div className="flex items-center justify-between border-t bg-white px-4 py-3">
            <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700">Rows per page:</span>
                <select
                    value={pageSize}
                    onChange={(e) => {
                        onPageSizeChange(Number(e.target.value));
                        onPageChange(1);
                    }}
                    className="rounded-lg border border-gray-300 px-3 py-1 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {pageSizeOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
                <span className="text-sm text-gray-700">
                    {from} - {to} of {total}
                </span>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="rounded-lg p-2 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <ChevronsLeft className="h-5 w-5" />
                </button>
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg p-2 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="px-4 py-2 text-sm font-medium">
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg p-2 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="rounded-lg p-2 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <ChevronsRight className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}
