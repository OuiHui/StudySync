import { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

interface DeleteAccountPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeleteAccountPopup = ({ isOpen, onClose }: DeleteAccountPopupProps) => {
  const [confirmText, setConfirmText] = useState('');
  const [confirmations, setConfirmations] = useState({
    dataLoss: false,
    permanent: false,
    noRecovery: false,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleConfirmationChange = (key: keyof typeof confirmations, checked: boolean) => {
    setConfirmations(prev => ({
      ...prev,
      [key]: checked
    }));
  };

  const canDelete = confirmText === 'DELETE' && 
                   confirmations.dataLoss && 
                   confirmations.permanent && 
                   confirmations.noRecovery;

  const handleDelete = async () => {
    if (!canDelete) return;

    setIsDeleting(true);
    
    // Simulate deletion process
    setTimeout(() => {
      toast({
        title: "Account Deletion Initiated",
        description: "Your account deletion request has been submitted. You will receive a confirmation email within 24 hours.",
        variant: "destructive"
      });
      setIsDeleting(false);
      onClose();
    }, 2000);
  };

  const resetForm = () => {
    setConfirmText('');
    setConfirmations({
      dataLoss: false,
      permanent: false,
      noRecovery: false,
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <AlertTriangle size={20} className="mr-2" />
            Delete Account
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">Warning: This action cannot be undone</h4>
            <p className="text-sm text-red-700 dark:text-red-300">
              Deleting your account will permanently remove all of your data, including:
            </p>
            <ul className="text-sm text-red-700 dark:text-red-300 mt-2 space-y-1">
              <li>• All study sessions and progress</li>
              <li>• Notes and shared materials</li>
              <li>• Study group memberships</li>
              <li>• Friend connections</li>
              <li>• Achievements and statistics</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800 dark:text-white">Please confirm by checking all boxes:</h4>
            
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="dataLoss"
                  checked={confirmations.dataLoss}
                  onCheckedChange={(checked) => handleConfirmationChange('dataLoss', checked as boolean)}
                />
                <Label htmlFor="dataLoss" className="text-sm leading-tight">
                  I understand that all my data will be permanently deleted
                </Label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="permanent"
                  checked={confirmations.permanent}
                  onCheckedChange={(checked) => handleConfirmationChange('permanent', checked as boolean)}
                />
                <Label htmlFor="permanent" className="text-sm leading-tight">
                  I understand that this action is permanent and irreversible
                </Label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="noRecovery"
                  checked={confirmations.noRecovery}
                  onCheckedChange={(checked) => handleConfirmationChange('noRecovery', checked as boolean)}
                />
                <Label htmlFor="noRecovery" className="text-sm leading-tight">
                  I understand that my account cannot be recovered after deletion
                </Label>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="confirmText" className="text-sm font-medium">
              Type "DELETE" to confirm account deletion:
            </Label>
            <Input
              id="confirmText"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE here"
              className="mt-1"
            />
          </div>

          <div className="flex space-x-2 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleDelete}
              disabled={!canDelete || isDeleting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            >
              {isDeleting ? (
                <>Processing...</>
              ) : (
                <>
                  <Trash2 size={16} className="mr-2" />
                  Delete Account
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};