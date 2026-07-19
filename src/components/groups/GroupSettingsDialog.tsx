import React, { useState, useEffect } from 'react';
import { MoreHorizontal, Upload, Image as ImageIcon, Minus, Plus, Loader2, Trash2, Users } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { StandardDialogContent, ModalHeader, FormLabel, ModalFooter } from '@/components/ui/modal-primitives';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { StudyGroupsService } from '@/services/database';
import { DeleteGroupModal } from './settings/DeleteGroupModal';

interface GroupSettingsDialogProps {
  groupId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupUpdated?: () => void;
  onGroupDeleted?: () => void;
}

export const GroupSettingsDialog: React.FC<GroupSettingsDialogProps> = ({
  groupId,
  open,
  onOpenChange,
  onGroupUpdated,
  onGroupDeleted,
}) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    description: '',
    is_public: true,
    max_members: 50,
    avatar_url: '',
  });

  const { toast } = useToast();

  useEffect(() => {
    if (open && groupId) {
      fetchGroupData();
    }
  }, [open, groupId]);

  const fetchGroupData = async () => {
    try {
      setFetching(true);
      const data = await StudyGroupsService.getGroupById(groupId);
      if (data) {
        setFormData({
          name: data.name || '',
          subject: data.subject || '',
          description: data.description || '',
          is_public: data.is_public ?? true,
          max_members: data.max_members || 50,
          avatar_url: data.avatar_url || '',
        });
      }
    } catch (err) {
      console.error('Failed to load group details:', err);
      toast({
        title: 'Error',
        description: 'Failed to load group settings.',
        variant: 'destructive',
      });
    } finally {
      setFetching(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Image size must be less than 5MB.',
          variant: 'destructive',
        });
        return;
      }
      setNewImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateGroup = async () => {
    if (!formData.name.trim()) return;

    try {
      setLoading(true);
      let updatedAvatarUrl = formData.avatar_url;

      if (newImageFile) {
        const uploaded = await StudyGroupsService.uploadGroupAvatar(groupId, newImageFile);
        if (uploaded) {
          updatedAvatarUrl = uploaded;
        }
      }

      await StudyGroupsService.updateGroup(groupId, {
        name: formData.name.trim(),
        subject: formData.subject.trim() || undefined,
        description: formData.description.trim() || undefined,
        is_public: formData.is_public,
        max_members: formData.max_members,
        avatar_url: updatedAvatarUrl,
      });

      toast({
        title: 'Settings Saved',
        description: 'Study group settings have been updated.',
      });

      onGroupUpdated?.();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Failed to update group:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to save group settings.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (deleteConfirm !== formData.name) return;

    try {
      setLoading(true);
      await StudyGroupsService.deleteGroup(groupId);
      toast({
        title: 'Group Deleted',
        description: 'The study group has been permanently deleted.',
      });
      setShowDeleteConfirm(false);
      onOpenChange(false);
      onGroupDeleted?.();
    } catch (err: any) {
      console.error('Failed to delete group:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete study group.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const displayImage = imagePreview || formData.avatar_url;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <StandardDialogContent size="lg" className="relative">
        <DeleteGroupModal
          show={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setDeleteConfirm('');
          }}
          groupName={formData.name}
          deleteConfirm={deleteConfirm}
          setDeleteConfirm={setDeleteConfirm}
          onDelete={handleDeleteGroup}
          loading={loading}
        />

        {fetching ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#2a78d6] mb-3" />
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">
              Loading settings...
            </p>
          </div>
        ) : (
          <>
            <ModalHeader
              title="Edit Study Group"
              icon={<Users size={18} />}
              onClose={() => onOpenChange(false)}
              titleBadge={
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="p-1.5 rounded-lg bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-zinc-300 transition-colors border border-gray-200 dark:border-slate-700 ml-auto"
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
              }
            />

            <div className="space-y-3 pt-1.5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 dark:bg-[#12151e] rounded-xl border border-dashed border-gray-300 dark:border-slate-700/80 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                  {displayImage ? (
                    <img src={displayImage} alt="Group avatar" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <ImageIcon className="w-7 h-7 text-gray-400 dark:text-slate-500" />
                  )}
                </div>
                <div className="flex-1">
                  <FormLabel>Group image</FormLabel>
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

              <div className="space-y-1">
                <FormLabel htmlFor="group-name" required>
                  Group name
                </FormLabel>
                <Input
                  id="group-name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Group name"
                  disabled={loading}
                  className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg h-10 focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm font-semibold"
                />
              </div>

              <div className="space-y-1">
                <FormLabel htmlFor="group-course">
                  Course
                </FormLabel>
                <Input
                  id="group-course"
                  value={formData.subject}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="Course (e.g. CHEM 202)"
                  disabled={loading}
                  className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg h-10 focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm font-semibold"
                />
              </div>

              <div className="space-y-1">
                <FormLabel htmlFor="group-description">
                  Description
                </FormLabel>
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

              <div className="space-y-1">
                <FormLabel>Member limit</FormLabel>
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

              <div className="space-y-1">
                <FormLabel>Who can join</FormLabel>
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

              <ModalFooter onCancel={() => onOpenChange(false)}>
                <button
                  type="button"
                  onClick={handleUpdateGroup}
                  disabled={loading || !formData.name.trim()}
                  className="bg-[#2a78d6] hover:bg-[#2268bc] text-white rounded-xl px-5 h-10 text-sm font-semibold disabled:opacity-50 flex items-center justify-center transition-all duration-200"
                >
                  {loading && <Loader2 size={14} className="mr-2 animate-spin" />}
                  Save changes
                </button>
              </ModalFooter>
            </div>
          </>
        )}
      </StandardDialogContent>
    </Dialog>
  );
};
