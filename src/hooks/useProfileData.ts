import { useQuery } from '@tanstack/react-query';
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

export interface ProfileData {
  userProfile: UserProfile;
  userStats: UserStats;
  recentActivity: any[];
}

export const getProfileQueryOptions = (user: any, authLoading: boolean) => ({
  queryKey: ['profile', user?.id],
  queryFn: async () => {
    if (!user) throw new Error('User not authenticated');

    const [profileResult, statsResult, activityResult] = await Promise.allSettled([
      ProfileService.getCurrentUser(),
      ProfileService.getUserStats(),
      ProfileService.getRecentActivity()
    ]);

    let userProfile: UserProfile = {
      id: user.id,
      display_name: user.email?.split('@')[0] || 'User',
      email: user.email || '',
      bio: '',
      avatar_url: '',
      created_at: user.created_at || new Date().toISOString(),
      updated_at: user.updated_at || new Date().toISOString()
    };

    if (profileResult.status === 'fulfilled' && profileResult.value) {
      const profile = profileResult.value;
      userProfile = {
        id: profile.id,
        display_name: profile.display_name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || '',
        created_at: profile.created_at,
        updated_at: profile.updated_at
      };
    }

    let userStats: UserStats = {
      studyHours: 0,
      groupsJoined: 0,
      notesShared: 0,
      studyStreak: 0,
      totalSessions: 0
    };

    if (statsResult.status === 'fulfilled') {
      userStats = statsResult.value;
    }

    let recentActivity: any[] = [];
    if (activityResult.status === 'fulfilled') {
      recentActivity = activityResult.value;
    }

    return { userProfile, userStats, recentActivity };
  },
  enabled: !!user && !authLoading,
  staleTime: 5 * 60 * 1000,
});

export const useProfileData = () => {
  const { user, loading: authLoading } = useAuth();

  const { data, isLoading: queryLoading, refetch } = useQuery<ProfileData>(getProfileQueryOptions(user, authLoading));

  const setUserProfile = (newProfile: UserProfile) => {
    // This assumes the calling code updates the profile on the server.
    // To refresh locally:
    refetch();
  };

  return { 
    user, 
    authLoading, 
    loading: authLoading || queryLoading, 
    userProfile: data?.userProfile || {
      id: '',
      display_name: '',
      email: '',
      bio: '',
      avatar_url: '',
      created_at: '',
      updated_at: ''
    }, 
    setUserProfile, 
    userStats: data?.userStats || {
      studyHours: 0,
      groupsJoined: 0,
      notesShared: 0,
      studyStreak: 0,
      totalSessions: 0
    }, 
    recentActivity: data?.recentActivity || []
  };
};
