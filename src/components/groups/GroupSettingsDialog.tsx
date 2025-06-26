import { useState, useEffect } from 'react';
import { 
  Settings, 
  Trash2, 
  Save, 
  X, 
  AlertTriangle,
  Users,
  Lock,
  Unlock,
  BookOpen,
  Calculator,
  Atom,
  Code,
  Palette,
  Globe,
  Music,
  Camera,
  Heart,
  Star,
  Zap,
  Crown,
  Upload,
  Image
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

  // Available icons and colors
  const availableIcons = [
    { name: 'Users', icon: Users, label: 'Users' },
    { name: 'BookOpen', icon: BookOpen, label: 'Book' },
    { name: 'Calculator', icon: Calculator, label: 'Calculator' },
    { name: 'Atom', icon: Atom, label: 'Science' },
    { name: 'Code', icon: Code, label: 'Code' },
    { name: 'Globe', icon: Globe, label: 'Globe' },
    { name: 'Music', icon: Music, label: 'Music' },
    { name: 'Camera', icon: Camera, label: 'Camera' },
    { name: 'Heart', icon: Heart, label: 'Heart' },
    { name: 'Star', icon: Star, label: 'Star' },
    { name: 'Zap', icon: Zap, label: 'Lightning' }
  ];

  const availableColors = [
    { name: 'from-blue-500 to-blue-600', label: 'Blue', color: '#3B82F6' },
    { name: 'from-purple-500 to-purple-600', label: 'Purple', color: '#8B5CF6' },
    { name: 'from-green-500 to-green-600', label: 'Green', color: '#10B981' },
    { name: 'from-red-500 to-red-600', label: 'Red', color: '#EF4444' },
    { name: 'from-orange-500 to-orange-600', label: 'Orange', color: '#F97316' },
    { name: 'from-pink-500 to-pink-600', label: 'Pink', color: '#EC4899' },
    { name: 'from-indigo-500 to-indigo-600', label: 'Indigo', color: '#6366F1' },
    { name: 'from-teal-500 to-teal-600', label: 'Teal', color: '#14B8A6' },
    { name: 'from-yellow-500 to-yellow-600', label: 'Yellow', color: '#EAB308' },
    { name: 'from-cyan-500 to-cyan-600', label: 'Cyan', color: '#06B6D4' }
  ];

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
      
      // Check if the icon is a custom image (starts with data: or http)
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
      // The service layer will handle icon and color gracefully
      const updatedGroup = await StudyGroupsService.updateGroup(group.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        subject: formData.subject.trim() || null,
        is_public: formData.is_public,
        max_members: formData.max_members,
        // Include icon and color - the service will handle if these columns don't exist
        icon: useCustomImage ? uploadedImage : formData.icon,
        color: formData.color
      } as any);

      // Ensure the icon and color are included in the returned data
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive"
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive"
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
            {/* Delete Confirmation Modal Overlay */}
            {showDeleteConfirm && (
              <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <Card className="border-red-200 bg-red-50 dark:bg-red-900 dark:border-red-800 max-w-md w-full shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-red-800 dark:text-red-300 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Delete Group
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-red-700 dark:text-red-300">
                      This action cannot be undone. This will permanently delete the group and all associated data including:
                    </p>
                    <ul className="list-disc list-inside text-red-700 dark:text-red-300 space-y-1">
                      <li>All group sessions and study materials</li>
                      <li>All member data and progress</li>
                      <li>Group chat history</li>
                      <li>Group notes and documents</li>
                    </ul>
                    
                    <div className="space-y-2">
                      <Label htmlFor="deleteConfirm" className="text-red-800 dark:text-red-300">
                        Type the group name <strong>{group.name}</strong> to confirm:
                      </Label>
                      <Input
                        id="deleteConfirm"
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        placeholder={group.name}
                        disabled={loading}
                        className="border-red-300 focus:border-red-500 dark:border-red-700 dark:focus:border-red-500"
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
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
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

            {/* Appearance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Appearance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Icon Selection */}
                <div className="space-y-3">
                  <Label>Group Icon</Label>
                  
                  {/* Icon Type Toggle */}
                  <div className="flex gap-2 mb-4">
                    <Button
                      type="button"
                      variant={!useCustomImage ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setUseCustomImage(false);
                        setUploadedImage(null);
                      }}
                      disabled={loading}
                    >
                      <Users size={16} className="mr-2" />
                      Icon Library
                    </Button>
                    <Button
                      type="button"
                      variant={useCustomImage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUseCustomImage(true)}
                      disabled={loading}
                    >
                      <Image size={16} className="mr-2" />
                      Custom Image
                    </Button>
                  </div>
                  
                  {!useCustomImage ? (
                    /* Icon Library */
                    <div className="grid grid-cols-6 gap-3">
                      {availableIcons.map((iconOption) => {
                        const IconComponent = iconOption.icon;
                        const isSelected = formData.icon === iconOption.name;
                        return (
                          <button
                            key={iconOption.name}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, icon: iconOption.name }))}
                            className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                            disabled={loading}
                            title={iconOption.label}
                          >
                            <IconComponent 
                              size={20} 
                              className={isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'} 
                            />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* Custom Image Upload */
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="icon-upload"
                            disabled={loading}
                          />
                          <label
                            htmlFor="icon-upload"
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Upload size={16} />
                            Choose Image
                          </label>
                        </div>
                        {uploadedImage && (
                          <div className="w-12 h-12 rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                            <img 
                              src={uploadedImage} 
                              alt="Group icon preview" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Upload an image (max 5MB). Recommended size: 64x64 pixels.
                      </p>
                    </div>
                  )}
                </div>

                {/* Color Selection */}
                <div className="space-y-3">
                  <Label>Background Color</Label>
                  <div className="grid grid-cols-5 gap-3">
                    {availableColors.map((colorOption) => {
                      const isSelected = formData.color === colorOption.name;
                      return (
                        <button
                          key={colorOption.name}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, color: colorOption.name }))}
                          className={`h-12 rounded-lg border-2 transition-all hover:scale-105 ${
                            isSelected 
                              ? 'border-gray-800 dark:border-white shadow-lg' 
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                          }`}
                          style={{ backgroundColor: colorOption.color }}
                          disabled={loading}
                          title={colorOption.label}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Preview */}
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className={`h-20 bg-gradient-to-br ${formData.color} rounded-lg relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="absolute bottom-3 left-3">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                        {useCustomImage && uploadedImage ? (
                          <img 
                            src={uploadedImage} 
                            alt="Group icon" 
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          (() => {
                            const selectedIcon = availableIcons.find(i => i.name === formData.icon);
                            const IconComponent = selectedIcon?.icon || Users;
                            return <IconComponent size={18} className="text-white" />;
                          })()
                        )}
                      </div>
                    </div>
                    <div className="absolute top-3 right-3">
                      <div className="bg-yellow-400 p-1 rounded-full">
                        <Crown size={12} className="text-yellow-800" />
                      </div>
                    </div>
                  </div>
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
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
