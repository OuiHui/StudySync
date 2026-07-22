import React, { useState } from 'react';
import { FormLabel, ModalFooter } from '@/components/ui/modal-primitives';
import { UserCheck, X, Loader2, LogOut } from 'lucide-react';

interface MemberOption {
  id: string;
  display_name?: string;
  email?: string;
  avatar_url?: string;
}

interface TransferAdminModalProps {
  show: boolean;
  onClose: () => void;
  groupName: string;
  members: MemberOption[];
  currentUserId?: string;
  onConfirmLeave: (newAdminId: string) => Promise<void>;
  loading?: boolean;
}

export const TransferAdminModal: React.FC<TransferAdminModalProps> = ({
  show,
  onClose,
  groupName,
  members,
  currentUserId,
  onConfirmLeave,
  loading = false,
}) => {
  const eligibleMembers = members.filter((m) => m.id !== currentUserId);
  const [selectedAdminId, setSelectedAdminId] = useState<string>(
    eligibleMembers[0]?.id || ''
  );
  const [submitting, setSubmitting] = useState(false);

  if (!show) return null;

  const handleConfirm = async () => {
    if (!selectedAdminId) return;
    try {
      setSubmitting(false);
      setSubmitting(true);
      await onConfirmLeave(selectedAdminId);
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = loading || submitting;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
      <div className="max-w-md w-full bg-white dark:bg-[#1a1f2c] rounded-2xl shadow-2xl overflow-hidden border border-amber-500/30">
        {/* Modal Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200 dark:border-slate-700/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
              <UserCheck size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                Transfer Admin Role
              </h3>
              <p className="text-amber-600 dark:text-amber-400 text-xs font-semibold">
                Action required before leaving
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-zinc-300 transition-colors border border-gray-200 dark:border-slate-700"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-zinc-300 leading-relaxed">
            You are currently the admin of <strong className="text-gray-900 dark:text-white">{groupName}</strong>. 
            Before leaving, you must explicitly select a member to take over as the new admin.
          </p>

          <div className="space-y-1.5">
            <FormLabel htmlFor="new-admin-select" required>
              Select New Admin
            </FormLabel>
            <select
              id="new-admin-select"
              value={selectedAdminId}
              onChange={(e) => setSelectedAdminId(e.target.value)}
              disabled={isLoading || eligibleMembers.length === 0}
              className="w-full bg-gray-100 dark:bg-[#12151e] border border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white rounded-lg h-10 px-3 text-sm font-semibold focus:outline-none focus:border-[#2a78d6]"
            >
              {eligibleMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.display_name || m.email || 'Unnamed Member'}
                </option>
              ))}
            </select>
          </div>

          <ModalFooter onCancel={onClose}>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading || !selectedAdminId}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-5 h-10 text-sm font-semibold disabled:opacity-50 flex items-center justify-center transition-all duration-200"
            >
              {isLoading ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <LogOut size={16} className="mr-2" />
              )}
              {isLoading ? 'Transferring...' : 'Transfer Admin & Leave'}
            </button>
          </ModalFooter>
        </div>
      </div>
    </div>
  );
};
