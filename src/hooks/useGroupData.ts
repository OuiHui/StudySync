import { useState, useEffect } from 'react';
import { StudySessionsService, StudyGroupsService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';

export const useGroupData = (groupId: string) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const groupDataPromise = StudyGroupsService.getGroupById(groupId);
        const groupMembersPromise = StudyGroupsService.getGroupMembers(groupId);
        const sessionsPromise = user ? StudySessionsService.getSessionsByGroup(groupId) : Promise.resolve([]);

        const [groupData, groupMembers, groupSessions] = await Promise.all([
          groupDataPromise,
          groupMembersPromise,
          sessionsPromise
        ]);
        
        setGroup(groupData);
        setMembers(groupMembers);
        
        if (user) {
          setSessions(groupSessions);
        }
      } catch (err) {
        console.error('Error loading group data:', err);
        setError('Failed to load group data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [groupId, user]);

  return { group, members, sessions, loading, error };
};
