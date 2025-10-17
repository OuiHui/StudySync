import { useState } from 'react';
import { Bell, Mail, MessageSquare, Calendar, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

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

  const { toast } = useToast();

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your notification preferences have been updated"
    });
    onClose();
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
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Bell size={20} className="mr-2" />
            Notification Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {notificationCategories.map((category) => {
            const IconComponent = category.icon;
            return (
              <div key={category.title} className="space-y-3">
                <h3 className="flex items-center font-semibold text-gray-800 dark:text-white">
                  <IconComponent size={16} className="mr-2" />
                  {category.title}
                </h3>
                <div className="space-y-3 ml-6">
                  {category.settings.map((setting) => (
                    <div key={setting.key} className="flex items-start justify-between space-x-3">
                      <div className="flex-1">
                        <Label htmlFor={setting.key} className="text-sm font-medium">
                          {setting.label}
                        </Label>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
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

          <div className="flex space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-blue-500 hover:bg-blue-600">
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};