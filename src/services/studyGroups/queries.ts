import { supabase } from '@/integrations/supabase/client';
import { checkAuth, handleDbError } from '../utils';

export class StudyGroupsQueries {
  static async getUserGroups() {
    try {
      const session = await checkAuth();
      if (!session) {
        return [];
      }

      const userId = session.user.id;

      // Check if this is an anonymous user
      const isAnonymous = !session.user.email || 
                         session.user.is_anonymous === true ||
                         session.user.aud === 'anonymous';
      
      if (isAnonymous) {
        return [];
      }

      try {
        // Fetch groups the user is a member of
        const { data: memberships, error: membershipsError } = await supabase
          .from('group_members')
          .select('group_id, role, joined_at')
          .eq('user_id', userId);

        if (membershipsError) {
          console.warn('Error fetching group memberships:', membershipsError);
        }

        // Fetch groups created by the user
        const { data: createdGroups, error: createdError } = await supabase
          .from('study_groups')
          .select('id')
          .eq('created_by', userId);

        if (createdError) {
          console.warn('Error fetching user-created groups:', createdError);
        }

        const membershipIds = (memberships || []).map(m => m.group_id);
        const createdIds = (createdGroups || []).map(g => g.id);
        const groupIds = [...new Set([...membershipIds, ...createdIds])];

        if (groupIds.length === 0) {
          return [];
        }

        const { data: groups, error: groupsError } = await supabase
          .from('study_groups')
          .select('*')
          .in('id', groupIds);

        if (groupsError) {
          console.error('Error fetching group details:', groupsError);
          return [];
        }

        // Get creator profiles
        const creatorIds = [...new Set((groups || []).map(g => g.created_by))];
        const [creatorsData, allMembersData, sessionsDataRes, conversationsRes] = await Promise.all([
          supabase.from('profiles').select('id, display_name, avatar_url, user_id').in('user_id', creatorIds),
          supabase.from('group_members').select('id, group_id').in('group_id', groupIds),
          supabase.from('study_sessions').select('id, group_id').in('group_id', groupIds),
          supabase.from('conversations').select('id, group_id').in('group_id', groupIds).eq('is_group_chat', true)
        ]);

        const creators = creatorsData.data || [];
        const allMembers = allMembersData.data || [];
        const sessionsData = sessionsDataRes.data || [];
        const conversations = conversationsRes.data || [];
        const convIds = conversations.map(c => c.id);

        let latestMessages: any[] = [];
        if (convIds.length > 0) {
          const { data: msgs } = await supabase
            .from('messages')
            .select('id, conversation_id, content, created_at, sender_id')
            .in('conversation_id', convIds)
            .order('created_at', { ascending: false });
          latestMessages = msgs || [];
        }

        // Combine membership data with group details
        const groupsWithDetails = groups.map(group => {
          const creator = creators?.find(c => c.user_id === group.created_by);
          const membership = memberships?.find(m => m.group_id === group.id);
          const isCreator = group.created_by === userId;
          
          const memberCount = allMembers.filter(m => m.group_id === group.id).length;
          const sessionsCount = sessionsData.filter(s => s.group_id === group.id).length;
          const conversation = conversations.find(c => c.group_id === group.id);
          const latestMsg = conversation ? latestMessages.find(m => m.conversation_id === conversation.id) : null;
          
          return {
            ...group,
            // Add fallback values for icon and color if not present in database
            icon: (group as any).icon || 'Users',
            color: (group as any).color || 'from-blue-500 to-blue-600',
            creator_profile: creator,
            user_role: membership?.role || (isCreator ? 'admin' : 'member'),
            joined_at: membership?.joined_at || group.created_at,
            member_count: memberCount,
            sessions_count: sessionsCount,
            latest_message: latestMsg ? {
              id: latestMsg.id,
              content: latestMsg.content,
              created_at: latestMsg.created_at,
              sender_id: latestMsg.sender_id
            } : null
          };
        });

        const isAutomation = typeof window !== 'undefined' && window.navigator.webdriver;
        const filteredGroups = groupsWithDetails
          .filter(Boolean)
          .filter(group => {
            if (!isAutomation && group?.name === 'E2E Test Group') {
              return false;
            }
            return true;
          });
        return filteredGroups;
        
      } catch (error) {
        console.error('Error fetching user groups:', error);
        return [];
      }
    } catch (error) {
      return handleDbError(error, 'fetch user groups');
    }
  }

