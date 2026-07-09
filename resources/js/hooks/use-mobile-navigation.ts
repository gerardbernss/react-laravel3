import { useCallback } from 'react';

/** Restore pointer-events on the document body after mobile navigation closes. */
export function useMobileNavigation() {
    return useCallback(() => {
        // Remove pointer-events style from body...
        document.body.style.removeProperty('pointer-events');
    }, []);
}
