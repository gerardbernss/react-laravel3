import { router } from '@inertiajs/react';

interface Params {
    credentialId: number;
}

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
