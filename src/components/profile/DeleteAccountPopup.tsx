import { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
      <DialogContent className="max-w-lg w-full bg-popover text-popover-foreground border border-border rounded-2xl p-6 shadow-2xl overflow-hidden [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border">
          <DialogTitle className="text-2xl font-bold text-red-600 dark:text-red-500 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center flex-shrink-0">
              <Trash2 size={18} />
            </div>
            Delete Account
          </DialogTitle>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </DialogHeader>
        
        <div className="space-y-4 pt-1.5">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <h4 className="font-bold text-red-600 dark:text-red-400 mb-1 flex items-center gap-1.5 text-sm">
              <AlertTriangle size={16} />
              Warning: This action cannot be undone
            </h4>
            <p className="text-xs text-foreground">
              Deleting your account will permanently remove all of your data, including:
            </p>
            <ul className="text-xs text-muted-foreground mt-2 space-y-1 pl-1">
              <li>• All study sessions and progress</li>
              <li>• Notes and shared materials</li>
              <li>• Study group memberships</li>
              <li>• Friend connections</li>
              <li>• Achievements and statistics</li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h4 className="font-semibold text-sm text-foreground">Please confirm by checking all boxes:</h4>
            
            <div className="space-y-2 bg-muted/60 p-3 rounded-xl border border-border">
              <div className="flex items-start space-x-2.5">
                <Checkbox 
                  id="dataLoss"
                  checked={confirmations.dataLoss}
                  onCheckedChange={(checked) => handleConfirmationChange('dataLoss', checked as boolean)}
                />
                <Label htmlFor="dataLoss" className="text-xs font-semibold text-foreground leading-normal cursor-pointer">
                  I understand that all my data will be permanently deleted
                </Label>
              </div>

              <div className="flex items-start space-x-2.5">
                <Checkbox 
                  id="permanent"
                  checked={confirmations.permanent}
                  onCheckedChange={(checked) => handleConfirmationChange('permanent', checked as boolean)}
                />
                <Label htmlFor="permanent" className="text-xs font-semibold text-foreground leading-normal cursor-pointer">
                  I understand that this action is permanent and irreversible
                </Label>
              </div>

              <div className="flex items-start space-x-2.5">
                <Checkbox 
                  id="noRecovery"
                  checked={confirmations.noRecovery}
                  onCheckedChange={(checked) => handleConfirmationChange('noRecovery', checked as boolean)}
                />
                <Label htmlFor="noRecovery" className="text-xs font-semibold text-foreground leading-normal cursor-pointer">
                  I understand that my account cannot be recovered after deletion
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="confirmText" className="text-sm font-semibold text-foreground">
              Type "DELETE" to confirm account deletion: <span className="text-red-500 ml-0.5">*</span>
            </Label>
            <Input
              id="confirmText"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE here"
              className="bg-muted/60 border-border text-foreground placeholder:text-muted-foreground rounded-lg h-10 focus-visible:ring-red-500 focus-visible:border-red-500 text-sm font-semibold"
            />
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="bg-card hover:bg-muted text-foreground border border-border rounded-xl px-4 h-10 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!canDelete || isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-5 h-10 text-sm font-semibold disabled:opacity-50 flex items-center justify-center transition-all duration-200 inline-flex items-center gap-1.5"
            >
              <Trash2 size={16} />
              {isDeleting ? 'Processing...' : 'Delete Account'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};