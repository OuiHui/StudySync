import { supabase } from '@/integrations/supabase/client';
import { checkAuth, handleDbError, StudyGroup } from '../utils';

export class StudyGroupsMutations {
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

  static async removeMember(groupId: string, userId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to remove members');
      }

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) {
        handleDbError(error, 'remove member');
      }

      return true;
    } catch (error) {
      console.error('Error removing member:', error);
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

  static async inviteUserToGroup(groupId: string, invitedUserId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to invite users');
      }

      const { data, error } = await supabase
        .from('group_invitations' as any)
        .insert({
          group_id: groupId,
          invited_user_id: invitedUserId,
          invited_by_id: session.user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        handleDbError(error, 'invite user to group');
      }

      return data;
    } catch (error) {
      console.error('Error inviting user to group:', error);
      throw error;
    }
  }

  static async getGroupInvitations(groupId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        return [];
      }

      const { data, error } = await supabase
        .from('group_invitations' as any)
        .select('*')
        .eq('group_id', groupId);

      if (error) {
        handleDbError(error, 'get group invitations');
      }

      return data || [];
    } catch (error) {
      console.error('Error getting group invitations:', error);
      return [];
    }
  }

  static async acceptGroupInvitation(groupId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to accept group invitation');
      }

      const { data, error } = await supabase
        .from('group_invitations' as any)
        .update({ status: 'accepted' })
        .eq('group_id', groupId)
        .eq('invited_user_id', session.user.id)
        .select()
        .single();

      if (error) {
        handleDbError(error, 'accept group invitation');
      }

      return data;
    } catch (error) {
      console.error('Error accepting group invitation:', error);
      throw error;
    }
  }

  static async declineGroupInvitation(groupId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to decline group invitation');
      }

      const { data, error } = await supabase
        .from('group_invitations' as any)
        .update({ status: 'declined' })
        .eq('group_id', groupId)
        .eq('invited_user_id', session.user.id)
        .select()
        .single();

      if (error) {
        handleDbError(error, 'decline group invitation');
      }

      return data;
    } catch (error) {
      console.error('Error declining group invitation:', error);
      throw error;
    }
  }
}

