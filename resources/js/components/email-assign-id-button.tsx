import { TABLE_ROW_ACTION } from '@/constants/ui';
import { Loader, SendIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

/** Button that POSTs to /admin/student-id-assignment/:id/email-admission and shows a toast confirming the student ID email was sent. */
function EmailAssignIdButton({ applicationId }: { applicationId: number }) {
    const [isSending, setIsSending] = useState(false);

    const handleEmailAssignId = async () => {
        setIsSending(true);

        try {
            const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
            const response = await fetch(`/admin/student-id-assignment/${applicationId}/email-admission`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message || 'Student ID email sent successfully!');
            } else {
                toast.error(data.message || 'Failed to send email');
            }
        } catch (error) {
            toast.error('An error occurred while sending the email');
            console.error('Email send error:', error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <button onClick={handleEmailAssignId} disabled={isSending} className={TABLE_ROW_ACTION}>
            {isSending ? <Loader className="h-3 w-3 animate-spin" /> : <SendIcon className="h-3 w-3" />}
            {isSending ? 'Sending...' : 'Email Student ID'}
        </button>
    );
}

export default EmailAssignIdButton;
