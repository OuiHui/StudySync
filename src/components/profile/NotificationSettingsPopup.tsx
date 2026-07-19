import { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Calendar, Settings, X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ProfileService } from '@/services/database';

interface NotificationSettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettingsPopup = ({ isOpen, onClose }: NotificationSettingsPopupProps) => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    studyReminders: true,
    groupMessages: true,
    sessionInvites: true,
    weeklyDigest: false,
    friendRequests: true,
    systemUpdates: false,
  });
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const profile = await ProfileService.getCurrentUser();
        if (profile && profile.notification_settings) {
          setSettings(prev => ({
            ...prev,
            ...profile.notification_settings
          }));
        }
      } catch (error) {
        console.error('Error loading notification settings:', error);
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

  const handleSave = async () => {
    try {
      setLoading(true);
      await ProfileService.updateProfile({
        notification_settings: settings
      });
      toast({
        title: "Settings Saved",
        description: "Your notification preferences have been updated"
      });
      onClose();
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast({
        title: "Error",
        description: "Failed to save notification settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const notificationCategories = [
    {
      title: "Study & Learning",
      icon: Calendar,
      settings: [
        { key: 'studyReminders', label: 'Study session reminders', description: 'Get notified before scheduled study sessions' },
        { key: 'sessionInvites', label: 'Session invitations', description: 'Receive invites to join study groups' },
      ]
    },
    {
      title: "Social",
      icon: MessageSquare,
      settings: [
        { key: 'groupMessages', label: 'Group messages', description: 'Notifications for new messages in study groups' },
        { key: 'friendRequests', label: 'Friend requests', description: 'Get notified of new friend requests' },
      ]
    },
    {
      title: "Communication",
      icon: Mail,
      settings: [
        { key: 'emailNotifications', label: 'Email notifications', description: 'Receive notifications via email' },
        { key: 'pushNotifications', label: 'Push notifications', description: 'Browser push notifications' },
      ]
    },
    {
      title: "Digest & Updates",
      icon: Settings,
      settings: [
        { key: 'weeklyDigest', label: 'Weekly digest', description: 'Summary of your study activities' },
        { key: 'systemUpdates', label: 'System updates', description: 'Information about new features and updates' },
      ]
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full bg-white dark:bg-[#1a1f2c] text-gray-900 dark:text-zinc-100 border border-gray-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-2xl overflow-hidden [&>button]:hidden max-h-[85vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-200 dark:border-slate-700/80 shrink-0">
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2a78d6]/10 text-[#2a78d6] flex items-center justify-center flex-shrink-0">
              <Bell size={18} />
            </div>
            Notification Settings
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
          {notificationCategories.map((category) => {
            const IconComponent = category.icon;
            return (
              <div key={category.title} className="space-y-2.5">
                <h3 className="flex items-center font-bold text-sm text-gray-800 dark:text-zinc-200">
                  <IconComponent size={16} className="mr-2 text-[#2a78d6]" />
                  {category.title}
                </h3>
                <div className="space-y-2">
                  {category.settings.map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between p-3 rounded-xl bg-gray-100 dark:bg-[#12151e] border border-gray-200 dark:border-slate-700/80 gap-3">
                      <div className="flex-1">
                        <Label htmlFor={setting.key} className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                          {setting.label}
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                          {setting.description}
                        </p>
                      </div>
                      <Switch
                        id={setting.key}
                        checked={settings[setting.key as keyof typeof settings]}
                        onCheckedChange={() => handleToggle(setting.key as keyof typeof settings)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
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