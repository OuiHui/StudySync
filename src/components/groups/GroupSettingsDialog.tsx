import { useState, useEffect } from 'react';
import { Settings, Trash2, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { StudyGroupsService } from '@/services/database';

import { GroupBasicInfo } from './settings/GroupBasicInfo';
import { GroupAppearance } from './settings/GroupAppearance';
import { GroupPrivacy } from './settings/GroupPrivacy';
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

export const GroupSettingsDialog = ({
  group,
  open,
  onOpenChange,
  onGroupUpdated,
  onGroupDeleted
}: GroupSettingsDialogProps) => {
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
    max_members: 50,
    color: 'from-blue-500 to-blue-600',
    icon: 'Users'
  });

  // Reset form when group changes
  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name || '',
        description: group.description || '',
        subject: group.subject || '',
        is_public: group.is_public ?? true,
        max_members: group.max_members || 50,
        color: group.color || 'from-blue-500 to-blue-600',
        icon: group.icon || 'Users'
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
  }, [group]);

  const handleUpdateGroup = async () => {
    if (!group) return;

    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Group name is required.",
        variant: "destructive"
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
        color: formData.color
      } as any);

      const groupWithUIUpdates = {
        ...updatedGroup,
        color: formData.color,
        icon: useCustomImage ? uploadedImage : formData.icon
      };

      toast({
        title: "Group Updated",
        description: "Your group settings have been saved successfully.",
      });

      onGroupUpdated?.(groupWithUIUpdates);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating group:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update group. Please try again.",
        variant: "destructive"
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
        title: "Group Deleted",
        description: "Your group has been permanently deleted.",
      });

      onGroupDeleted?.(group.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete group. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Group Settings
          </DialogTitle>
          <DialogDescription>
            Manage your group settings and permissions.
          </DialogDescription>
        </DialogHeader>

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
            
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              <GroupBasicInfo
                formData={formData}
                setFormData={setFormData}
                loading={loading}
              />

              <GroupAppearance
                formData={formData}
                setFormData={setFormData}
                loading={loading}
                useCustomImage={useCustomImage}
                setUseCustomImage={setUseCustomImage}
                uploadedImage={uploadedImage}
                setUploadedImage={setUploadedImage}
              />

              <GroupPrivacy
                formData={formData as any}
                setFormData={setFormData}
                loading={loading}
                memberCount={group.member_count || 0}
              />

              {/* Actions */}
              <div className="flex justify-between">
                <Button
                  onClick={handleUpdateGroup}
                  disabled={loading || !formData.name.trim()}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Group
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
