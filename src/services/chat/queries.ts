import { supabase } from '@/integrations/supabase/client';
import { checkAuth } from '../utils';

export class ChatQueries {
  static async getConversations() {
    try {
      const session = await checkAuth();
      if (!session) return [];

      const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_conversations_overview', {
        _user_id: session.user.id
      });

      if (!rpcError && rpcData) {
        return rpcData.map((row: any) => ({
          user_id: session.user.id,
          conversations: {
            id: row.conversation_id,
            is_group_chat: row.is_group_chat,
            group_id: row.group_id,
            name: row.conversation_name,
            created_by: row.created_by,
            created_at: row.created_at,
            updated_at: row.updated_at,
            target_user_id: row.target_user_id,
            target_profile: row.target_user_id ? {
              user_id: row.target_user_id,
              display_name: row.target_display_name,
              avatar_url: row.target_avatar_url
            } : null,
            latest_message: row.latest_message_id ? {
              id: row.latest_message_id,
              content: row.latest_message_content,
              created_at: row.latest_message_created_at,
              sender_id: row.latest_sender_id,
              sender: {
                display_name: row.latest_sender_name,
                avatar_url: row.latest_sender_avatar_url
              }
            } : null
          }
        }));
      }

      const { data: participations, error } = await supabase
        .from('conversation_participants')
        .select(`
          *,
          conversations (*)
        `)
        .eq('user_id', session.user.id)
        .neq('is_active', false);

      if (error || !participations) return [];

      const conversationsWithMessages = await Promise.all(
        participations.map(async (participation) => {
          const conversation = participation.conversations;
          if (!conversation) return null;

          const { data: latestMessage } = await supabase
            .from('messages')
            .select('id, content, created_at, sender_id')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          let senderProfile = null;
          if (latestMessage) {
            const { data: sender } = await supabase
              .from('profiles')
              .select('id, display_name, avatar_url')
              .eq('user_id', latestMessage.sender_id)
              .maybeSingle();
            senderProfile = sender;
          }

          return {
            ...participation,
            conversations: {
              ...conversation,
              latest_message: latestMessage ? {
                ...latestMessage,
                sender: senderProfile
              } : null
            }
          };
        })
      );

      return conversationsWithMessages.filter(Boolean);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  static async getMessages(conversationId: string, limit: number = 50) {
    try {
      if (!conversationId || !conversationId.match(/^[0-9a-fA-F-]{36}$/)) {
        return [];
      }

      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (messagesError || !messages || messages.length === 0) {
        if (messagesError) console.error('Error fetching messages:', messagesError);
        return [];
      }

      const sortedMessages = [...messages].reverse();
      const senderIds = [...new Set(sortedMessages.map(m => m.sender_id))];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, user_id')
        .in('user_id', senderIds);

      if (profilesError) return sortedMessages;

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return sortedMessages.map(message => ({
        ...message,
        profiles: profilesMap.get(message.sender_id) || null
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }
}
