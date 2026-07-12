import { useState, useEffect } from 'react';
import { Shield, Eye, Users, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ProfileService } from '@/services/database';

interface PrivacySettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacySettingsPopup = ({ isOpen, onClose }: PrivacySettingsPopupProps) => {
  const [settings, setSettings] = useState({
    profileVisibility: 'friends',
    studyStatsVisible: true,
    onlineStatus: true,
    allowFriendRequests: true,
    showStudyGroups: true,
    showAchievements: true,
    allowDirectMessages: true,
    shareStudyActivity: false,
  });
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const profile = await ProfileService.getCurrentUser();
        if (profile && profile.privacy_settings) {
          setSettings(prev => ({
            ...prev,
            ...profile.privacy_settings
          }));
        }
      } catch (error) {
        console.error('Error loading privacy settings:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelectChange = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await ProfileService.updateProfile({
        privacy_settings: settings
      });
      toast({
        title: "Privacy Settings Updated",
        description: "Your privacy preferences have been saved"
      });
      onClose();
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      toast({
        title: "Error",
        description: "Failed to save privacy settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Shield size={20} className="mr-2" />
            Privacy Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Profile Visibility */}
          <div className="space-y-3">
            <h3 className="flex items-center font-semibold text-gray-800 dark:text-white">
              <Eye size={16} className="mr-2" />
              Profile Visibility
            </h3>
            <div className="ml-6 space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="profileVisibility" className="text-sm">
                  Who can see your profile
                </Label>
                <Select 
                  value={settings.profileVisibility} 
                  onValueChange={(value) => handleSelectChange('profileVisibility', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyone">Everyone</SelectItem>
                    <SelectItem value="friends">Friends Only</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="studyStats" className="text-sm font-medium">
                    Show study statistics
                  </Label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Display study hours, streaks, and achievements
                  </p>
                </div>
                <Switch
                  id="studyStats"
                  checked={settings.studyStatsVisible}
                  onCheckedChange={() => handleToggle('studyStatsVisible')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="achievements" className="text-sm font-medium">
                    Show achievements
                  </Label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Display earned badges and milestones
                  </p>
                </div>
                <Switch
                  id="achievements"
                  checked={settings.showAchievements}
                  onCheckedChange={() => handleToggle('showAchievements')}
                />
              </div>
            </div>
          </div>

          {/* Social Settings */}
          <div className="space-y-3">
            <h3 className="flex items-center font-semibold text-gray-800 dark:text-white">
              <Users size={16} className="mr-2" />
              Social
            </h3>
            <div className="ml-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="onlineStatus" className="text-sm font-medium">
                    Show online status
                  </Label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Let others see when you're online
                  </p>
                </div>
                <Switch
                  id="onlineStatus"
                  checked={settings.onlineStatus}
                  onCheckedChange={() => handleToggle('onlineStatus')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="friendRequests" className="text-sm font-medium">
                    Allow friend requests
                  </Label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Let others send you friend requests
                  </p>
                </div>
                <Switch
                  id="friendRequests"
                  checked={settings.allowFriendRequests}
                  onCheckedChange={() => handleToggle('allowFriendRequests')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="directMessages" className="text-sm font-medium">
                    Allow direct messages
                  </Label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Receive private messages from other users
                  </p>
                </div>
                <Switch
                  id="directMessages"
                  checked={settings.allowDirectMessages}
                  onCheckedChange={() => handleToggle('allowDirectMessages')}
                />
              </div>
            </div>
          </div>

          {/* Study Activity */}
          <div className="space-y-3">
            <h3 className="flex items-center font-semibold text-gray-800 dark:text-white">
              <Lock size={16} className="mr-2" />
              Study Activity
            </h3>
            <div className="ml-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="studyGroups" className="text-sm font-medium">
                    Show study groups
                  </Label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Display which study groups you're in
                  </p>
                </div>
                <Switch
                  id="studyGroups"
                  checked={settings.showStudyGroups}
                  onCheckedChange={() => handleToggle('showStudyGroups')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="shareActivity" className="text-sm font-medium">
                    Share study activity
                  </Label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Let friends see your current study sessions
                  </p>
                </div>
                <Switch
                  id="shareActivity"
                  checked={settings.shareStudyActivity}
                  onCheckedChange={() => handleToggle('shareStudyActivity')}
                />
              </div>
            </div>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading} className="flex-1 bg-blue-500 hover:bg-blue-600">
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};