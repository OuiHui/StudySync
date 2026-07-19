import React, { useState, useEffect } from 'react';
import { MoreHorizontal, X, Upload, Image as ImageIcon, Minus, Plus, Loader2, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { StudyGroupsService } from '@/services/database';
import { DeleteGroupModal } from './settings/DeleteGroupModal';

interface GroupSettingsDialogProps {
  group: {
    id: string;
    name: string;
    description?: string;
    subject?: string;
    is_public: boolean;
    max_members?: number;
    member_count?: number;
    created_at: string;
    color?: string;
    icon?: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupUpdated?: (updatedGroup: any) => void;
  onGroupDeleted?: (groupId: string) => void;
}

export const GroupSettingsDialog: React.FC<GroupSettingsDialogProps> = ({
  group,
  open,
  onOpenChange,
  onGroupUpdated,
  onGroupDeleted,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [useCustomImage, setUseCustomImage] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    is_public: true,
    max_members: 12,
    color: 'from-blue-500 to-blue-600',
    icon: 'Users',
  });

  // Reset form when group changes or modal opens
  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name || '',
        description: group.description || '',
        subject: group.subject || '',
        is_public: group.is_public ?? true,
        max_members: group.max_members || 12,
        color: group.color || 'from-blue-500 to-blue-600',
        icon: group.icon || 'Users',
      });

      if (group.icon && (group.icon.startsWith('data:') || group.icon.startsWith('http'))) {
        setUploadedImage(group.icon);
        setUseCustomImage(true);
      } else {
        setUploadedImage(null);
        setUseCustomImage(false);
      }
    }
    setDeleteConfirm('');
    setShowDeleteConfirm(false);
  }, [group, open]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select an image smaller than 5MB.',
          variant: 'destructive',
        });
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file.',
          variant: 'destructive',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImage(result);
        setUseCustomImage(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateGroup = async () => {
    if (!group) return;

    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Group name is required.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const updatedGroup = await StudyGroupsService.updateGroup(group.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        subject: formData.subject.trim() || null,
        is_public: formData.is_public,
        max_members: formData.max_members,
        icon: useCustomImage ? uploadedImage : formData.icon,
        color: formData.color,
      } as any);

      const groupWithUIUpdates = {
        ...updatedGroup,
        color: formData.color,
        icon: useCustomImage ? uploadedImage : formData.icon,
      };

      toast({
        title: 'Group Updated',
        description: 'Your group settings have been saved successfully.',
      });

      onGroupUpdated?.(groupWithUIUpdates);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating group:', error);
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update group. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!group || deleteConfirm !== group.name) return;

    setLoading(true);
    try {
      await StudyGroupsService.deleteGroup(group.id);

      toast({
        title: 'Group Deleted',
        description: 'Your group has been permanently deleted.',
      });

      onGroupDeleted?.(group.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Failed to delete group. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const displayImage = useCustomImage && uploadedImage ? uploadedImage : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Modal Panel: Rich dark blue background (#1a1f2c / slate-800) matching other study modals */}
      <DialogContent className="max-w-lg w-full bg-white dark:bg-[#1a1f2c] text-gray-900 dark:text-zinc-100 border border-gray-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-2xl overflow-hidden [&>button]:hidden">
        {group && (
          <>
            <DeleteGroupModal
              show={showDeleteConfirm}
              onClose={() => {
                setShowDeleteConfirm(false);
                setDeleteConfirm('');
              }}
              groupName={group.name}
              deleteConfirm={deleteConfirm}
              setDeleteConfirm={setDeleteConfirm}
              onDelete={handleDeleteGroup}
              loading={loading}
            />

            {/* Header */}
            <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-200 dark:border-slate-700/80">
              <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                Edit Study Group
              </DialogTitle>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="p-1.5 rounded-lg bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-zinc-300 transition-colors border border-gray-200 dark:border-slate-700"
                      title="More options"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white dark:bg-[#1a1f2c] border-gray-200 dark:border-slate-700 text-gray-900 dark:text-zinc-200">
                    <DropdownMenuItem
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                    >
                      <Trash2 size={14} className="mr-2" />
                      Delete Group
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="p-1.5 rounded-lg bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-zinc-300 transition-colors border border-gray-200 dark:border-slate-700"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </DialogHeader>

            {/* Content Form */}
            <div className="space-y-3 pt-1.5">
              {/* Group Image */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 dark:bg-[#12151e] rounded-xl border border-dashed border-gray-300 dark:border-slate-700/80 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                  {displayImage ? (
                    <img src={displayImage} alt="Group avatar" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <ImageIcon className="w-7 h-7 text-gray-400 dark:text-slate-500" />
                  )}
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Group image</Label>
                  <div className="mt-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="group-image-input"
                      disabled={loading}
                    />
                    <label
                      htmlFor="group-image-input"
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-sm"
                    >
                      <Upload size={14} />
                      Upload image
                    </label>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1">
                    PNG or JPG, up to 5MB. Square images work best.
                  </p>
                </div>
              </div>

              {/* Group Name */}
              <div className="space-y-1">
                <Label htmlFor="group-name" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Group name
                </Label>
                <Input
                  id="group-name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Group name"
                  disabled={loading}
                  className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg h-10 focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm font-semibold"
                />
              </div>

              {/* Course */}
              <div className="space-y-1">
                <Label htmlFor="group-course" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Course
                </Label>
                <Input
                  id="group-course"
                  value={formData.subject}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="Course (e.g. CHEM 202)"
                  disabled={loading}
                  className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg h-10 focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm font-semibold"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Label htmlFor="group-description" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Description
                </Label>
                <Textarea
                  id="group-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value.slice(0, 500) }))
                  }
                  placeholder="Describe your group..."
                  rows={3}
                  disabled={loading}
                  className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm leading-relaxed resize-y font-normal"
                />
                <p className="text-[11px] text-gray-500 dark:text-zinc-400 text-right mt-0.5">
                  {formData.description.length}/500 characters
                </p>
              </div>

              {/* Member Limit */}
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Member limit</Label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, max_members: Math.max(1, prev.max_members - 1) }))
                    }
                    disabled={loading || formData.max_members <= 1}
                    className="w-9 h-9 rounded-lg bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white flex items-center justify-center font-bold text-base transition-colors disabled:opacity-50"
                  >
                    <Minus size={15} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={formData.max_members}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        max_members: parseInt(e.target.value) || 1,
                      }))
                    }
                    disabled={loading}
                    className="w-14 h-9 text-center bg-gray-100 dark:bg-[#12151e] border border-gray-200 dark:border-slate-700/80 rounded-lg text-gray-900 dark:text-white font-bold text-sm focus:outline-none focus:border-[#2a78d6] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, max_members: prev.max_members + 1 }))}
                    disabled={loading}
                    className="w-9 h-9 rounded-lg bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white flex items-center justify-center font-bold text-base transition-colors"
                  >
                    <Plus size={15} />
                  </button>
                  <span className="text-xs text-gray-500 dark:text-zinc-400 font-medium ml-1">members max</span>
                </div>
              </div>

              {/* Who Can Join */}
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Who can join</Label>
                {/* Elevated dark container (#12151e) inside dark blue modal (#1a1f2c) */}
                <div className="bg-gray-100 dark:bg-[#12151e] p-1 rounded-xl border border-gray-200 dark:border-slate-700/80 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, is_public: true }))}
                    disabled={loading}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      formData.is_public
                        ? 'bg-[#2a78d6] text-white shadow-sm'
                        : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Anyone can join
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, is_public: false }))}
                    disabled={loading}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      !formData.is_public
                        ? 'bg-[#2a78d6] text-white shadow-sm'
                        : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Requires approval
                  </button>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-gray-200 dark:border-slate-700/80 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl px-4 h-10 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                {/* Interactive Fill Token: blue-450 / var(--fill-accent) (#2a78d6) */}
                <button
                  type="button"
                  onClick={handleUpdateGroup}
                  disabled={loading || !formData.name.trim()}
                  className="bg-[#2a78d6] hover:bg-[#2268bc] text-white rounded-xl px-5 h-10 text-sm font-semibold disabled:opacity-50 flex items-center justify-center transition-all duration-200"
                >
                  {loading && <Loader2 size={14} className="mr-2 animate-spin" />}
                  Save changes
                </button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
