import { useState, useEffect } from 'react';
import { User, Mail, Calendar, BookOpen, Users, Settings, Edit, Trophy, Star, Target, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProfileEditPopup } from '@/components/profile/ProfileEditPopup';
import { ChangePasswordPopup } from '@/components/profile/ChangePasswordPopup';
import { NotificationSettingsPopup } from '@/components/profile/NotificationSettingsPopup';
import { PrivacySettingsPopup } from '@/components/profile/PrivacySettingsPopup';
import { DeleteAccountPopup } from '@/components/profile/DeleteAccountPopup';
import { FriendsSection } from '@/components/profile/FriendsSection';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileService } from '@/services/database';
import { useToast } from '@/hooks/use-toast';

export const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false);
  const [privacySettingsOpen, setPrivacySettingsOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [userProfile, setUserProfile] = useState({
    id: '',
    display_name: '',
    email: '',
    bio: '',
    avatar_url: '',
    created_at: '',
    updated_at: ''
  });

  const [userStats, setUserStats] = useState({
    studyHours: 0,
    groupsJoined: 0,
    notesShared: 0,
    studyStreak: 0,
    totalSessions: 0
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // Load user profile and stats
  useEffect(() => {
    const loadUserData = async () => {
      if (!user || authLoading) return;

      try {
        setLoading(true);
        
        // Load user profile
        const profile = await ProfileService.getCurrentUser();
        if (profile) {
          setUserProfile({
            id: profile.id,
            display_name: profile.display_name || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            bio: profile.bio || '',
            avatar_url: profile.avatar_url || '',
            created_at: profile.created_at,
            updated_at: profile.updated_at
          });
        } else {
          // Set defaults from auth user
          setUserProfile({
            id: user.id,
            display_name: user.email?.split('@')[0] || 'User',
            email: user.email || '',
            bio: '',
            avatar_url: '',
            created_at: user.created_at || new Date().toISOString(),
            updated_at: user.updated_at || new Date().toISOString()
          });
        }

        // Load user stats
        const stats = await ProfileService.getUserStats();
        setUserStats(stats);

        // Load recent activity
        const activity = await ProfileService.getRecentActivity();
        setRecentActivity(activity);

      } catch (error) {
        console.error('Error loading user data:', error);
        toast({
          title: "Error Loading Profile",
          description: "Failed to load profile data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user, authLoading, toast]);

  // Helper functions
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Calculate user level based on stats
  const getUserLevel = () => {
    if (userStats.studyHours >= 100) return 'Expert';
    if (userStats.studyHours >= 50) return 'Advanced';
    if (userStats.studyHours >= 20) return 'Intermediate';
    return 'Beginner';
  };

  const getUserPoints = () => {
    return userStats.studyHours * 10 + userStats.groupsJoined * 50 + userStats.notesShared * 25 + userStats.studyStreak * 15;
  };

  const achievements = [
    { id: '1', title: 'Study Streak', description: `${userStats.studyStreak} days consecutive`, icon: '🔥', earned: userStats.studyStreak > 0 },
    { id: '2', title: 'Note Sharer', description: `Shared ${userStats.notesShared}+ notes`, icon: '📚', earned: userStats.notesShared >= 5 },
    { id: '3', title: 'Group Member', description: `Joined ${userStats.groupsJoined} groups`, icon: '�', earned: userStats.groupsJoined >= 2 },
    { id: '4', title: 'Study Master', description: `${userStats.studyHours} hours studied`, icon: '⏰', earned: userStats.studyHours >= 50 },
    { id: '5', title: 'Session Starter', description: `${userStats.totalSessions} sessions created`, icon: '🎯', earned: userStats.totalSessions >= 10 },
    { id: '6', title: 'Collaboration Expert', description: 'Join 5+ groups', icon: '🤝', earned: userStats.groupsJoined >= 5 },
  ];

  const studyStats = [
    { label: 'Study Hours', value: userStats.studyHours, icon: Clock, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Groups Joined', value: userStats.groupsJoined, icon: Users, color: 'text-green-600 dark:text-green-400' },
    { label: 'Notes Shared', value: userStats.notesShared, icon: BookOpen, color: 'text-purple-600 dark:text-purple-400' },
    { label: 'Study Streak', value: `${userStats.studyStreak} days`, icon: Star, color: 'text-orange-600 dark:text-orange-400' }
  ];

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Profile</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Manage your account and track your progress</p>
        </div>
        <Button onClick={() => setEditOpen(true)} className="bg-blue-500 hover:bg-blue-600 text-white">
          <Edit size={16} className="mr-2" />
          Edit Profile
        </Button>
      </div>

      {/* Profile Overview */}
      <Card className="border-0 shadow-md dark:bg-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center">
              {userProfile.avatar_url ? (
                <img 
                  src={userProfile.avatar_url} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white text-2xl font-bold">
                  {getInitials(userProfile.display_name)}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{userProfile.display_name}</h2>
              <p className="text-gray-600 dark:text-gray-300 flex items-center mt-1">
                <Mail size={16} className="mr-2" />
                {userProfile.email}
              </p>
              <p className="text-gray-600 dark:text-gray-300 flex items-center mt-1">
                <Calendar size={16} className="mr-2" />
                Joined {formatJoinDate(userProfile.created_at)}
              </p>
              <div className="mt-3 flex items-center space-x-4">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-sm rounded-full">
                  {getUserLevel()}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {getUserPoints()} points
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-gray-700 dark:text-gray-300">
              {userProfile.bio || 'No bio provided yet.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Study Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {studyStats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Card key={stat.label} className="border-0 shadow-md dark:bg-gray-800">
              <CardContent className="p-4 text-center">
                <IconComponent size={24} className={`mx-auto mb-2 ${stat.color}`} />
                <div className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{stat.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Achievements */}
        <Card className="border-0 shadow-md dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-800 dark:text-white">
              <Trophy size={20} className="mr-2 text-yellow-500" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {achievements.map((achievement) => (
                <div 
                  key={achievement.id} 
                  className={`p-3 rounded-lg border-2 transition-all ${
                    achievement.earned 
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' 
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 opacity-60'
                  }`}
                >
                  <div className="text-2xl mb-1">{achievement.icon}</div>
                  <h4 className={`font-medium text-sm ${
                    achievement.earned 
                      ? 'text-yellow-800 dark:text-yellow-200' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {achievement.title}
                  </h4>
                  <p className={`text-xs ${
                    achievement.earned 
                      ? 'text-yellow-600 dark:text-yellow-300' 
                      : 'text-gray-500 dark:text-gray-500'
                  }`}>
                    {achievement.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 shadow-md dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-800 dark:text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.type === 'study' ? 'bg-blue-100 dark:bg-blue-800' :
                    activity.type === 'share' ? 'bg-green-100 dark:bg-green-800' :
                    activity.type === 'join' ? 'bg-purple-100 dark:bg-purple-800' :
                    'bg-orange-100 dark:bg-orange-800'
                  }`}>
                    {activity.type === 'study' && <Clock size={16} className="text-blue-600 dark:text-blue-300" />}
                    {activity.type === 'share' && <BookOpen size={16} className="text-green-600 dark:text-green-300" />}
                    {activity.type === 'join' && <Users size={16} className="text-purple-600 dark:text-purple-300" />}
                    {activity.type === 'create' && <Target size={16} className="text-orange-600 dark:text-orange-300" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-white">{activity.action}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Friends Section */}
      <FriendsSection />

      {/* Settings Section */}
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
              onClick={() => setChangePasswordOpen(true)}
            >
              Change Password
            </Button>
            <Button 
              variant="outline" 
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              onClick={() => setNotificationSettingsOpen(true)}
            >
              Notification Settings
            </Button>
            <Button 
              variant="outline" 
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              onClick={() => setPrivacySettingsOpen(true)}
            >
              Privacy Settings
            </Button>
            <Button 
              variant="outline" 
              className="text-red-600 border-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20"
              onClick={() => setDeleteAccountOpen(true)}
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Popup */}
      <ProfileEditPopup
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        profile={{
          name: userProfile.display_name,
          email: userProfile.email,
          year: '', // This can be added to the profile schema later
          bio: userProfile.bio
        }}
        onSave={handleSaveProfile}
      />

      {/* Other Settings Popups */}
      <ChangePasswordPopup
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
      
      <NotificationSettingsPopup
        isOpen={notificationSettingsOpen}
        onClose={() => setNotificationSettingsOpen(false)}
      />
      
      <PrivacySettingsPopup
        isOpen={privacySettingsOpen}
        onClose={() => setPrivacySettingsOpen(false)}
      />
      
      <DeleteAccountPopup
        isOpen={deleteAccountOpen}
        onClose={() => setDeleteAccountOpen(false)}
      />
    </div>
  );
};
