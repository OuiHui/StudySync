import { supabase } from '@/integrations/supabase/client';
import { checkAuth } from '../utils';

export interface SessionHistoryItem {
  id: string;
  title: string;
  subject: string | null;
  status: string;
  scheduled_start: string;
  scheduled_end: string;
  group_id: string | null;
  group_name: string | null;
  is_solo: boolean;
  participant_count: number;
}

const STUDY_SESSION_SELECT = `
  *,
  study_groups (
    id,
    name,
    subject
  )
`;

export class StudySessionsQueries {
  private static async enrichSessionsWithParticipants(
    sessions: any[],
    additionalFilter?: (session: any) => boolean
  ) {
    if (!sessions || sessions.length === 0) {
      return [];
    }

    const sessionIds = sessions.map(s => s.id);
    const { data: allParticipants } = await supabase
      .from('session_participants')
      .select('session_id, user_id, status, role, is_attending')
      .in('session_id', sessionIds);

    const creatorIds = sessions.map(s => s.created_by).filter(Boolean);
    const userIds = [...new Set([
      ...(allParticipants?.map(p => p.user_id) || []),
      ...creatorIds
    ])];
    
    let profiles: any[] = [];
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, user_id')
        .in('user_id', userIds);
      profiles = profilesData || [];
    }

    const isAutomation = typeof window !== 'undefined' && (
      window.navigator.webdriver || 
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1'
    );

    return sessions
      .filter(studySession => {
        if (!isAutomation && studySession.title === 'E2E Session') {
          return false;
        }
        if (additionalFilter && !additionalFilter(studySession)) {
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
            status: sp.status,
            role: sp.role,
            is_attending: sp.is_attending,
            profiles: profile || null
          };
        });

        const hostProfile = profiles.find(p => p.user_id === studySession.created_by) || null;

        return {
          ...studySession,
          participant_count: sessionParts.length,
          session_participants: participantProfiles,
          profiles: hostProfile
        };
      });
  }

  static async getSessions() {
    try {
      const session = await checkAuth();
      if (!session) {
        return [];
      }

      const userId = session.user.id;

      // Get sessions the user created OR sessions they're participating in
      const { data: createdSessions, error: createdError } = await supabase
        .from('study_sessions')
        .select(STUDY_SESSION_SELECT)
        .eq('created_by', userId)
        .order('scheduled_start', { ascending: true });

      if (createdError) {
        console.error('Error fetching created sessions:', createdError);
      }

      // Get sessions the user is participating in (accepted or active, i.e., status in ('accepted', 'active'))
      const { data: participations, error: participationError } = await supabase
        .from('session_participants')
        .select('session_id')
        .eq('user_id', userId)
        .in('status', ['accepted', 'active']);

      let participatedSessions = [];
      if (!participationError && participations && participations.length > 0) {
        const sessionIds = participations.map(p => p.session_id);
        const { data: sessions, error: sessionsError } = await supabase
          .from('study_sessions')
          .select(STUDY_SESSION_SELECT)
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
          .select(STUDY_SESSION_SELECT)
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

      const uniqueSessions = allSessions.filter((session, index, self) => 
        index === self.findIndex(s => s.id === session.id)
      );

      return StudySessionsQueries.enrichSessionsWithParticipants(uniqueSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  }

  static async getAvailableSessions() {
    try {
      const session = await checkAuth();
      const userId = session?.user?.id;

      const { data: sessions, error } = await supabase
        .from('study_sessions')
        .select(STUDY_SESSION_SELECT)
        .in('status', ['scheduled', 'active', 'running', 'paused'])
        .order('scheduled_start', { ascending: true });

      if (error) {
        console.error('Error fetching available sessions:', error);
        return [];
      }

      const enriched = await StudySessionsQueries.enrichSessionsWithParticipants(sessions, (studySession) => {
        if (studySession.status === 'scheduled') {
          return new Date(studySession.scheduled_end) >= new Date();
        }
        return true;
      });

      // Fetch user's group memberships to check if they belong to the session's group
      let userGroupIds: string[] = [];
      if (userId) {
        const { data: memberships } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', userId);
        if (memberships) {
          userGroupIds = memberships.map(m => m.group_id);
        }
      }

      // Filter out private study sessions if user is not invited, is not the creator,
      // and does not belong to the study group associated with the session.
      return enriched.filter(studySession => {
        if (studySession.is_public === false) {
          const isCreator = userId && studySession.created_by === userId;
          const isParticipant = userId && studySession.session_participants?.some(
            (p: any) => p.user_id === userId
          );
          const isGroupMember = userId && studySession.group_id && userGroupIds.includes(studySession.group_id);
          return isCreator || isParticipant || isGroupMember;
        }
        return true;
      });
    } catch (error) {
      console.error('Error fetching available sessions:', error);
      return [];
    }
  }

  static async getSessionsByGroup(groupId: string) {
    try {
      const { data: sessions, error } = await supabase
        .from('study_sessions')
        .select(STUDY_SESSION_SELECT)
        .eq('group_id', groupId)
        .order('scheduled_start', { ascending: true });

      if (error) {
        console.error('Error fetching group sessions:', error);
        return [];
      }

      return StudySessionsQueries.enrichSessionsWithParticipants(sessions);
    } catch (error) {
      console.error('Error fetching group sessions:', error);
      return [];
    }
  }

  static async getSession(sessionId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required');
      }

      const { data: studySession, error: sessionError } = await supabase
        .from('study_sessions')
        .select(STUDY_SESSION_SELECT)
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        throw sessionError;
      }

      const { data: participants, error: participantsError } = await supabase
        .from('session_participants')
        .select('*')
        .eq('session_id', sessionId);

      if (participantsError) {
        throw participantsError;
      }

      const userIds = [...new Set([
        ...(participants?.map(p => p.user_id) || []),
        studySession.created_by
      ].filter(Boolean))];
      
      let participantProfiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', userIds);
        participantProfiles = profilesData || [];
      }

      const participantsWithProfiles = participants.map(p => {
        const profile = participantProfiles.find(prof => prof.user_id === p.user_id);
        return {
          ...p,
          profiles: profile || null
        };
      });

      const hostProfile = participantProfiles.find(prof => prof.user_id === studySession.created_by) || null;

      return {
        ...studySession,
        session_participants: participantsWithProfiles,
        profiles: hostProfile
      };
    } catch (error) {
      console.error('Error fetching session:', error);
      throw error;
    }
  }

  static async getSessionHistory(limit = 20, offset = 0) {
    try {
      const session = await checkAuth();
      if (!session) return [];

      const { data, error } = await supabase.rpc('get_my_session_history', {
        p_limit: limit,
        p_offset: offset,
      });

      if (error) {
        console.error('Error fetching session history:', error);
        return [];
      }

      return (data ?? []) as SessionHistoryItem[];
    } catch (error) {
      console.error('Error fetching session history:', error);
      return [];
    }
  }

  static async getParticipants(sessionId: string) {
    try {
      const { data: participants, error: participantsError } = await supabase
        .from('session_participants')
        .select('user_id, role, status')
        .eq('session_id', sessionId);

      if (participantsError) throw participantsError;
      if (!participants || participants.length === 0) return [];

      const userIds = participants.map(p => p.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching participant profiles:', profilesError);
        return participants.map(p => ({ ...p, profiles: null }));
      }

      return participants.map(p => {
        const profile = (profiles || []).find(prof => prof.user_id === p.user_id);
        return {
          ...p,
          profiles: profile || null
        };
      });
    } catch (error) {
      console.error('Error fetching participants:', error);
      return [];
    }
  }
}

