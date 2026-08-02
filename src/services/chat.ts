import { supabase } from '@/integrations/supabase/client';
import { checkAuth, handleDbError, StudyGroup, StudySession, Note, User, GroupMember, SessionParticipant, Friendship, Message, Conversation } from './utils';

export class ChatService {
  static async getConversations() {
    try {
      const session = await checkAuth();
      if (!session) {
        return [];
      }

      // Attempt single high-performance RPC query
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

      // Fallback if RPC function is not installed yet
      const { data: participations, error } = await supabase
        .from('conversation_participants')
        .select(`
          *,
          conversations (*)
        `)
        .eq('user_id', session.user.id)
        .neq('is_active', false);

      if (error || !participations) {
        return [];
      }

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

      // Fetch recent messages with indexed ordering and limit
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        return [];
      }

      if (!messages || messages.length === 0) {
        return [];
      }

      // Reverse to display chronologically (oldest to newest)
      const sortedMessages = [...messages].reverse();

      // Batch fetch profiles for all unique senders in a single query
      const senderIds = [...new Set(sortedMessages.map(m => m.sender_id))];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, user_id')
        .in('user_id', senderIds);

      if (profilesError) {
        return sortedMessages;
      }

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

  static async getOrCreateGroupConversation(groupId: string) {
    try {
      const session = await checkAuth();
      if (!session) {
        throw new Error('Authentication required');
      }

      // First, try to find existing conversation for this group
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

      // Create new group conversation
      const { data: conversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          created_by: session.user.id,
          group_id: groupId,
          is_group_chat: true,
          name: null // Will be derived from group name
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating conversation:', createError);
        throw createError;
      }

      // Add the creator as a participant
      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert({
          conversation_id: conversation.id,
          user_id: session.user.id
        });

      if (participantError) {
        console.error('Error adding participant:', participantError);
        // Don't throw here as conversation is created
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

      // Insert the message
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

      // Fetch the sender's profile separately
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, user_id')
        .eq('user_id', session.user.id)
        .single();

      // Combine message with profile
      const messageWithProfile = {
        ...message,
        profiles: profile || null
      };

      return messageWithProfile;
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

      // First create the conversation
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

      // Add both users as participants
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

      // Find user's direct conversation participations
      const { data: myParticipations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', session.user.id)
        .eq('is_active', true);

      if (myParticipations && myParticipations.length > 0) {
        const myConvIds = myParticipations.map(p => p.conversation_id);

        // Check which of those conversations are 1-on-1 (is_group_chat = false) and also include targetUserId
        const { data: targetParticipations } = await supabase
          .from('conversation_participants')
          .select('conversation_id, conversations(id, is_group_chat)')
          .eq('user_id', targetUserId)
          .eq('is_active', true)
          .in('conversation_id', myConvIds);

        const existingDirectConv = targetParticipations?.find(
          (tp: any) => tp.conversations && tp.conversations.is_group_chat === false
        );

        if (existingDirectConv?.conversations) {
          return existingDirectConv.conversations;
        }
      }

      // If no existing conversation found, create a new one
      return await ChatService.createConversation(targetUserId);
    } catch (error) {
      console.error('Error getting or creating direct conversation:', error);
      throw error;
    }
  }
}

// Utility function to test RLS policies (for debugging)
const testRLSPolicies = async () => {
  const session = await checkAuth();
  if (!session) {
    console.log('❌ No authenticated session');
    return;
  }

  console.log('🔍 Testing RLS policies...');
  console.log('👤 User ID:', session.user.id);
  
  // Test study_groups access
  try {
    const { data: groups, error: groupsError } = await supabase
      .from('study_groups')
      .select('id, name, created_by, is_public')
      .limit(5);
    
    console.log(groupsError ? '❌ study_groups error:' : '✅ study_groups access:', 
                groupsError || `${groups?.length || 0} groups found`);
  } catch (e) {
    console.log('❌ study_groups exception:', e);
  }

  // Test group_members access (this will likely fail due to RLS recursion)
  try {
    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select('id, group_id, user_id, role')
      .limit(5);
    
    console.log(membersError ? '❌ group_members error:' : '✅ group_members access:', 
                membersError || `${members?.length || 0} memberships found`);
  } catch (e) {
    console.log('❌ group_members exception:', e);
  }

  // Test profiles access
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name, user_id')
      .eq('user_id', session.user.id)
      .single();
    
    console.log(profileError ? '❌ profiles error:' : '✅ profiles access:', 
                profileError || 'Profile found');
  } catch (e) {
    console.log('❌ profiles exception:', e);
  }
};


