import { Button } from '@/components/ui/button';
import { Loader, SendIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

function EmailAssignIdButton({ applicationId }: { applicationId: number }) {
    const [isSending, setIsSending] = useState(false);

    const handleEmailAssignId = async () => {
        setIsSending(true);

        try {
            const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
            const response = await fetch(`/studentidassignment/${applicationId}/email-admission`, {
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
        <Button
            variant="outline"
            size="sm"
            onClick={handleEmailAssignId}
            disabled={isSending}
            className="whitespace-nowrap"
        >
            {isSending ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <SendIcon className="mr-2 h-4 w-4" />}
            {isSending ? 'Sending...' : 'Email Student ID'}
        </Button>
    );
}

export default EmailAssignIdButton;
