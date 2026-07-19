import { useState, useEffect } from 'react';
import { Shield, Eye, Users, Lock, X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
      <DialogContent className="max-w-lg w-full bg-white dark:bg-[#1a1f2c] text-gray-900 dark:text-zinc-100 border border-gray-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-2xl overflow-hidden [&>button]:hidden max-h-[85vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-200 dark:border-slate-700/80 shrink-0">
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2a78d6]/10 text-[#2a78d6] flex items-center justify-center flex-shrink-0">
              <Shield size={18} />
            </div>
            Privacy Settings
          </DialogTitle>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-zinc-300 transition-colors border border-gray-200 dark:border-slate-700"
            title="Close"
          >
            <X size={18} />
          </button>
        </DialogHeader>
        
        <div className="space-y-5 py-2 overflow-y-auto flex-1">
          {/* Profile Visibility */}
          <div className="space-y-2.5">
            <h3 className="flex items-center font-bold text-sm text-gray-800 dark:text-zinc-200">
              <Eye size={16} className="mr-2 text-[#2a78d6]" />
              Profile Visibility
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-100 dark:bg-[#12151e] border border-gray-200 dark:border-slate-700/80">
                <Label htmlFor="profileVisibility" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  Who can see your profile
                </Label>
                <Select 
                  value={settings.profileVisibility} 
                  onValueChange={(value) => handleSelectChange('profileVisibility', value)}
                >
                  <SelectTrigger className="w-36 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 h-9 text-xs font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#1a1f2c] border-gray-200 dark:border-slate-700 text-gray-900 dark:text-zinc-200">
                    <SelectItem value="everyone">Everyone</SelectItem>
                    <SelectItem value="friends">Friends Only</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-100 dark:bg-[#12151e] border border-gray-200 dark:border-slate-700/80">
                <div>
                  <Label htmlFor="studyStats" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                    Show study statistics
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                    Display study hours, streaks, and achievements
                  </p>
                </div>
                <Switch
                  id="studyStats"
                  checked={settings.studyStatsVisible}
                  onCheckedChange={() => handleToggle('studyStatsVisible')}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-100 dark:bg-[#12151e] border border-gray-200 dark:border-slate-700/80">
                <div>
                  <Label htmlFor="achievements" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                    Show achievements
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
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
          <div className="space-y-2.5">
            <h3 className="flex items-center font-bold text-sm text-gray-800 dark:text-zinc-200">
              <Users size={16} className="mr-2 text-[#2a78d6]" />
              Social
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-100 dark:bg-[#12151e] border border-gray-200 dark:border-slate-700/80">
                <div>
                  <Label htmlFor="onlineStatus" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                    Show online status
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                    Let others see when you're online
                  </p>
                </div>
                <Switch
                  id="onlineStatus"
                  checked={settings.onlineStatus}
                  onCheckedChange={() => handleToggle('onlineStatus')}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-[#12151e] dark:bg-[#12151e] border border-gray-200 dark:border-slate-700/80">
                <div>
                  <Label htmlFor="friendRequests" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                    Allow friend requests
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                    Let others send you friend requests
                  </p>
                </div>
                <Switch
                  id="friendRequests"
                  checked={settings.allowFriendRequests}
                  onCheckedChange={() => handleToggle('allowFriendRequests')}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-100 dark:bg-[#12151e] border border-gray-200 dark:border-slate-700/80">
                <div>
                  <Label htmlFor="directMessages" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                    Allow direct messages
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
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
          <div className="space-y-2.5">
            <h3 className="flex items-center font-bold text-sm text-gray-800 dark:text-zinc-200">
              <Lock size={16} className="mr-2 text-[#2a78d6]" />
              Study Activity
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-100 dark:bg-[#12151e] border border-gray-200 dark:border-slate-700/80">
                <div>
                  <Label htmlFor="studyGroups" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                    Show study groups
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                    Display which study groups you're in
                  </p>
                </div>
                <Switch
                  id="studyGroups"
                  checked={settings.showStudyGroups}
                  onCheckedChange={() => handleToggle('showStudyGroups')}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-100 dark:bg-[#12151e] border border-gray-200 dark:border-slate-700/80">
                <div>
                  <Label htmlFor="shareActivity" className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                    Share study activity
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
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
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-200 dark:border-slate-700/80 shrink-0">
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
            onClick={handleSave}
            disabled={loading}
            className="bg-[#2a78d6] hover:bg-[#2268bc] text-white rounded-xl px-5 h-10 text-sm font-semibold disabled:opacity-50 flex items-center justify-center transition-all duration-200"
          >
            {loading ? <Loader2 size={14} className="mr-2 animate-spin" /> : null}
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};