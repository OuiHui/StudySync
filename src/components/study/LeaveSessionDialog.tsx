
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface LeaveSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  timerActive: boolean;
}

export const LeaveSessionDialog = ({ isOpen, onClose, onConfirm, timerActive }: LeaveSessionDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave Study Session?</AlertDialogTitle>
          <AlertDialogDescription>
            {timerActive 
              ? "You have an active timer running. Are you sure you want to leave your study session? Your progress will be lost."
              : "Are you sure you want to leave your study session?"
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Leave Session</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
