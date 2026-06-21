import { Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ProfileSettingsProps {
  onChangePassword: () => void;
  onNotificationSettings: () => void;
  onPrivacySettings: () => void;
  onDeleteAccount: () => void;
}

export const ProfileSettings = ({ onChangePassword, onNotificationSettings, onPrivacySettings, onDeleteAccount }: ProfileSettingsProps) => {
  return (
    <Card className="border-0 shadow-md dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center text-gray-800 dark:text-white">
          <Settings size={20} className="mr-2" />
          Account Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            onClick={onChangePassword}
          >
            Change Password
          </Button>
          <Button 
            variant="outline" 
            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            onClick={onNotificationSettings}
          >
            Notification Settings
          </Button>
          <Button 
            variant="outline" 
            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            onClick={onPrivacySettings}
          >
            Privacy Settings
          </Button>
          <Button 
            variant="outline" 
            className="text-red-600 border-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20"
            onClick={onDeleteAccount}
          >
            Delete Account
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
