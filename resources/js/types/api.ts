/**
 * Standardized API response types for consistent error handling.
 */

/** Generic API success response */
export interface ApiSuccessResponse<T = unknown> {
    success: true;
    message: string;
    data?: T;
}

/** Generic API error response */
export interface ApiErrorResponse {
    success: false;
    message: string;
    errors?: Record<string, string[]>;
}

/** Union type for all API responses */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/** Inertia form validation errors (key-value pairs) */
export type InertiaValidationErrors = Record<string, string>;

/** PSGC API response item (regions, provinces, cities, barangays) */
export interface PsgcItem {
    code: string;
    name: string;
}

/** Paginated response from Laravel */
export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

/** Type guard: check if response is an error */
export function isApiError(response: ApiResponse): response is ApiErrorResponse {
    return response.success === false;
}

/** Extract error message from various error shapes */
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object' && 'message' in error) {
        return String((error as { message: unknown }).message);
    }
    return 'An unexpected error occurred.';
}
