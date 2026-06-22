import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

interface DeleteGroupModalProps {
  show: boolean;
  onClose: () => void;
  groupName: string;
  deleteConfirm: string;
  setDeleteConfirm: (val: string) => void;
  onDelete: () => void;
  loading: boolean;
}

export const DeleteGroupModal = ({
  show,
  onClose,
  groupName,
  deleteConfirm,
  setDeleteConfirm,
  onDelete,
  loading
}: DeleteGroupModalProps) => {
  if (!show) return null;

  const canDelete = deleteConfirm === groupName;

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl dark:shadow-black/40 overflow-hidden border border-red-100 dark:border-red-900/50">
        {/* Red warning header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <AlertTriangle size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Delete Group</h3>
            <p className="text-red-100 text-xs">This action is permanent</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="ml-auto w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            This will permanently delete <strong className="text-gray-900 dark:text-white">{groupName}</strong> and all associated data:
          </p>
          
          <div className="grid grid-cols-2 gap-2">
            {[
              'Study sessions & materials',
              'Member data & progress',
              'Chat history',
              'Notes & documents'
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/10 rounded-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                <span className="text-xs text-red-700 dark:text-red-300">{item}</span>
              </div>
            ))}
          </div>
          
          <div className="space-y-2 pt-2">
            <Label htmlFor="deleteConfirm" className="text-sm text-gray-600 dark:text-gray-400">
              Type <strong className="text-gray-900 dark:text-white font-semibold">{groupName}</strong> to confirm:
            </Label>
            <Input
              id="deleteConfirm"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={groupName}
              disabled={loading}
              className="rounded-xl border-red-200 dark:border-red-800 focus:border-red-400 dark:focus:border-red-600 focus:ring-red-400/20 bg-white dark:bg-gray-800/60"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={onDelete}
              disabled={loading || !canDelete}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl shadow-md shadow-red-500/20 disabled:opacity-40"
            >
              {loading ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <Trash2 size={16} className="mr-2" />
              )}
              {loading ? 'Deleting...' : 'Delete Permanently'}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border-gray-200 dark:border-gray-700"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
