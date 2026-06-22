import { supabase } from '@/integrations/supabase/client';
import { checkAuth, handleDbError, StudyGroup, StudySession, Note, User, GroupMember, SessionParticipant, Friendship, Message, Conversation } from './utils';

export class ProfileService {
  static async getCurrentUser() {
    try {
      const session = await checkAuth();
      if (!session) {
        return null;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching current user:', error);
        
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating new profile...');
          try {
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                user_id: session.user.id,
                display_name: session.user.email?.split('@')[0] || 'User',
                bio: null,
                avatar_url: null
              })
              .select()
              .single();

            if (createError) {
              console.error('Error creating profile:', createError);
              return null;
            }

            return newProfile;
          } catch (createError) {
            console.error('Exception creating profile:', createError);
            return null;
          }
        }
        
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  }

  static async getUserStats() {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to fetch user stats');
      }

      const userId = session.user.id;

      // Get user's group memberships count
      const { data: groupMemberships, error: groupError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId);

      if (groupError) {
        console.error('Error fetching group memberships:', groupError);
      }

      // Get user's notes count
      const { data: notes, error: notesError } = await supabase
        .from('notes')
        .select('id')
        .eq('created_by', userId);

      if (notesError) {
        console.error('Error fetching notes count:', notesError);
      }

      // Get user's study sessions count and calculate hours
      const { data: sessions, error: sessionsError } = await supabase
        .from('study_sessions')
        .select('scheduled_start, scheduled_end, actual_start, actual_end, created_at')
        .eq('created_by', userId);

      if (sessionsError) {
        console.error('Error fetching study sessions:', sessionsError);
      }

      // Calculate study hours from sessions
      const studyHours = this.calculateStudyHours(sessions || []);

      // Calculate study streak (simplified - consecutive days with sessions)
      const studyStreak = this.calculateStudyStreak(sessions || []);

      return {
        groupsJoined: groupMemberships?.length || 0,
        notesShared: notes?.length || 0,
        studyHours,
        studyStreak,
        totalSessions: sessions?.length || 0
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      handleDbError(error, 'fetch user stats');
      return {
        groupsJoined: 0,
        notesShared: 0,
        studyHours: 0,
        studyStreak: 0,
        totalSessions: 0
      };
    }
  }

  static calculateStudyHours(sessions: any[]): number {
    if (!sessions || sessions.length === 0) return 0;

    let totalMinutes = 0;
    
    sessions.forEach(session => {
      // Use actual times if available, otherwise use scheduled times
      const startTime = session.actual_start || session.scheduled_start;
      const endTime = session.actual_end || session.scheduled_end;
      
      if (startTime && endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const minutes = (end.getTime() - start.getTime()) / (1000 * 60);
        totalMinutes += Math.max(0, minutes);
      }
    });

    return Math.floor(totalMinutes / 60);
  }

  static calculateStudyStreak(sessions: any[]) {
    if (!sessions || sessions.length === 0) return 0;

    // Sort sessions by date (newest first)
    const sortedSessions = sessions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    // Get unique study dates
    const studyDates = [...new Set(sortedSessions.map(session => 
      new Date(session.created_at).toDateString()
    ))];

    if (studyDates.length === 0) return 0;

    // Check if today has a study session
    const today = new Date().toDateString();
    const hasStudiedToday = studyDates.includes(today);
    
    // Start from yesterday if no study today, otherwise start from today
    let checkDate = new Date();
    if (!hasStudiedToday) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    let streak = 0;
    
    // Count consecutive days
    while (true) {
      const dateString = checkDate.toDateString();
      if (studyDates.includes(dateString)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  static async getRecentActivity() {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to fetch recent activity');
      }

      const userId = session.user.id;
      const activities = [];

      // Get recent study sessions
      const { data: recentSessions, error: sessionsError } = await supabase
        .from('study_sessions')
        .select('id, created_at, title')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!sessionsError && recentSessions) {
        recentSessions.forEach(session => {
          activities.push({
            id: `session-${session.id}`,
            action: `Completed study session${session.title ? ` - ${session.title}` : ''}`,
            time: this.formatTimeAgo(session.created_at),
            type: 'study'
          });
        });
      }

      // Get recent notes
      const { data: recentNotes, error: notesError } = await supabase
        .from('notes')
        .select('id, created_at, title')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (!notesError && recentNotes) {
        recentNotes.forEach(note => {
          activities.push({
            id: `note-${note.id}`,
            action: `Shared note${note.title ? ` - ${note.title}` : ''}`,
            time: this.formatTimeAgo(note.created_at),
            type: 'share'
          });
        });
      }

      // Get recent group memberships
      const { data: recentMemberships, error: membershipsError } = await supabase
        .from('group_members')
        .select('id, joined_at, study_groups(name)')
        .eq('user_id', userId)
        .order('joined_at', { ascending: false })
        .limit(3);

      if (!membershipsError && recentMemberships) {
        recentMemberships.forEach(membership => {
          activities.push({
            id: `membership-${membership.id}`,
            action: `Joined ${(membership.study_groups as any)?.name || 'group'}`,
            time: this.formatTimeAgo(membership.joined_at),
            type: 'join'
          });
        });
      }

      // Sort all activities by time and return top 4
      activities.sort((a, b) => {
        const timeA = this.parseTimeAgo(a.time);
        const timeB = this.parseTimeAgo(b.time);
        return timeA - timeB;
      });

      return activities.slice(0, 4);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }

  static formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  }

  static parseTimeAgo(timeString: string): number {
    if (timeString === 'Just now') return 0;
    
    const match = timeString.match(/(\d+)\s+(minute|hour|day|month|year)s?\s+ago/);
    if (!match) return 0;

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'minute': return value * 60;
      case 'hour': return value * 3600;
      case 'day': return value * 86400;
      case 'month': return value * 2592000;
      case 'year': return value * 31536000;
      default: return 0;
    }
  }

  static async updateProfile(updates: any) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to update profile');
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (error) {
        handleDbError(error, 'update profile');
      }

      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  static async getStudyHoursToday() {
    try {
      const session = await checkAuth();
      if (!session) {
        return 0;
      }

      const userId = session.user.id;
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

      // Get today's completed sessions
      const { data: sessions, error } = await supabase
        .from('study_sessions')
        .select('scheduled_start, scheduled_end, actual_start, actual_end, status')
        .eq('created_by', userId)
        .eq('status', 'completed')
        .gte('scheduled_start', todayStart.toISOString())
        .lt('scheduled_start', todayEnd.toISOString());

      if (error) {
        console.error('Error fetching today\'s sessions:', error);
        return 0;
      }

      // Calculate actual study hours for today
      let todayHours = 0;
      (sessions || []).forEach(session => {
        if (session.actual_start && session.actual_end) {
          const duration = new Date(session.actual_end).getTime() - new Date(session.actual_start).getTime();
          todayHours += duration / (1000 * 60 * 60); // Convert to hours
        } else if (session.scheduled_start && session.scheduled_end) {
          const duration = new Date(session.scheduled_end).getTime() - new Date(session.scheduled_start).getTime();
          todayHours += duration / (1000 * 60 * 60); // Convert to hours
        }
      });

      return Math.round(todayHours * 10) / 10; // Round to 1 decimal place
    } catch (error) {
      console.error('Error calculating today\'s study hours:', error);
      return 0;
    }
  }

  static async getStudyHoursThisWeek() {
    try {
      const session = await checkAuth();
      if (!session) {
        return 0;
      }

      const userId = session.user.id;
      const today = new Date();
      const weekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Get this week's completed sessions
      const { data: sessions, error } = await supabase
        .from('study_sessions')
        .select('scheduled_start, scheduled_end, actual_start, actual_end, status')
        .eq('created_by', userId)
        .eq('status', 'completed')
        .gte('scheduled_start', weekStart.toISOString())
        .lt('scheduled_start', weekEnd.toISOString());

      if (error) {
        console.error('Error fetching this week\'s sessions:', error);
        return 0;
      }

      // Calculate actual study hours for this week
      let weekHours = 0;
      (sessions || []).forEach(session => {
        if (session.actual_start && session.actual_end) {
          const duration = new Date(session.actual_end).getTime() - new Date(session.actual_start).getTime();
          weekHours += duration / (1000 * 60 * 60); // Convert to hours
        } else if (session.scheduled_start && session.scheduled_end) {
          const duration = new Date(session.scheduled_end).getTime() - new Date(session.scheduled_start).getTime();
          weekHours += duration / (1000 * 60 * 60); // Convert to hours
        }
      });

      return Math.round(weekHours * 10) / 10; // Round to 1 decimal place
    } catch (error) {
      console.error('Error calculating this week\'s study hours:', error);
      return 0;
    }
  }
}

