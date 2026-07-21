import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface MessagingData {
  groupConversations: FormattedConversation[];
  directConversations: FormattedConversation[];
  activeSessionsMap: Record<string, any>;
  userFriends: any[];
  userGroups: any[];
}

export function useMessagingData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const fetchMessagingData = async (): Promise<MessagingData> => {
    if (!user) {
      return {
        groupConversations: [],
        directConversations: [],
        activeSessionsMap: {},
        userFriends: [],
        userGroups: [],
      };
    }

    // 1. Fetch user's study groups & conversations
    const [userGroups, rawConversations, availableSessions, friendsList] = await Promise.all([
      StudyGroupsService.getUserGroups(),
      ChatService.getConversations(),
      StudySessionsService.getAvailableSessions(),
      FriendsService.getUserFriends()
    ]);

    // Create lookup map for active group sessions
    const activeMap: Record<string, any> = {};
    (availableSessions || []).forEach((session: any) => {
      if (session.group_id && ['active', 'running', 'scheduled'].includes(session.status)) {
        if (!activeMap[session.group_id] || session.status === 'active' || session.status === 'running') {
          activeMap[session.group_id] = session;
        }
      }
    });

    // Process existing group conversations - only include groups with at least one message sent
    const groupConvs: FormattedConversation[] = [];
    const processedGroupIds = new Set<string>();

    for (const conv of (rawConversations || [])) {
      const cData = conv.conversations || conv;
      if (cData.is_group_chat && cData.group_id) {
        processedGroupIds.add(cData.group_id);
        
        // Study Groups that do not have any messages in them should not appear
        if (!cData.latest_message) {
          continue;
        }

        const matchingGroup = (userGroups || []).find((g: any) => g.id === cData.group_id);
        
        groupConvs.push({
          id: cData.id,
          isGroupChat: true,
          groupId: cData.group_id,
          name: cData.name || matchingGroup?.name || 'Study Group',
          avatarUrl: matchingGroup?.image_url || matchingGroup?.avatar_url || null,
          groupSubject: matchingGroup?.subject || null,
          latestMessage: {
            id: cData.latest_message.id,
            content: cData.latest_message.content,
            createdAt: cData.latest_message.created_at,
            senderId: cData.latest_message.sender_id,
            senderName: cData.latest_message.sender?.display_name || 'Member'
          },
          activeSession: activeMap[cData.group_id] || null,
          createdAt: cData.created_at || matchingGroup?.created_at || null,
          updatedAt: cData.updated_at || matchingGroup?.updated_at || null,
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
          } : null,
          createdAt: cData.created_at || null,
          updatedAt: cData.updated_at || null,
        });
      }
    }

    const getSortTime = (conv: FormattedConversation): number => {
      if (conv.latestMessage?.createdAt) {
        const time = new Date(conv.latestMessage.createdAt).getTime();
        if (!isNaN(time)) return time;
      }
      if (conv.updatedAt) {
        const time = new Date(conv.updatedAt).getTime();
        if (!isNaN(time)) return time;
      }
      if (conv.createdAt) {
        const time = new Date(conv.createdAt).getTime();
        if (!isNaN(time)) return time;
      }
      return 0;
    };

    const sortConversationsByRecent = (list: FormattedConversation[]): FormattedConversation[] => {
      return [...list].sort((a, b) => {
        const timeA = getSortTime(a);
        const timeB = getSortTime(b);
        if (timeA !== timeB) {
          return timeB - timeA;
        }
        return a.name.localeCompare(b.name);
      });
    };

    return {
      groupConversations: sortConversationsByRecent(groupConvs),
      directConversations: sortConversationsByRecent(directConvs),
      activeSessionsMap: activeMap,
      userFriends: friendsList || [],
      userGroups: userGroups || [],
    };
  };

  const { data, isLoading: loading, refetch } = useQuery<MessagingData>({
    queryKey: ['messaging-data', user?.id],
    queryFn: fetchMessagingData,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!user) return;

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['messaging-data', user.id] });
    };

    const channel = supabase
      .channel('messaging_page_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, invalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_sessions' }, invalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, invalidate)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const startDirectChatWithUser = async (targetUserId: string): Promise<string | null> => {
    try {
      const conv = await ChatService.getOrCreateDirectConversation(targetUserId);
      await refetch();
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
    groupConversations: data?.groupConversations || [],
    directConversations: data?.directConversations || [],
    activeSessionsMap: data?.activeSessionsMap || {},
    userFriends: data?.userFriends || [],
    userGroups: data?.userGroups || [],
    refetch,
    startDirectChatWithUser,
    getOrCreateGroupChat
  };
}
