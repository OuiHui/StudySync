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
      <div className="max-w-md w-full bg-white dark:bg-[#1a1f2c] rounded-2xl shadow-2xl overflow-hidden border border-red-500/30">
        {/* Red warning header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200 dark:border-slate-700/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center flex-shrink-0">
              <Trash2 size={18} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Delete Group</h3>
              <p className="text-red-500 text-xs font-semibold">This action is permanent</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-zinc-300 transition-colors border border-gray-200 dark:border-slate-700"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-zinc-300 leading-relaxed">
            This will permanently delete <strong className="text-gray-900 dark:text-white">{groupName}</strong> and all associated data:
          </p>
          
          <div className="grid grid-cols-2 gap-2">
            {[
              'Study sessions & materials',
              'Member data & progress',
              'Chat history',
              'Notes & documents'
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 px-3 py-2 bg-red-500/10 rounded-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                <span className="text-xs font-medium text-red-600 dark:text-red-400">{item}</span>
              </div>
            ))}
          </div>
          
          <div className="space-y-1.5 pt-1">
            <Label htmlFor="deleteConfirm" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
              Type <strong className="text-gray-900 dark:text-white">{groupName}</strong> to confirm <span className="text-red-500 ml-0.5">*</span>:
            </Label>
            <Input
              id="deleteConfirm"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={groupName}
              disabled={loading}
              className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg h-10 focus-visible:ring-red-500 focus-visible:border-red-500 text-sm font-semibold"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-200 dark:border-slate-700/80">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl px-4 h-10 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={loading || !canDelete}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-5 h-10 text-sm font-semibold disabled:opacity-50 flex items-center justify-center transition-all duration-200"
            >
              {loading ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <Trash2 size={16} className="mr-2" />
              )}
              {loading ? 'Deleting...' : 'Delete Permanently'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
