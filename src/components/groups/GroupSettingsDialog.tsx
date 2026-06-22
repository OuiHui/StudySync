import { useState, useEffect } from 'react';
import { Settings, Trash2, Save, Type, Palette, Shield, Loader2, Users, Crown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { StudyGroupsService } from '@/services/database';

import { GroupBasicInfo } from './settings/GroupBasicInfo';
import { GroupAppearance, availableIcons, availableColors } from './settings/GroupAppearance';
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

type SettingsTab = 'basic' | 'appearance' | 'privacy';

const tabs: { id: SettingsTab; label: string; icon: typeof Type }[] = [
  { id: 'basic', label: 'Basic Info', icon: Type },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'privacy', label: 'Privacy & Limits', icon: Shield },
];

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
  const [activeTab, setActiveTab] = useState<SettingsTab>('basic');
  
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
    setActiveTab('basic');
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

  // Render the live preview icon
  const renderPreviewIcon = () => {
    if (useCustomImage && uploadedImage) {
      return (
        <img 
          src={uploadedImage} 
          alt="Group icon" 
          className="w-full h-full object-cover rounded-xl"
        />
      );
    }
    const selectedIcon = availableIcons.find(i => i.name === formData.icon);
    const IconComponent = selectedIcon?.icon || Users;
    return <IconComponent size={22} className="text-white drop-shadow-md" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border-0 shadow-2xl dark:shadow-black/40 rounded-2xl">
        
        {/* Live gradient header preview */}
        <div className={`relative h-28 bg-gradient-to-br ${formData.color} overflow-hidden transition-all duration-500 ease-out rounded-t-2xl`}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15)_0%,_transparent_60%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          
          {/* Floating icon preview */}
          <div className="absolute bottom-4 left-6 flex items-end gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border border-white/30 transition-all duration-300">
              {renderPreviewIcon()}
            </div>
            <div className="pb-1">
              <p className="text-white/70 text-xs font-medium tracking-wide uppercase">Editing</p>
              <h3 className="text-white font-bold text-lg leading-tight drop-shadow-sm truncate max-w-[280px]">
                {formData.name || 'Group Name'}
              </h3>
            </div>
          </div>

          {/* Crown badge */}
          <div className="absolute top-4 right-6">
            <div className="bg-yellow-400/90 backdrop-blur-sm p-1.5 rounded-full shadow-lg border border-yellow-300/50">
              <Crown size={14} className="text-yellow-800" />
            </div>
          </div>
        </div>

        {/* Dialog header (hidden visually, kept for accessibility) */}
        <DialogHeader className="sr-only">
          <DialogTitle>Group Settings</DialogTitle>
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
            
            {/* Tab navigation */}
            <div className="px-6 pt-4 pb-0">
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <Icon size={15} className={isActive ? 'text-blue-500' : ''} />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-1">
                {activeTab === 'basic' && (
                  <GroupBasicInfo
                    formData={formData}
                    setFormData={setFormData}
                    loading={loading}
                  />
                )}

                {activeTab === 'appearance' && (
                  <GroupAppearance
                    formData={formData}
                    setFormData={setFormData}
                    loading={loading}
                    useCustomImage={useCustomImage}
                    setUseCustomImage={setUseCustomImage}
                    uploadedImage={uploadedImage}
                    setUploadedImage={setUploadedImage}
                  />
                )}

                {activeTab === 'privacy' && (
                  <GroupPrivacy
                    formData={formData as any}
                    setFormData={setFormData}
                    loading={loading}
                    memberCount={group.member_count || 0}
                  />
                )}
              </div>
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between rounded-b-2xl">
              <button
                onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                disabled={loading}
              >
                <Trash2 size={15} />
                Delete Group
              </button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="rounded-xl border-gray-200 dark:border-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateGroup}
                  disabled={loading || !formData.name.trim()}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200"
                >
                  {loading ? (
                    <Loader2 size={16} className="mr-2 animate-spin" />
                  ) : (
                    <Save size={16} className="mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
