import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ChatService, StudySessionsService, StudyGroupsService, FriendsService } from '@/services/database';
import { MOCK_USERS } from '@/services/simulation';

export interface FormattedConversation {
  id: string;
  isGroupChat: boolean;
  groupId?: string | null;
  name: string;
  avatarUrl?: string | null;
  latestMessage?: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
    senderName?: string;
  } | null;
  unreadCount?: number;
  // For group chats
  activeSession?: any | null;
  groupSubject?: string | null;
  // For direct chats
  targetUserId?: string | null;
  targetUserProfile?: any | null;
}

export function useMessagingData() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [groupConversations, setGroupConversations] = useState<FormattedConversation[]>([]);
  const [directConversations, setDirectConversations] = useState<FormattedConversation[]>([]);
  const [activeSessionsMap, setActiveSessionsMap] = useState<Record<string, any>>({});
  const [userFriends, setUserFriends] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // 1. Fetch user's study groups & ensure conversation exists for each
      const [userGroups, rawConversations, availableSessions, friendsList] = await Promise.all([
        StudyGroupsService.getUserGroups(),
        ChatService.getConversations(),
        StudySessionsService.getAvailableSessions(),
        FriendsService.getUserFriends()
      ]);

      // Create lookup map for active group sessions
      // A session is active if status is 'active', 'running', or scheduled with active participants
      const activeMap: Record<string, any> = {};
      (availableSessions || []).forEach((session: any) => {
        if (session.group_id && ['active', 'running', 'scheduled'].includes(session.status)) {
          // If multiple sessions, prefer active/running over scheduled
          if (!activeMap[session.group_id] || session.status === 'active' || session.status === 'running') {
            activeMap[session.group_id] = session;
          }
        }
      });
      setActiveSessionsMap(activeMap);
      setUserFriends(friendsList || []);

      // Process existing group conversations
      const groupConvs: FormattedConversation[] = [];
      const processedGroupIds = new Set<string>();

      for (const conv of (rawConversations || [])) {
        const cData = conv.conversations || conv;
        if (cData.is_group_chat && cData.group_id) {
          processedGroupIds.add(cData.group_id);
          const matchingGroup = (userGroups || []).find((g: any) => g.id === cData.group_id);
          
          groupConvs.push({
            id: cData.id,
            isGroupChat: true,
            groupId: cData.group_id,
            name: cData.name || matchingGroup?.name || 'Study Group',
            avatarUrl: matchingGroup?.image_url || matchingGroup?.avatar_url || null,
            groupSubject: matchingGroup?.subject || null,
            latestMessage: cData.latest_message ? {
              id: cData.latest_message.id,
              content: cData.latest_message.content,
              createdAt: cData.latest_message.created_at,
              senderId: cData.latest_message.sender_id,
              senderName: cData.latest_message.sender?.display_name || 'Member'
            } : null,
            activeSession: activeMap[cData.group_id] || null
          });
        }
      }

      // Add missing study groups that don't have conversations created yet
      for (const group of (userGroups || [])) {
        if (!processedGroupIds.has(group.id)) {
          groupConvs.push({
            id: `temp_group_${group.id}`,
            isGroupChat: true,
            groupId: group.id,
            name: group.name,
            avatarUrl: group.image_url || group.avatar_url || null,
            groupSubject: group.subject || null,
            latestMessage: null,
            activeSession: activeMap[group.id] || null
          });
        }
      }

      // Process Direct Conversations (1-on-1 chats)
      const directConvs: FormattedConversation[] = [];
      
      for (const conv of (rawConversations || [])) {
        const cData = conv.conversations || conv;
        if (!cData.is_group_chat) {
          // Find the other participant for 1-on-1 chats
          const { data: participants } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', cData.id);

          const otherUserId =
            participants?.find((p: any) => p.user_id !== user.id)?.user_id ||
            (cData.created_by !== user.id ? cData.created_by : null);

          let targetProfile: any = null;
          if (otherUserId) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, display_name, avatar_url, user_id, email')
              .eq('user_id', otherUserId)
              .maybeSingle();
            targetProfile = profile;
          }

          const friendMatch = (friendsList || []).find((f: any) => f.user_id === otherUserId);
          const mockMatch = MOCK_USERS.find((m: any) => m.id === otherUserId);
          const displayName = targetProfile?.display_name || friendMatch?.display_name || mockMatch?.name || 'Direct Chat';

          // Resolve sender name for latest message if needed
          let senderName = cData.latest_message?.sender?.display_name;
          if (!senderName && cData.latest_message?.sender_id) {
            const msgSenderMock = MOCK_USERS.find((m: any) => m.id === cData.latest_message.sender_id);
            if (msgSenderMock) senderName = msgSenderMock.name;
          }

          directConvs.push({
            id: cData.id,
            isGroupChat: false,
            name: displayName,
            avatarUrl: targetProfile?.avatar_url || friendMatch?.avatar_url || null,
            targetUserId: otherUserId || null,
            targetUserProfile: targetProfile || friendMatch || (mockMatch ? { display_name: mockMatch.name, email: mockMatch.email } : null),
            latestMessage: cData.latest_message ? {
              id: cData.latest_message.id,
              content: cData.latest_message.content,
              createdAt: cData.latest_message.created_at,
              senderId: cData.latest_message.sender_id,
              senderName: senderName || (cData.latest_message.sender_id === user.id ? 'You' : displayName)
            } : null
          });
        }
      }

      setGroupConversations(groupConvs);
      setDirectConversations(directConvs);
    } catch (err) {
      console.error('Error loading messaging data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();

    if (!user) return;

    // Realtime channel for live study sessions and messages
    const channel = supabase
      .channel('messaging_page_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_sessions' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadData]);

  const startDirectChatWithUser = async (targetUserId: string): Promise<string | null> => {
    try {
      const conv = await ChatService.getOrCreateDirectConversation(targetUserId);
      await loadData();
      return conv.id;
    } catch (err) {
      console.error('Failed to start direct chat:', err);
      return null;
    }
  };

  const getOrCreateGroupChat = async (groupId: string): Promise<string | null> => {
    try {
      const conv = await ChatService.getOrCreateGroupConversation(groupId);
      return conv.id;
    } catch (err) {
      console.error('Failed to get/create group conversation:', err);
      return null;
    }
  };

  return {
    loading,
    groupConversations,
    directConversations,
    activeSessionsMap,
    userFriends,
    refetch: loadData,
    startDirectChatWithUser,
    getOrCreateGroupChat
  };
}
