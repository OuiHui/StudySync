import { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Calendar, X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ProfileService } from '@/services/database';
import { NotificationSettings } from '@/hooks/useProfileData';

interface NotificationSettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess?: () => void;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  emailNotifications: true,
  pushNotifications: true,
  studyReminders: true,
  groupMessages: true,
  sessionInvites: true,
  friendRequests: true,
};

export const NotificationSettingsPopup = ({ isOpen, onClose, onSaveSuccess }: NotificationSettingsPopupProps) => {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const profile = await ProfileService.getCurrentUser();
        const prof = profile as any;
        if (prof && prof.notification_settings) {
          setSettings({
            ...DEFAULT_SETTINGS,
            ...prof.notification_settings
          });
        }
      } catch (error) {
        console.error('Error loading notification settings:', error);
      }
    };

    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const handleToggle = (key: keyof NotificationSettings) => {
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
        description: "Your notification preferences have been updated."
      });
      if (onSaveSuccess) {
        onSaveSuccess();
      }
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
        { key: 'studyReminders' as keyof NotificationSettings, label: 'Study session reminders', description: 'Get notified before scheduled study sessions' },
        { key: 'sessionInvites' as keyof NotificationSettings, label: 'Session invitations', description: 'Receive invites to join study groups' },
      ]
    },
    {
      title: "Social",
      icon: MessageSquare,
      settings: [
        { key: 'groupMessages' as keyof NotificationSettings, label: 'Group messages', description: 'Notifications for new messages in study groups' },
        { key: 'friendRequests' as keyof NotificationSettings, label: 'Friend requests', description: 'Get notified of new friend requests' },
      ]
    },
    {
      title: "Communication",
      icon: Mail,
      settings: [
        { key: 'emailNotifications' as keyof NotificationSettings, label: 'Email notifications', description: 'Receive notifications via email' },
        { key: 'pushNotifications' as keyof NotificationSettings, label: 'Push notifications', description: 'Browser push notifications' },
      ]
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full bg-popover text-popover-foreground border border-border rounded-2xl p-6 shadow-2xl overflow-hidden [&>button]:hidden max-h-[85vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border shrink-0">
          <DialogTitle className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
              <Bell size={18} />
            </div>
            Notification Settings
          </DialogTitle>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
                <h3 className="flex items-center font-bold text-sm text-foreground">
                  <IconComponent size={16} className="mr-2 text-brand" />
                  {category.title}
                </h3>
                <div className="space-y-2">
                  {category.settings.map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between p-3 rounded-xl bg-muted/60 border border-border gap-3">
                      <div className="flex-1">
                        <Label htmlFor={setting.key} className="text-sm font-semibold text-foreground">
                          {setting.label}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
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

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="bg-card hover:bg-muted text-foreground border border-border rounded-xl px-4 h-10 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="bg-brand hover:bg-brand-hover text-white rounded-xl px-5 h-10 text-sm font-semibold disabled:opacity-50 flex items-center justify-center transition-all duration-200"
          >
            {loading ? <Loader2 size={14} className="mr-2 animate-spin" /> : null}
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};