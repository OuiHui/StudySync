import { useState } from 'react';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileEditPopup } from '@/components/profile/ProfileEditPopup';
import { ChangePasswordPopup } from '@/components/profile/ChangePasswordPopup';
import { NotificationSettingsPopup } from '@/components/profile/NotificationSettingsPopup';
import { PrivacySettingsPopup } from '@/components/profile/PrivacySettingsPopup';
import { DeleteAccountPopup } from '@/components/profile/DeleteAccountPopup';
import { ProfileService } from '@/services/database';
import { useToast } from '@/hooks/use-toast';
import { useProfileData } from '@/hooks/useProfileData';

import { ProfileOverview } from './ProfileOverview';

import { ProfileSettings } from './ProfileSettings';

export const Profile = () => {
  const { toast } = useToast();
  const { user, authLoading, loading, userProfile, setUserProfile } = useProfileData();
  
  const [editOpen, setEditOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false);
  const [privacySettingsOpen, setPrivacySettingsOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  const handleSaveProfile = async (updatedProfile: any) => {
    try {
      await ProfileService.updateProfile({
        display_name: updatedProfile.name,
        bio: updatedProfile.bio
      });
      
      setUserProfile(prev => ({
        ...prev,
        display_name: updatedProfile.name,
        bio: updatedProfile.bio
      }));

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Not Logged In</h2>
          <p className="text-gray-600 dark:text-gray-300">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Profile</h1>
        <Button
          onClick={() => setEditOpen(true)}
          variant="outline"
          size="sm"
          className="gap-1.5 text-sm dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <Edit size={14} />
          Edit
        </Button>
      </div>

      <ProfileOverview profile={userProfile} />



      <ProfileSettings 
        onChangePassword={() => setChangePasswordOpen(true)}
        onNotificationSettings={() => setNotificationSettingsOpen(true)}
        onPrivacySettings={() => setPrivacySettingsOpen(true)}
        onDeleteAccount={() => setDeleteAccountOpen(true)}
      />

      <ProfileEditPopup
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        profile={{
          name: userProfile.display_name,
          email: userProfile.email,
          year: '', 
          bio: userProfile.bio
        }}
        onSave={handleSaveProfile}
      />

      <ChangePasswordPopup isOpen={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
      <NotificationSettingsPopup isOpen={notificationSettingsOpen} onClose={() => setNotificationSettingsOpen(false)} />
      <PrivacySettingsPopup isOpen={privacySettingsOpen} onClose={() => setPrivacySettingsOpen(false)} />
      <DeleteAccountPopup isOpen={deleteAccountOpen} onClose={() => setDeleteAccountOpen(false)} />
    </div>
  );
};
