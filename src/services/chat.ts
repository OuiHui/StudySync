import { supabase } from '@/integrations/supabase/client';
import { checkAuth, handleDbError, StudyGroup, StudySession, Note, User, GroupMember, SessionParticipant, Friendship, Message, Conversation } from './utils';

export class ChatService {
  static async getConversations() {
    try {
      const session = await checkAuth();
      if (!session) {
        return [];
      }

      // Get user's conversation participations
      const { data: participations, error } = await supabase
        .from('conversation_participants')
        .select(`
          *,
          conversations (*)
        `)
        .eq('user_id', session.user.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching conversations:', error);
        return [];
      }

      if (!participations) return [];

      // Get latest message for each conversation
      const conversationsWithMessages = await Promise.all(
        participations.map(async (participation) => {
          const conversation = participation.conversations;
          if (!conversation) return null;

          // Get latest message
          const { data: latestMessage } = await supabase
            .from('messages')
            .select('id, content, created_at, sender_id')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get sender profile if message exists
          let senderProfile = null;
          if (latestMessage) {
            const { data: sender } = await supabase
              .from('profiles')
              .select('id, display_name, avatar_url')
              .eq('user_id', latestMessage.sender_id)
              .single();
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

  static async getMessages(conversationId: string) {
    try {
      // Get messages with sender profile information
      // We need to do a separate query for profiles since sender_id references auth.users, not profiles
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        return [];
      }

      if (!messages || messages.length === 0) {
        return [];
      }

      // Get unique sender IDs
      const senderIds = [...new Set(messages.map(m => m.sender_id))];

      // Fetch profiles for all senders
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, user_id')
        .in('user_id', senderIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        // Return messages without profile data
        return messages;
      }

      // Create a map of profiles by user_id for quick lookup
      const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Merge profile data with messages
      const messagesWithProfiles = messages.map(message => ({
        ...message,
        profiles: profilesMap.get(message.sender_id) || null
      }));

      return messagesWithProfiles;
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


