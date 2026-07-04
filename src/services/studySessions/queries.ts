import { supabase } from '@/integrations/supabase/client';
import { checkAuth } from '../utils';

export class StudySessionsQueries {
  static async getSessions() {
    try {
      const session = await checkAuth();
      if (!session) {
        return [];
      }

      const userId = session.user.id;

      // Get sessions the user created OR sessions they're participating in
      // First get sessions the user created
      const { data: createdSessions, error: createdError } = await supabase
        .from('study_sessions')
        .select(`
          *,
          study_groups (
            id,
            name,
            subject
          )
        `)
        .eq('created_by', userId)
        .order('scheduled_start', { ascending: true });

      if (createdError) {
        console.error('Error fetching created sessions:', createdError);
      }

      // Get sessions the user is participating in
      const { data: participations, error: participationError } = await supabase
        .from('session_participants')
        .select('session_id')
        .eq('user_id', userId);

      let participatedSessions = [];
      if (!participationError && participations && participations.length > 0) {
        const sessionIds = participations.map(p => p.session_id);
        const { data: sessions, error: sessionsError } = await supabase
          .from('study_sessions')
          .select(`
            *,
            study_groups (
              id,
              name,
              subject
            )
          `)
          .in('id', sessionIds)
          .order('scheduled_start', { ascending: true });

        if (!sessionsError) {
          participatedSessions = sessions || [];
        }
      }

      // Get sessions from groups the user is a member of
      const { data: groupMemberships, error: membershipError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId);

      let groupSessions = [];
      if (!membershipError && groupMemberships && groupMemberships.length > 0) {
        const groupIds = groupMemberships.map(m => m.group_id);
        const { data: sessions, error: groupSessionsError } = await supabase
          .from('study_sessions')
          .select(`
            *,
            study_groups (
              id,
              name,
              subject
            )
          `)
          .in('group_id', groupIds)
          .order('scheduled_start', { ascending: true });

        if (!groupSessionsError) {
          groupSessions = sessions || [];
        }
      }

      // Combine all sessions and remove duplicates
      const allSessions = [
        ...(createdSessions || []),
        ...participatedSessions,
        ...groupSessions
      ];

      // Remove duplicates by session ID
      const uniqueSessions = allSessions.filter((session, index, self) => 
        index === self.findIndex(s => s.id === session.id)
      );

      if (!uniqueSessions || uniqueSessions.length === 0) return [];

      const sessionIdsForParticipants = uniqueSessions.map(s => s.id);
      const { data: allParticipants } = await supabase
        .from('session_participants')
        .select('session_id, user_id')
        .in('session_id', sessionIdsForParticipants);

      const userIds = [...new Set(allParticipants?.map(p => p.user_id) || [])];
      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url, user_id')
          .in('user_id', userIds);
        profiles = profilesData || [];
      }

      const isAutomation = typeof window !== 'undefined' && window.navigator.webdriver;

      const sessionsWithParticipants = uniqueSessions
        .filter(studySession => {
          if (!isAutomation && studySession.title === 'E2E Session') {
            return false;
          }
          return true;
        })
        .map((studySession) => {
          const sessionParts = allParticipants?.filter(p => p.session_id === studySession.id) || [];
          const participantProfiles = sessionParts.map(sp => {
            const profile = profiles.find(p => p.user_id === sp.user_id);
            return {
              user_id: sp.user_id,
              profiles: profile || null
            };
          });

          return {
            ...studySession,
            session_participants: participantProfiles
          };
        });

      return sessionsWithParticipants;
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  }

  static async getAvailableSessions() {
    try {
      const now = new Date().toISOString();
      
      // First get available sessions with group info
      const { data: sessions, error } = await supabase
        .from('study_sessions')
        .select(`
          *,
          study_groups (
            id,
            name,
            subject
          )
        `)
        .gte('scheduled_start', now)
        .eq('status', 'scheduled')
        .order('scheduled_start', { ascending: true });

      if (error) {
        console.error('Error fetching available sessions:', error);
        return [];
      }

      if (!sessions || sessions.length === 0) return [];

      const sessionIds = sessions.map(s => s.id);
      const { data: allParticipants } = await supabase
        .from('session_participants')
        .select('session_id, user_id')
        .in('session_id', sessionIds);

      const userIds = [...new Set(allParticipants?.map(p => p.user_id) || [])];
      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url, user_id')
          .in('user_id', userIds);
        profiles = profilesData || [];
      }

      const isAutomation = typeof window !== 'undefined' && window.navigator.webdriver;

      const sessionsWithParticipants = sessions
        .filter(studySession => {
          if (!isAutomation && studySession.title === 'E2E Session') {
            return false;
          }
          return true;
        })
        .map((studySession) => {
          const sessionParts = allParticipants?.filter(p => p.session_id === studySession.id) || [];
          const participantProfiles = sessionParts.map(sp => {
            const profile = profiles.find(p => p.user_id === sp.user_id);
            return {
              user_id: sp.user_id,
              profiles: profile || null
            };
          });

          return {
            ...studySession,
            session_participants: participantProfiles
          };
        });

      return sessionsWithParticipants;
    } catch (error) {
      console.error('Error fetching available sessions:', error);
      return [];
    }
  }

  static async getSessionsByGroup(groupId: string) {
    try {
      // Get all sessions for this group
      const { data: sessions, error } = await supabase
        .from('study_sessions')
        .select(`
          *,
          study_groups (
            id,
            name,
            subject
          )
        `)
        .eq('group_id', groupId)
        .order('scheduled_start', { ascending: true });

      if (error) {
        console.error('Error fetching group sessions:', error);
        return [];
      }

      if (!sessions || sessions.length === 0) return [];

      const sessionIds = sessions.map(s => s.id);
      const { data: allParticipants } = await supabase
        .from('session_participants')
        .select('session_id, user_id')
        .in('session_id', sessionIds);

      const userIds = [...new Set(allParticipants?.map(p => p.user_id) || [])];
      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url, user_id')
          .in('user_id', userIds);
        profiles = profilesData || [];
      }

      const isAutomation = typeof window !== 'undefined' && window.navigator.webdriver;

      const sessionsWithParticipants = sessions
        .filter(studySession => {
          if (!isAutomation && studySession.title === 'E2E Session') {
            return false;
          }
          return true;
        })
        .map((studySession) => {
          const sessionParts = allParticipants?.filter(p => p.session_id === studySession.id) || [];
          const participantProfiles = sessionParts.map(sp => {
            const profile = profiles.find(p => p.user_id === sp.user_id);
            return {
              user_id: sp.user_id,
              profiles: profile || null
            };
          });

          return {
            ...studySession,
            participant_count: sessionParts.length,
            session_participants: participantProfiles
          };
        });

      return sessionsWithParticipants;
    } catch (error) {
      console.error('Error fetching group sessions:', error);
      return [];
    }
  }
}
