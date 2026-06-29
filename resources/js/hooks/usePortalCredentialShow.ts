import { router } from '@inertiajs/react';

interface Params {
    credentialId: number;
}

export function usePortalCredentialShow({ credentialId }: Params) {
    const handleResend = () => {
        router.post(`/portal-credentials/${credentialId}/resend`);
    };

    const handleSuspend = () => {
        router.post(`/portal-credentials/${credentialId}/suspend`);
    };

    const handleReactivate = () => {
        router.post(`/portal-credentials/${credentialId}/reactivate`);
    };

    const handleSend = () => {
        router.post(`/portal-credentials/${credentialId}/send`);
    };

    return { handleResend, handleSuspend, handleReactivate, handleSend };
}