  // DISABLED: This method causes RLS recursion - re-enable when policies are fixed
  static async getUserGroupsViaMembers() {
    try {
      const session = await checkAuth();
      if (!session) {
        return [];
      }

      const userId = session.user.id;
      
      return [];
      
    } catch (error) {
      console.error('Error in getUserGroupsViaMembers:', error);
      return [];
    }
  }

  static async getPublicGroups() {
    try {
      // Get public groups first (without the problematic join)
      const { data: groups, error } = await supabase
        .from('study_groups')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching public groups:', error);
        return [];
      }

      if (!groups || groups.length === 0) return [];

      const creatorIds = [...new Set(groups.map(g => g.created_by))];
      const groupIds = groups.map(g => g.id);

      const [creatorsData, membersData, sessionsData] = await Promise.all([
        supabase.from('profiles').select('id, display_name, avatar_url, user_id').in('user_id', creatorIds),
        supabase.from('group_members').select('id, group_id').in('group_id', groupIds),
        supabase.from('study_sessions').select('id, group_id').in('group_id', groupIds)
      ]);

      const creators = creatorsData.data || [];
      const allMembers = membersData.data || [];
      const allSessions = sessionsData.data || [];

      const isAutomation = typeof window !== 'undefined' && window.navigator.webdriver;

      // Get creator profiles and member counts for each group
      const groupsWithCreators = groups
        .filter(group => {
          if (!isAutomation && group.name === 'E2E Test Group') {
            return false;
          }
          return true;
        })
        .map((group) => {
          const creator = creators.find(c => c.user_id === group.created_by);
          const memberCount = allMembers.filter(m => m.group_id === group.id).length;
          const sessionsCount = allSessions.filter(s => s.group_id === group.id).length;

          return {
            ...group,
            // Add fallback values for icon and color if not present in database
            icon: (group as any).icon || 'Users',
            color: (group as any).color || 'from-blue-500 to-blue-600',
            creator_profile: creator || null,
            member_count: memberCount,
            sessions_count: sessionsCount
          };
        });

      return groupsWithCreators;
    } catch (error) {
      console.error('Error fetching public groups:', error);
      return [];
    }
  }

  static async getGroupById(id: string) {
    try {
      // Get group info first
      const { data: group, error } = await supabase
        .from('study_groups')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        handleDbError(error, 'fetch group details');
      }

      if (!group) return null;

      // Get creator profile
      const { data: creator } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .eq('user_id', group.created_by)
        .single();

      // Get group members with their profiles (skip if RLS recursion occurs)
      let membersWithProfiles = [];
      try {
        const { data: members, error: membersError } = await supabase
          .from('group_members')
          .select('id, user_id, role, joined_at')
          .eq('group_id', id);

        if (membersError) {
          console.warn('Could not fetch group members due to RLS policy:', {
            code: membersError.code,
            message: membersError.message
          });
          
          // Handle RLS recursion specifically
          if (membersError.code === '42P17' || membersError.message?.includes('infinite recursion')) {
            console.log('RLS recursion detected for group members - returning empty members list');
          }
          
          membersWithProfiles = [];
        } else if (members && members.length > 0) {
          const { data: memberProfiles } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, user_id')
            .in('user_id', members.map(m => m.user_id));

          membersWithProfiles = members.map(member => ({
            ...member,
            profile: memberProfiles?.find(p => p.user_id === member.user_id)
          }));
        }
      } catch (membersError) {
        console.warn('Exception fetching group members:', membersError);
        // If we can't get members due to RLS issues, return empty array
        membersWithProfiles = [];
      }

      return {
        ...group,
        creator_profile: creator,
        group_members: membersWithProfiles
      };
    } catch (error) {
      console.error('Error fetching group:', error);
      throw error;
    }
  }

  static async getGroupMembers(groupId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        return [];
      }

      // First get group members
      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select('user_id, role, joined_at')
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true });

      if (membersError) {
        console.error('Error fetching group members:', membersError);
        return [];
      }

      if (!members || members.length === 0) {
        return [];
      }

      // Then get profiles for all members
      const userIds = members.map(m => m.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching member profiles:', profilesError);
      }

      // Combine the data
      return members.map(member => {
        const profile = profiles?.find(p => p.user_id === member.user_id);
        return {
          id: member.user_id,
          name: profile?.display_name || 'Unknown User',
          avatar: profile?.avatar_url || null,
          role: member.role || 'member',
          joined_at: member.joined_at
        };
      });
    } catch (error) {
      console.error('Error getting group members:', error);
      return [];
    }
  }
}
