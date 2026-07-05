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
        // Try the proper approach first - get user's group memberships
        const { data: memberships, error: membershipsError } = await supabase
          .from('group_members')
          .select('group_id, role, joined_at')
          .eq('user_id', userId);

        if (membershipsError) {
          console.warn('Could not fetch group memberships, falling back to created groups only:', membershipsError);
          
          // Fallback: get groups created by user
          const { data: createdGroups, error: createdError } = await supabase
            .from('study_groups')
            .select('*')
            .eq('created_by', userId);

          if (createdError) {
            console.error('Error fetching user-created groups:', createdError);
            return [];
          }

          const fallbackGroupIds = (createdGroups || []).map(g => g.id);
          const { data: fallbackMembers } = await supabase
            .from('group_members')
            .select('id, group_id')
            .in('group_id', fallbackGroupIds);

          return (createdGroups || []).map(group => {
            const memberCount = (fallbackMembers || []).filter(m => m.group_id === group.id).length || 1;
            return {
              ...group,
              icon: (group as any).icon || 'Users',
              color: (group as any).color || 'from-blue-500 to-blue-600',
              creator_profile: null,
              user_role: 'admin',
              joined_at: group.created_at,
              member_count: memberCount
            };
          });
        }

        if (!memberships || memberships.length === 0) {
          return [];
        }

        // Get group details for each membership
        const groupIds = memberships.map(m => m.group_id);
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
        const { data: creators } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url, user_id')
          .in('user_id', creatorIds);

        const { data: allMembersData } = await supabase
          .from('group_members')
          .select('id, group_id')
          .in('group_id', groupIds);

        const allMembers = allMembersData || [];

        // Combine membership data with group details
        const groupsWithDetails = memberships.map(membership => {
          const group = groups?.find(g => g.id === membership.group_id);
          const creator = creators?.find(c => c.user_id === group?.created_by);
          
          if (!group) return null;

          const memberCount = allMembers.filter(m => m.group_id === group.id).length;
          
          return {
            ...group,
            // Add fallback values for icon and color if not present in database
            icon: (group as any).icon || 'Users',
            color: (group as any).color || 'from-blue-500 to-blue-600',
            creator_profile: creator,
            user_role: membership.role,
            joined_at: membership.joined_at,
            member_count: memberCount
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
        console.error('Error fetching user groups, trying fallback:', error);
        
        // Final fallback: get groups created by user
        const { data: createdGroups, error: createdError } = await supabase
          .from('study_groups')
          .select('*')
          .eq('created_by', userId);

        if (createdError) {
          console.error('Error fetching user-created groups:', createdError);
          return [];
        }

        const fallbackGroupIds = (createdGroups || []).map(g => g.id);
        const { data: fallbackMembers } = await supabase
          .from('group_members')
          .select('id, group_id')
          .in('group_id', fallbackGroupIds);

        const isAutomation = typeof window !== 'undefined' && window.navigator.webdriver;
        return (createdGroups || [])
          .filter(group => {
            if (!isAutomation && group.name === 'E2E Test Group') {
              return false;
            }
            return true;
          })
          .map(group => {
            const memberCount = (fallbackMembers || []).filter(m => m.group_id === group.id).length || 1;
            return {
              ...group,
              icon: (group as any).icon || 'Users',
              color: (group as any).color || 'from-blue-500 to-blue-600',
              creator_profile: null,
              user_role: 'admin',
              joined_at: group.created_at,
              member_count: memberCount
            };
          });
      }

    } catch (error) {
      console.error('Unexpected error fetching user groups:', error);
      return [];
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

      const [creatorsData, membersData] = await Promise.all([
        supabase.from('profiles').select('id, display_name, avatar_url, user_id').in('user_id', creatorIds),
        supabase.from('group_members').select('id, group_id').in('group_id', groupIds)
      ]);

      const creators = creatorsData.data || [];
      const allMembers = membersData.data || [];

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

          return {
            ...group,
            // Add fallback values for icon and color if not present in database
            icon: (group as any).icon || 'Users',
            color: (group as any).color || 'from-blue-500 to-blue-600',
            creator_profile: creator || null,
            member_count: memberCount
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
