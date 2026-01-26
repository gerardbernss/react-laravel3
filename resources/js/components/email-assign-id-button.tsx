import { Button } from '@mui/material';
import { Loader, SendIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

function EmailAssignIdButton({ applicationId }: { applicationId: number }) {
    const [isSending, setIsSending] = useState(false);

    const handleEmailAssignId = async () => {
        setIsSending(true);

        try {
            const response = await fetch(`/studentidassignment/${applicationId}/email-admission`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
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
            variant="outlined"
            color="primary"
            startIcon={isSending ? <Loader size={16} className="animate-spin" /> : <SendIcon size={16} />}
            onClick={handleEmailAssignId}
            disabled={isSending}
            size="small"
            sx={{ whiteSpace: 'nowrap' }}
        >
            {isSending ? 'Sending...' : 'Email Student ID'}
        </Button>
    );
}

export default EmailAssignIdButton;
