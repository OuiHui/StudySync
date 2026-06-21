import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileService } from '@/services/database';

export interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  bio: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  studyHours: number;
  groupsJoined: number;
  notesShared: number;
  studyStreak: number;
  totalSessions: number;
}

export const useProfileData = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: '',
    display_name: '',
    email: '',
    bio: '',
    avatar_url: '',
    created_at: '',
    updated_at: ''
  });

  const [userStats, setUserStats] = useState<UserStats>({
    studyHours: 0,
    groupsJoined: 0,
    notesShared: 0,
    studyStreak: 0,
    totalSessions: 0
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const loadUserData = async () => {
      if (!user || authLoading) return;

      try {
        setLoading(true);
        
        const [profileResult, statsResult, activityResult] = await Promise.allSettled([
          ProfileService.getCurrentUser(),
          ProfileService.getUserStats(),
          ProfileService.getRecentActivity()
        ]);

        if (profileResult.status === 'fulfilled' && profileResult.value) {
          const profile = profileResult.value;
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

        if (statsResult.status === 'fulfilled') {
          setUserStats(statsResult.value);
        }

        if (activityResult.status === 'fulfilled') {
          setRecentActivity(activityResult.value);
        }

      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user, authLoading]);

  return { 
    user, 
    authLoading, 
    loading, 
    userProfile, 
    setUserProfile, 
    userStats, 
    recentActivity 
  };
};
