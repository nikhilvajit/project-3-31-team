import React, { useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText, 
  DialogActions, 
  Button 
} from '@mui/material';
import { useTimeTracking } from '@/context/TimeTrackingContext';

interface FirstTimeTrackingDialogProps {
  open: boolean;
  onClose: () => void;
}

export const FirstTimeTrackingDialog: React.FC<FirstTimeTrackingDialogProps> = ({ 
  open, 
  onClose 
}) => {
  const { startTracking } = useTimeTracking();

  useEffect(() => {
    console.log('FirstTimeTrackingDialog - Open state:', open);
  }, [open]);

  const handleStartTracking = () => {
    console.log('Starting tracking from dialog');
    startTracking();
    // Store in localStorage that tracking has been started
    localStorage.setItem('firstTimeTrackingDone', 'true');
    onClose();
  };

  return (
    <Dialog
      open={open}
      PaperProps={{
        style: {
          zIndex: 1500 // Ensure it's above other elements
        }
      }}
    >
      <DialogTitle>
        Start Your Shift
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          Press the button below to start tracking your work time for this shift.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick= { () => { handleStartTracking(); onClose(); }} color="primary" autoFocus>
          Start Tracking
        </Button>
      </DialogActions>
    </Dialog>
  );
};
