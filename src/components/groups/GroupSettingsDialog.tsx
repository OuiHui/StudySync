import { useState, useEffect } from 'react';
import { 
  Settings, 
  Trash2, 
  Save, 
  X, 
  AlertTriangle,
  Users,
  Lock,
  Unlock
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { StudyGroupsService } from '@/services/database';

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
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    is_public: true,
    max_members: 50
  });

  // Reset form when group changes
  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name || '',
        description: group.description || '',
        subject: group.subject || '',
        is_public: group.is_public ?? true,
        max_members: group.max_members || 50
      });
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
        max_members: formData.max_members
      });

      toast({
        title: "Group Updated",
        description: "Your group settings have been saved successfully.",
      });

      onGroupUpdated?.(updatedGroup);
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

  const canDelete = deleteConfirm === group?.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Group Settings
          </DialogTitle>
          <DialogDescription>
            Manage your group settings and permissions.
          </DialogDescription>
        </DialogHeader>

        {group && (
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Group Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter group name..."
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="e.g., Mathematics, Computer Science..."
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your group's purpose and goals..."
                    rows={3}
                    disabled={loading}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Privacy & Limits */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Privacy & Limits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      {formData.is_public ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      Public Group
                    </Label>
                    <p className="text-sm text-gray-500">
                      {formData.is_public 
                        ? "Anyone can discover and join this group"
                        : "Only people with an invite can join this group"
                      }
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_public}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxMembers" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Maximum Members
                  </Label>
                  <Input
                    id="maxMembers"
                    type="number"
                    min="1"
                    max="1000"
                    value={formData.max_members}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      max_members: parseInt(e.target.value) || 50 
                    }))}
                    disabled={loading}
                  />
                  <p className="text-sm text-gray-500">
                    Current members: {group.member_count || 0}
                  </p>
                </div>
              </CardContent>
            </Card>

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

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
              <>
                <Separator />
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-red-800 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Delete Group
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-red-700">
                      This action cannot be undone. This will permanently delete the group and all associated data including:
                    </p>
                    <ul className="list-disc list-inside text-red-700 space-y-1">
                      <li>All group sessions and study materials</li>
                      <li>All member data and progress</li>
                      <li>Group chat history</li>
                      <li>Group notes and documents</li>
                    </ul>
                    
                    <div className="space-y-2">
                      <Label htmlFor="deleteConfirm" className="text-red-800">
                        Type the group name <strong>{group.name}</strong> to confirm:
                      </Label>
                      <Input
                        id="deleteConfirm"
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        placeholder={group.name}
                        disabled={loading}
                        className="border-red-300 focus:border-red-500"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleDeleteGroup}
                        disabled={loading || !canDelete}
                        variant="destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {loading ? 'Deleting...' : 'Delete Group Permanently'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirm('');
                        }}
                        disabled={loading}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
