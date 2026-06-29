import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export interface PersonalData {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

export interface Credential {
    id: number;
    username: string;
    access_status: string;
    credentials_sent_at: string | null;
    last_login_at: string | null;
    login_attempts: number;
    personal_data?: PersonalData;
}

export type CredentialSortKey = 'name' | 'username' | 'status' | 'last_login_at' | 'credentials_sent_at';

export function usePortalCredentials(credentials: Credential[]) {
    const [sendDialogOpen, setSendDialogOpen] = useState(false);
    const [resendDialogOpen, setResendDialogOpen] = useState(false);
    const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortConfig, setSortConfig] = useState<{ key: CredentialSortKey | null; direction: 'asc' | 'desc' }>({
        key: null, direction: 'asc',
    });

    const hasFilters = !!(searchQuery || selectedStatus);

    const filteredItems = useMemo(() => {
        return credentials.filter((c) => {
            const q = searchQuery.toLowerCase();
            const fullName = `${c.personal_data?.first_name ?? ''} ${c.personal_data?.last_name ?? ''}`.toLowerCase();
            const matchesSearch =
                !q ||
                fullName.includes(q) ||
                (c.personal_data?.email ?? '').toLowerCase().includes(q) ||
                c.username.toLowerCase().includes(q);
            const matchesStatus = !selectedStatus || c.access_status?.toLowerCase() === selectedStatus.toLowerCase();
            return matchesSearch && matchesStatus;
        });
    }, [credentials, searchQuery, selectedStatus]);

    const sortedItems = useMemo(() => {
        if (!sortConfig.key) return filteredItems;
        return [...filteredItems].sort((a, b) => {
            let aVal = '';
            let bVal = '';
            if (sortConfig.key === 'name') {
                aVal = `${a.personal_data?.last_name ?? ''} ${a.personal_data?.first_name ?? ''}`;
                bVal = `${b.personal_data?.last_name ?? ''} ${b.personal_data?.first_name ?? ''}`;
            } else if (sortConfig.key === 'username')             { aVal = a.username; bVal = b.username; }
            else if (sortConfig.key === 'status')                 { aVal = a.access_status; bVal = b.access_status; }
            else if (sortConfig.key === 'last_login_at')          { aVal = a.last_login_at ?? ''; bVal = b.last_login_at ?? ''; }
            else if (sortConfig.key === 'credentials_sent_at')    { aVal = a.credentials_sent_at ?? ''; bVal = b.credentials_sent_at ?? ''; }
            return aVal.localeCompare(bVal) * (sortConfig.direction === 'asc' ? 1 : -1);
        });
    }, [filteredItems, sortConfig]);

    const paginatedItems = useMemo(
        () => sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [sortedItems, currentPage, pageSize],
    );

    const toggleSort = (key: CredentialSortKey) =>
        setSortConfig((prev) =>
            prev.key === key
                ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                : { key, direction: 'asc' },
        );

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedStatus('');
        setCurrentPage(1);
    };

    const openSendDialog = (credential: Credential) => {
        setSelectedCredential(credential);
        setSendDialogOpen(true);
    };

    const openResendDialog = (credential: Credential) => {
        setSelectedCredential(credential);
        setResendDialogOpen(true);
    };

    const handleSendCredentials = () => {
        if (!selectedCredential) return;
        router.post(`/portal-credentials/${selectedCredential.id}/send`, {}, {
            onSuccess: () => { setSendDialogOpen(false); setSelectedCredential(null); },
        });
    };

    const handleResend = () => {
        if (!selectedCredential) return;
        router.post(`/portal-credentials/${selectedCredential.id}/resend`, {}, {
            onSuccess: () => { setResendDialogOpen(false); setSelectedCredential(null); },
        });
    };

    return {
        sendDialogOpen, setSendDialogOpen,
        resendDialogOpen, setResendDialogOpen,
        selectedCredential,
        searchQuery, setSearchQuery,
        selectedStatus, setSelectedStatus,
        currentPage, setCurrentPage,
        pageSize, setPageSize,
        sortConfig,
        hasFilters,
        sortedItems,
        paginatedItems,
        toggleSort,
        clearFilters,
        openSendDialog,
        openResendDialog,
        handleSendCredentials,
        handleResend,
    };
}
