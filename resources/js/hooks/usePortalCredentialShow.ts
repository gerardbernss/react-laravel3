import { router } from '@inertiajs/react';

interface Params {
    credentialId: number;
}

/** Manage the portal credential detail page — send, resend, suspend, and reactivate actions via Inertia router. */
export function usePortalCredentialShow({ credentialId }: Params) {
    const handleResend = () => {
        router.post(`/admin/portal-credentials/${credentialId}/resend`);
    };

    const handleSuspend = () => {
        router.post(`/admin/portal-credentials/${credentialId}/suspend`);
    };

    const handleReactivate = () => {
        router.post(`/admin/portal-credentials/${credentialId}/reactivate`);
    };

    const handleSend = () => {
        router.post(`/admin/portal-credentials/${credentialId}/send`);
    };

    return { handleResend, handleSuspend, handleReactivate, handleSend };
}
