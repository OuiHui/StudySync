
import { useState } from 'react';
import { User, Mail, Calendar, BookOpen, Users, Settings, Edit, Trophy, Star, Target, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProfileEditPopup } from '@/components/profile/ProfileEditPopup';
import { ChangePasswordPopup } from '@/components/profile/ChangePasswordPopup';
import { NotificationSettingsPopup } from '@/components/profile/NotificationSettingsPopup';
import { PrivacySettingsPopup } from '@/components/profile/PrivacySettingsPopup';
import { DeleteAccountPopup } from '@/components/profile/DeleteAccountPopup';

export const Profile = () => {
  const [editOpen, setEditOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false);
  const [privacySettingsOpen, setPrivacySettingsOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  const [userProfile, setUserProfile] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    joinDate: 'January 2024',
    studyHours: 156,
    groupsJoined: 4,
    notesShared: 23,
    avatar: 'JD',
    bio: 'Computer Science student passionate about collaborative learning and helping others succeed in their academic journey.',
    studyStreak: 15,
    level: 'Advanced Learner',
    points: 2450,
    year: 'Senior' // Adding missing year property
  });

  const achievements = [
    { id: '1', title: 'Study Streak', description: '15 days consecutive', icon: '🔥', earned: true },
    { id: '2', title: 'Note Sharer', description: 'Shared 20+ notes', icon: '📚', earned: true },
    { id: '3', title: 'Group Leader', description: 'Admin of 2 groups', icon: '👑', earned: true },
    { id: '4', title: 'Early Bird', description: 'Study before 8 AM', icon: '🌅', earned: false },
    { id: '5', title: 'Night Owl', description: 'Study after 10 PM', icon: '🦉', earned: true },
    { id: '6', title: 'Collaboration Master', description: 'Join 5+ groups', icon: '🤝', earned: false },
  ];

  const recentActivity = [
    { id: '1', action: 'Completed study session', time: '2 hours ago', type: 'study' },
    { id: '2', action: 'Shared notes in Advanced Math', time: '5 hours ago', type: 'share' },
    { id: '3', action: 'Joined Physics Study Circle', time: '1 day ago', type: 'join' },
    { id: '4', action: 'Created new study group', time: '2 days ago', type: 'create' }
  ];

  const studyStats = [
    { label: 'Study Hours', value: userProfile.studyHours, icon: Clock, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Groups Joined', value: userProfile.groupsJoined, icon: Users, color: 'text-green-600 dark:text-green-400' },
    { label: 'Notes Shared', value: userProfile.notesShared, icon: BookOpen, color: 'text-purple-600 dark:text-purple-400' },
    { label: 'Study Streak', value: `${userProfile.studyStreak} days`, icon: Star, color: 'text-orange-600 dark:text-orange-400' }
  ];

  const handleSaveProfile = (updatedProfile: any) => {
    setUserProfile(prev => ({ ...prev, ...updatedProfile }));
  };

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
              <span className="text-white text-2xl font-bold">{userProfile.avatar}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{userProfile.name}</h2>
              <p className="text-gray-600 dark:text-gray-300 flex items-center mt-1">
                <Mail size={16} className="mr-2" />
                {userProfile.email}
              </p>
              <p className="text-gray-600 dark:text-gray-300 flex items-center mt-1">
                <Calendar size={16} className="mr-2" />
                Joined {userProfile.joinDate}
              </p>
              <div className="mt-3 flex items-center space-x-4">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-sm rounded-full">
                  {userProfile.level}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {userProfile.points} points
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-gray-700 dark:text-gray-300">{userProfile.bio}</p>
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
          name: userProfile.name,
          email: userProfile.email,
          year: userProfile.year,
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
