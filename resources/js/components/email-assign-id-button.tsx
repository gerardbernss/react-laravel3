import { Button } from '@mui/material';
import { SendIcon } from 'lucide-react';

function EmailAssignIdButton({ applicationId }: { applicationId: number }) {
    const openEmailAssignId = () => {
        window.open(`/studentidassignment/${applicationId}/email-admission`);
    };

    return (
        <Button
            variant="outlined"
            color="primary"
            startIcon={<SendIcon size={16} />}
            onClick={openEmailAssignId}
            size="small"
            sx={{ whiteSpace: 'nowrap' }}
        >
            Email Student ID
        </Button>
    );
}

export default EmailAssignIdButton;
