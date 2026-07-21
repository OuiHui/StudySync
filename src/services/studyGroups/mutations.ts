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

  static async updateGroup(id: string, updates: Partial<StudyGroup> & { avatar_url?: string; icon?: string }) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to update groups');
      }

      // Map avatar_url to icon column if present and remove avatar_url
      const cleanUpdates: any = { ...updates };
      if (cleanUpdates.avatar_url) {
        cleanUpdates.icon = cleanUpdates.avatar_url;
        delete cleanUpdates.avatar_url;
      }

      // First try to update with all fields including icon and color
      try {
        const { data, error } = await supabase
          .from('study_groups')
          .update(cleanUpdates)
          .eq('id', id)
          .eq('created_by', session.user.id)
          .select()
          .single();

        if (error) {
          handleDbError(error, 'update group');
        }

        return data;
      } catch (error: any) {
        // Handle missing column errors (e.g. icon/color/avatar_url not in schema cache)
        if (
          error.message?.includes('column') ||
          error.message?.includes('schema cache') ||
          error.code === '42703' ||
          error.code === 'PGRST204'
        ) {
          console.warn('Appearance columns (icon/color/avatar_url) not supported in database schema, updating core fields');
          
          // Remove icon, color, and avatar_url from updates and save core fields
          const { icon, color, avatar_url, ...safeUpdates } = cleanUpdates as any;
          
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

          // Return merged data for seamless UI display
          return {
            ...data,
            icon: cleanUpdates.icon || 'Users',
            color: cleanUpdates.color || 'from-blue-500 to-blue-600'
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

  static async uploadGroupAvatar(groupId: string, file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 300;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          } else {
            resolve((event.target?.result as string) || '');
          }
        };
        img.onerror = () => resolve((event.target?.result as string) || '');
        img.src = event.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
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

