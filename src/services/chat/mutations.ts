import { supabase } from '@/integrations/supabase/client';
import { checkAuth, handleDbError } from '../utils';

export class ChatMutations {
  static async getOrCreateGroupConversation(groupId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required');
      }

      const { data: existingConversation, error: findError } = await supabase
        .from('conversations')
        .select('*')
        .eq('group_id', groupId)
        .eq('is_group_chat', true)
        .maybeSingle();

      if (findError) {
        console.error('Error finding conversation:', findError);
        throw findError;
      }

      if (existingConversation) {
        return existingConversation;
      }

      const { data: conversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          created_by: session.user.id,
          group_id: groupId,
          is_group_chat: true,
          name: null
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating conversation:', createError);
        throw createError;
      }

      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert({
          conversation_id: conversation.id,
          user_id: session.user.id
        });

      if (participantError) {
        console.error('Error adding participant:', participantError);
      }

      return conversation;
    } catch (error) {
      console.error('Error getting or creating group conversation:', error);
      throw error;
    }
  }

  static async sendMessage(conversationId: string, content: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to send messages');
      }

      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: session.user.id,
          content
        })
        .select()
        .single();

      if (error) {
        handleDbError(error, 'send message');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, user_id')
        .eq('user_id', session.user.id)
        .single();

      return {
        ...message,
        profiles: profile || null
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  static async createConversation(userId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required to create conversations');
      }

      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          created_by: session.user.id,
          is_group_chat: false
        })
        .select()
        .single();

      if (convError) {
        handleDbError(convError, 'create conversation');
      }

      const participants = [
        { conversation_id: conversation.id, user_id: session.user.id },
        { conversation_id: conversation.id, user_id: userId }
      ];

      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert(participants);

      if (participantError) {
        console.error('Error adding conversation participants:', participantError);
      }

      return conversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  static async getOrCreateDirectConversation(targetUserId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required');
      }

      const { data: myParticipations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', session.user.id)
        .eq('is_active', true);

      if (myParticipations && myParticipations.length > 0) {
        const myConvIds = myParticipations.map(p => p.conversation_id);

        const { data: targetParticipations } = await supabase
          .from('conversation_participants')
          .select('conversation_id, conversations(id, is_group_chat)')
          .eq('user_id', targetUserId)
          .eq('is_active', true)
          .in('conversation_id', myConvIds);

        const existingDirectConv = targetParticipations?.find(
          tp => tp.conversations && tp.conversations.is_group_chat === false
        );

        if (existingDirectConv?.conversations) {
          return existingDirectConv.conversations;
        }
      }

      return await ChatMutations.createConversation(targetUserId);
    } catch (error) {
      console.error('Error getting or creating direct conversation:', error);
      throw error;
    }
  }
}
