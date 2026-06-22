import { supabase } from '@/integrations/supabase/client';
import { checkAuth, handleDbError, StudyGroup, StudySession, Note, User, GroupMember, SessionParticipant, Friendship, Message, Conversation } from './utils';

export class StudyGroupsService {
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

          return (createdGroups || []).map(group => ({
            ...group,
            // Add fallback values for icon and color if not present in database
            icon: (group as any).icon || 'Users',
            color: (group as any).color || 'from-blue-500 to-blue-600',
            creator_profile: null,
            user_role: 'admin',
            joined_at: group.created_at
          }));
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

        const filteredGroups = groupsWithDetails.filter(Boolean);
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

        return (createdGroups || []).map(group => ({
          ...group,
          // Add fallback values for icon and color if not present in database
          icon: (group as any).icon || 'Users',
          color: (group as any).color || 'from-blue-500 to-blue-600',
          creator_profile: null,
          user_role: 'admin',
          joined_at: group.created_at
        }));
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

      // This query causes RLS recursion - commenting out for now
      /*
      const { data: memberships, error } = await supabase
        .from('group_members')
        .select('group_id, role, joined_at')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching memberships:', error);
        return [];
      }

      // Get group details...
      */
      
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

      // Get creator profiles and member counts for each group
      const groupsWithCreators = groups.map((group) => {
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

  static async createGroup(groupData: {
    name: string;
    description?: string;
    subject?: string;
    is_public: boolean;
    max_members?: number;
  }) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to create groups');
      }

      const { data: group, error: groupError } = await supabase
        .from('study_groups')
        .insert({
          ...groupData,
          created_by: session.user.id
        })
        .select()
        .single();

      if (groupError) {
        handleDbError(groupError, 'create study group');
      }

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: session.user.id,
          role: 'admin'
        });

      if (memberError) {
        console.error('Error adding creator to group:', memberError);
      }

      return group;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }

  static async joinGroup(groupId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to join groups');
      }

      const { data, error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: session.user.id,
          role: 'member'
        })
        .select()
        .single();

      if (error) {
        // Handle RLS recursion specifically for join operations
        if (error.code === '42P17' || error.message?.includes('infinite recursion')) {
          console.error('RLS recursion detected when joining group:', error);
          throw new Error('Unable to join group due to database configuration. Please try again later.');
        } else {
          handleDbError(error, 'join group');
        }
      }

      return data;
    } catch (error) {
      console.error('Error joining group:', error);
      throw error;
    }
  }

  static async leaveGroup(groupId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to leave groups');
      }

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', session.user.id);

      if (error) {
        // Handle RLS recursion specifically for leave operations
        if (error.code === '42P17' || error.message?.includes('infinite recursion')) {
          console.error('RLS recursion detected when leaving group:', error);
          throw new Error('Unable to leave group due to database configuration. Please try again later.');
        } else {
          handleDbError(error, 'leave group');
        }
      }

      return true;
    } catch (error) {
      console.error('Error leaving group:', error);
      throw error;
    }
  }

  static async updateGroup(id: string, updates: Partial<StudyGroup>) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to update groups');
      }

      // First try to update with all fields including icon and color
      try {
        const { data, error } = await supabase
          .from('study_groups')
          .update(updates)
          .eq('id', id)
          .eq('created_by', session.user.id)
          .select()
          .single();

        if (error) {
          handleDbError(error, 'update group');
        }

        return data;
      } catch (error: any) {
        // If the error is about unknown columns (icon/color), try without them
        if (error.message?.includes('column') || error.code === '42703') {
          console.warn('Icon/color columns not available, updating without them');
          
          // Remove icon and color from updates and try again
          const { icon, color, ...safeUpdates } = updates as any;
          
          const { data, error: fallbackError } = await supabase
            .from('study_groups')
            .update(safeUpdates)
            .eq('id', id)
            .eq('created_by', session.user.id)
            .select()
            .single();

          if (fallbackError) {
            handleDbError(fallbackError, 'update group (fallback)');
          }

          // Add the icon and color back to the returned data for UI consistency
          return {
            ...data,
            icon: (updates as any).icon || 'Users',
            color: (updates as any).color || 'from-blue-500 to-blue-600'
          };
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  }

  static async deleteGroup(id: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to delete groups');
      }

      const { error } = await supabase
        .from('study_groups')
        .delete()
        .eq('id', id)
        .eq('created_by', session.user.id);

      if (error) {
        handleDbError(error, 'delete group');
      }

      return true;
    } catch (error) {
      console.error('Error deleting group:', error);
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

