import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  MessageSquare, 
  Search, 
  Send, 
  Plus, 
  Radio, 
  Loader2, 
  User, 
  BookOpen, 
  Video,
  X,
  ChevronLeft,
  ExternalLink
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { isValidImageUrl, formatSidebarTimestamp } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

import { useAuth } from '@/contexts/AuthContext';
import { useUserProfileModal } from '@/contexts/UserProfileModalContext';
import { useToast } from '@/hooks/use-toast';
import { ChatService } from '@/services/database';
import { RealtimeService, RealtimeMessage } from '@/services/realtime';
import { useMessagingData, FormattedConversation } from '@/hooks/useMessagingData';
import { ActiveSessionBanner } from '@/components/messages/ActiveSessionBanner';
import { MOCK_USERS } from '@/services/simulation';
import { PAGE_TITLE_CLASS } from '@/constants/theme';

export const Messages: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { openProfile } = useUserProfileModal();
  const queryClient = useQueryClient();
  const { 
    loading: dataLoading, 
    groupConversations, 
    directConversations, 
    userFriends,
    userGroups,
    activeSessionsMap,
    startDirectChatWithUser,
    getOrCreateGroupChat
  } = useMessagingData();

  // Active section tab: 'groups' | 'direct'
  const [activeCategory, setActiveCategory] = useState<'groups' | 'direct'>('groups');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<FormattedConversation | null>(null);

  // Chat message state
  const [inputMessage, setInputMessage] = useState('');
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  
  // New conversation modal
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [newChatTab, setNewChatTab] = useState<'direct' | 'groups'>('direct');
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetUserIdParam = searchParams.get('userId');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeConvRef = useRef<string | null>(null);
  const handledUserIdRef = useRef<string | null>(null);

  // Fetch conversation messages with React Query cache
  const { data: messages = [], isLoading: messagesLoading } = useQuery<RealtimeMessage[]>({
    queryKey: ['chat-messages', activeConvId],
    queryFn: () => (activeConvId ? (ChatService.getMessages(activeConvId) as Promise<RealtimeMessage[]>) : Promise.resolve([])),
    enabled: !!activeConvId && !activeConvId.startsWith('temp_group_'),
    staleTime: 2 * 60 * 1000,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversationMessages = useCallback(async (convId: string, groupOrUserObj: FormattedConversation) => {
    try {
      let targetConvId = convId;
      if (convId.startsWith('temp_group_') && groupOrUserObj.groupId) {
        const createdId = await getOrCreateGroupChat(groupOrUserObj.groupId);
        if (createdId) {
          targetConvId = createdId;
          groupOrUserObj.id = createdId;
        } else {
          return;
        }
      }

      if (targetConvId.startsWith('temp_group_')) {
        return;
      }

      setActiveConvId(targetConvId);
      activeConvRef.current = targetConvId;

      RealtimeService.subscribeToMessages(
        targetConvId,
        (newMessage: RealtimeMessage) => {
          queryClient.setQueryData(['chat-messages', targetConvId], (prev: RealtimeMessage[] = []) => {
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        },
        (updatedMessage: RealtimeMessage) => {
          queryClient.setQueryData(['chat-messages', targetConvId], (prev: RealtimeMessage[] = []) =>
            prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
          );
        },
        (deletedMessageId: string) => {
          queryClient.setQueryData(['chat-messages', targetConvId], (prev: RealtimeMessage[] = []) =>
            prev.filter((msg) => msg.id !== deletedMessageId)
          );
        }
      );
    } catch (err) {
      console.error('Error loading conversation messages:', err);
    }
  }, [getOrCreateGroupChat, queryClient]);

  const handleSelectConversation = useCallback((conv: FormattedConversation) => {
    if (searchParams.has('userId')) {
      setSearchParams({}, { replace: true });
    }

    if (activeConvRef.current && activeConvRef.current !== conv.id) {
      RealtimeService.unsubscribe(`messages:${activeConvRef.current}`);
    }

    setSelectedConversation(conv);
    setMobileShowChat(true);
    loadConversationMessages(conv.id, conv);
    ChatService.markConversationRead(conv.id);
  }, [searchParams, setSearchParams, loadConversationMessages]);

  // Set initial default selected conversation when data finishes loading (only if no targetUserId in URL)
  useEffect(() => {
    if (!selectedConversation && !targetUserIdParam) {
      if (activeCategory === 'groups' && groupConversations.length > 0) {
        handleSelectConversation(groupConversations[0]);
      } else if (activeCategory === 'direct' && directConversations.length > 0) {
        handleSelectConversation(directConversations[0]);
      }
    }
  }, [groupConversations, directConversations, activeCategory, targetUserIdParam, selectedConversation, handleSelectConversation]);

  // Handle direct navigation to a chat with a specific user (e.g. from Friends page)
  useEffect(() => {
    if (!targetUserIdParam || dataLoading || !user) return;

    if (
      selectedConversation &&
      !selectedConversation.isGroupChat &&
      selectedConversation.targetUserId === targetUserIdParam
    ) {
      if (searchParams.has('userId')) {
        setSearchParams({}, { replace: true });
      }
      return;
    }

    let isCancelled = false;

    const selectOrStartDirectChat = async () => {
      setActiveCategory('direct');

      const existing = directConversations.find(
        (c) => c.targetUserId === targetUserIdParam
      );

      if (existing) {
        handleSelectConversation(existing);
        handledUserIdRef.current = targetUserIdParam;
      } else if (handledUserIdRef.current !== targetUserIdParam) {
        handledUserIdRef.current = targetUserIdParam;
        const convId = await startDirectChatWithUser(targetUserIdParam);
        if (convId && !isCancelled) {
          const newlyLoaded = directConversations.find(
            (c) => c.id === convId || c.targetUserId === targetUserIdParam
          );
          if (newlyLoaded) {
            handleSelectConversation(newlyLoaded);
          }
          if (searchParams.has('userId')) {
            setSearchParams({}, { replace: true });
          }
        }
      }
    };

    selectOrStartDirectChat();

    return () => {
      isCancelled = true;
    };
  }, [targetUserIdParam, dataLoading, user, directConversations, selectedConversation, setSearchParams, searchParams, handleSelectConversation, startDirectChatWithUser]);

  // Clean up realtime subscriptions on unmount or conversation switch
  useEffect(() => {
    return () => {
      if (activeConvRef.current) {
        RealtimeService.unsubscribe(`messages:${activeConvRef.current}`);
      }
    };
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !user || !activeConvId) return;

    const content = inputMessage.trim();
    setInputMessage('');

    try {
      const sentMessage = await ChatService.sendMessage(activeConvId, content);
      if (sentMessage) {
        queryClient.setQueryData(['chat-messages', activeConvId], (prev: any[] = []) => {
          if (prev.some((m) => m.id === sentMessage.id)) return prev;
          return [...prev, sentMessage];
        });
        queryClient.invalidateQueries({ queryKey: ['messaging-data', user.id] });
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleStartDirectChat = async (friendUserId: string) => {
    setIsNewChatOpen(false);
    const convId = await startDirectChatWithUser(friendUserId);
    if (convId) {
      setActiveCategory('direct');
      const found = directConversations.find((c) => c.id === convId);
      if (found) {
        handleSelectConversation(found);
      }
    }
  };

  const handleStartGroupChat = async (group: any) => {
    setIsNewChatOpen(false);
    const convId = await getOrCreateGroupChat(group.id);
    if (convId) {
      setActiveCategory('groups');
      const existing = groupConversations.find((c) => c.id === convId || c.groupId === group.id);
      if (existing) {
        handleSelectConversation(existing);
      } else {
        const newGroupConv: FormattedConversation = {
          id: convId,
          isGroupChat: true,
          groupId: group.id,
          name: group.name,
          avatarUrl: isValidImageUrl(group.image_url) 
            ? group.image_url 
            : isValidImageUrl(group.avatar_url) 
              ? group.avatar_url 
              : isValidImageUrl(group.icon) 
                ? group.icon 
                : null,
          groupSubject: group.subject || null,
          latestMessage: null,
          activeSession: activeSessionsMap[group.id] || null,
          createdAt: group.created_at || null,
          updatedAt: group.updated_at || null,
        };
        handleSelectConversation(newGroupConv);
      }
    }
  };

  // Filter conversations based on search query
  const filteredGroupConversations = groupConversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.groupSubject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDirectConversations = directConversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentConversations =
    activeCategory === 'groups' ? filteredGroupConversations : filteredDirectConversations;

  // Format messages with iMessage/Slack-style timestamp grouping
  const displayMessages = messages.map((msg) => {
    const date = new Date(msg.created_at);
    const mockSender = MOCK_USERS.find((m) => m.id === msg.sender_id);
    return {
      id: msg.id,
      senderId: msg.sender_id,
      senderName: msg.profiles?.display_name || mockSender?.name || 'Member',
      senderAvatar: msg.profiles?.avatar_url,
      content: msg.content,
      timestamp: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      fullDate: date,
    };
  });

  const shouldShowDateSeparator = (currentIndex: number) => {
    if (currentIndex === 0) return true;
    const currentMsg = displayMessages[currentIndex];
    const previousMsg = displayMessages[currentIndex - 1];
    
    if (currentMsg.fullDate.toDateString() !== previousMsg.fullDate.toDateString()) return true;
    return currentMsg.fullDate.getTime() - previousMsg.fullDate.getTime() > 5 * 60 * 1000;
  };

  const formatDateSeparator = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const messageDate = date.toDateString();
    const timeString = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    if (messageDate === today.toDateString()) return `Today ${timeString}`;
    if (messageDate === yesterday.toDateString()) return `Yesterday ${timeString}`;
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${timeString}`;
  };

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className={PAGE_TITLE_CLASS}>Messages</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Connect with your study groups and friends in real time
          </p>
        </div>

        <Button
          onClick={() => setIsNewChatOpen(true)}
          size="sm"
          className="bg-brand hover:bg-brand-hover text-primary-foreground gap-1.5 shadow-sm rounded-xl font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </Button>
      </div>

      {/* Main Workspace Card */}
      <Card className="flex-1 min-h-0 border border-border bg-card shadow-sm overflow-hidden flex">
        {/* Left Panel: Conversation List Sidebar */}
        <div
          className={`w-full md:w-80 border-r border-border flex flex-col bg-card/40 ${
            mobileShowChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Category Tabs: Study Groups vs Direct Messages */}
          <div className="p-3 border-b border-border space-y-3">
            <div className="grid grid-cols-2 p-1 bg-muted/60 border border-border rounded-lg text-xs font-semibold">
              <button
                onClick={() => setActiveCategory('groups')}
                className={`py-1.5 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  activeCategory === 'groups'
                    ? 'bg-brand text-primary-foreground shadow-sm font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Study Groups</span>
                {groupConversations.length > 0 && (
                  <Badge
                    variant="secondary"
                    className={`px-1.5 py-0 text-[10px] h-4 font-bold ${
                      activeCategory === 'groups'
                        ? 'bg-primary-foreground/20 text-primary-foreground border-transparent'
                        : 'bg-muted/80 text-foreground'
                    }`}
                  >
                    {groupConversations.length}
                  </Badge>
                )}
              </button>

              <button
                onClick={() => setActiveCategory('direct')}
                className={`py-1.5 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  activeCategory === 'direct'
                    ? 'bg-brand text-primary-foreground shadow-sm font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Direct</span>
                {directConversations.length > 0 && (
                  <Badge
                    variant="secondary"
                    className={`px-1.5 py-0 text-[10px] h-4 font-bold ${
                      activeCategory === 'direct'
                        ? 'bg-primary-foreground/20 text-primary-foreground border-transparent'
                        : 'bg-muted/80 text-foreground'
                    }`}
                  >
                    {directConversations.length}
                  </Badge>
                )}
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeCategory === 'groups' ? 'Filter group chats...' : 'Filter direct chats...'}
                className="pl-8 h-8 text-xs bg-muted/60 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-brand"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div
            className={`flex-1 p-2 space-y-1 ${
              currentConversations.length === 0 ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar'
            }`}
          >
            {dataLoading ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin text-brand mb-2" />
                <span className="text-xs">Loading conversations...</span>
              </div>
            ) : currentConversations.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-xs">
                {searchQuery ? (
                  <p>No conversations matching &quot;{searchQuery}&quot;</p>
                ) : activeCategory === 'groups' ? (
                  <p>No study group chats found yet. Click &quot;New Chat&quot; or start a chat from your Study Groups page to say something!</p>
                ) : (
                  <p>No direct messages yet. Click &quot;New Chat&quot; to message a friend.</p>
                )}
              </div>
            ) : (
              currentConversations.map((conv) => {
                const isSelected = selectedConversation?.id === conv.id;
                const hasActiveSession = conv.isGroupChat && !!conv.activeSession;

                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center gap-3 relative ${
                      isSelected
                        ? 'bg-brand/10 border border-brand/30'
                        : 'hover:bg-muted/60 border border-transparent'
                    }`}
                  >
                    {/* Avatar with Active Group Session Indicator */}
                    <div className="relative shrink-0">
                      <Avatar className="w-10 h-10 border border-border">
                        {conv.avatarUrl && <AvatarImage src={conv.avatarUrl} alt={conv.name} />}
                        <AvatarFallback className="bg-brand text-primary-foreground font-bold text-xs">
                          {conv.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Live indicator badge for active group sessions */}
                      {hasActiveSession && (
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-background"></span>
                        </span>
                      )}
                    </div>

                    {/* Content preview */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-foreground truncate">
                          {conv.name}
                        </h4>
                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          {conv.latestMessage && (
                            <span className="text-[10px] text-muted-foreground font-medium">
                              {formatSidebarTimestamp(conv.latestMessage.createdAt)}
                            </span>
                          )}
                          {!isSelected && (conv.unreadCount ?? 0) > 0 && (
                            <span className="flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full bg-brand text-primary-foreground text-[9px] font-bold leading-none">
                              {(conv.unreadCount ?? 0) > 99 ? '99+' : conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-[11px] text-muted-foreground truncate">
                          {conv.latestMessage ? (
                            <span>
                              <span className="font-semibold text-foreground/90">
                                {conv.latestMessage.senderName}:{' '}
                              </span>
                              {conv.latestMessage.content}
                            </span>
                          ) : (
                            <span className="italic text-muted-foreground">No messages yet</span>
                          )}
                        </p>

                        {hasActiveSession && (
                          <Badge variant="outline" className="ml-1 px-1.5 py-0 text-[9px] bg-emerald-500/10 text-emerald-500 border-emerald-500/30 shrink-0 font-bold">
                            LIVE
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Chat Message Interface */}
        <div
          className={`flex-1 flex flex-col bg-card ${
            !mobileShowChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {selectedConversation ? (
            <>
              {/* Chat Panel Top Header */}
              <div className="p-3.5 border-b border-border flex items-center justify-between bg-card">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMobileShowChat(false)}
                    className="md:hidden p-1 h-8 w-8 text-gray-500"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>

                  <div
                    onClick={() => {
                      if (selectedConversation.isGroupChat && selectedConversation.groupId) {
                        navigate(`/groups?groupId=${selectedConversation.groupId}`);
                      }
                    }}
                    className={`flex items-center gap-3 ${
                      selectedConversation.isGroupChat && selectedConversation.groupId
                        ? 'cursor-pointer group hover:opacity-90 transition-opacity'
                        : ''
                    }`}
                    title={
                      selectedConversation.isGroupChat && selectedConversation.groupId
                        ? `Click to view ${selectedConversation.name} group page`
                        : undefined
                    }
                  >
                    <div className="relative">
                      <Avatar className="w-9 h-9 border border-gray-200 dark:border-gray-700">
                        {selectedConversation.avatarUrl && (
                          <AvatarImage src={selectedConversation.avatarUrl} alt={selectedConversation.name} />
                        )}
                        <AvatarFallback className="bg-brand text-primary-foreground font-bold text-xs">
                          {selectedConversation.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {selectedConversation.isGroupChat && selectedConversation.activeSession && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background animate-pulse"></span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5 group-hover:text-brand transition-colors">
                        <span>{selectedConversation.name}</span>
                        {selectedConversation.isGroupChat ? (
                          <Badge variant="secondary" className="text-[10px] font-normal py-0">
                            Group Chat
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-normal py-0 text-brand border-brand/30">
                            Direct
                          </Badge>
                        )}
                      </h3>
                      {selectedConversation.groupSubject && (
                        <p className="text-[11px] text-muted-foreground">
                          Subject: {selectedConversation.groupSubject}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* View Group button (for group chats) */}
                {selectedConversation.isGroupChat && selectedConversation.groupId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/groups?groupId=${selectedConversation.groupId}`)}
                    className="flex items-center gap-1.5 rounded-xl border border-border bg-card/90 hover:bg-brand/10 hover:border-brand/40 text-card-foreground hover:text-brand transition-all duration-200 shadow-sm px-3.5 h-9 text-xs font-semibold"
                  >
                    <BookOpen size={13} />
                    <span>View Group</span>
                    <ExternalLink size={11} className="ml-0.5 opacity-60" />
                  </Button>
                )}
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-2">
                    <Loader2 size={24} className="animate-spin text-brand" />
                    <span className="text-xs">Loading message history...</span>
                  </div>
                ) : displayMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                    <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center text-brand mb-2">
                      <MessageSquare size={24} />
                    </div>
                    <p className="text-sm font-medium text-foreground">No messages yet</p>
                    <p className="text-xs text-muted-foreground">Send a message to start the conversation!</p>
                  </div>
                ) : (
                  displayMessages.map((msg, index) => {
                    const isMe = user?.id ? msg.senderId === user.id : msg.senderName === 'You';
                    const prevMsg = index > 0 ? displayMessages[index - 1] : null;
                    const showSenderName = selectedConversation.isGroupChat && !isMe && (!prevMsg || prevMsg.senderId !== msg.senderId);

                    return (
                      <div
                        key={msg.id || index}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        {showSenderName && (
                          <span className="text-[11px] text-muted-foreground font-semibold mb-1 ml-1">
                            {msg.senderName}
                          </span>
                        )}
                        <div className="flex items-end gap-2 max-w-[80%] sm:max-w-[70%]">
                          {!isMe && (
                            <Avatar className="w-7 h-7 flex-shrink-0 mb-1">
                              <AvatarImage src={msg.senderAvatar || undefined} alt={msg.senderName} />
                              <AvatarFallback className="bg-brand/20 text-brand font-bold text-[10px]">
                                {(msg.senderName || 'U').substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                              isMe
                                ? 'bg-brand text-primary-foreground rounded-br-none shadow-xs font-medium'
                                : 'bg-muted text-foreground rounded-bl-none border border-border/60'
                            }`}
                          >
                            <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                            <div
                              className={`text-[10px] mt-1 text-right ${
                                isMe ? 'text-primary-foreground/80' : 'text-muted-foreground'
                              }`}
                            >
                              {msg.timestamp}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <div className="p-3 border-t border-border bg-card shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-xl border-border bg-muted/40 text-foreground text-sm focus-visible:ring-brand"
                  />
                  <Button
                    type="submit"
                    disabled={!inputMessage.trim()}
                    className="h-10 w-10 shrink-0 bg-brand hover:bg-brand-hover text-primary-foreground rounded-lg shadow-sm"
                  >
                    <Send size={16} />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 mb-3">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                Select a conversation
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mt-1">
                Choose a Study Group or Direct Message from the left list to view messages and live study session status.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* New Chat Modal */}
      <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Start a New Chat</DialogTitle>
            <DialogDescription className="text-xs">
              Select a friend or study group to begin a conversation.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 p-1 bg-muted/50 border border-border rounded-lg text-xs font-semibold my-1">
            <button
              type="button"
              onClick={() => setNewChatTab('direct')}
              className={`py-1.5 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                newChatTab === 'direct'
                  ? 'bg-brand text-primary-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Direct Message</span>
            </button>
            <button
              type="button"
              onClick={() => setNewChatTab('groups')}
              className={`py-1.5 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                newChatTab === 'groups'
                  ? 'bg-brand text-primary-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Study Group</span>
            </button>
          </div>

          {newChatTab === 'direct' ? (
            <div
              className={`max-h-60 space-y-1 py-2 ${
                userFriends.length === 0 ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar'
              }`}
            >
              {userFriends.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  You haven&apos;t added any friends yet. Go to Friends to connect!
                </div>
              ) : (
                userFriends.map((friend) => (
                  <button
                    key={friend.user_id}
                    onClick={() => handleStartDirectChat(friend.user_id)}
                    className="w-full p-2 rounded-lg hover:bg-muted/60 border border-transparent hover:border-border flex items-center gap-3 transition-colors text-left"
                  >
                    <Avatar className="w-8 h-8 border border-border">
                      {friend.avatar_url && <AvatarImage src={friend.avatar_url} alt={friend.display_name} />}
                      <AvatarFallback className="bg-brand text-white font-bold text-xs">
                        {friend.display_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">
                        {friend.display_name}
                      </h4>
                      <p className="text-[10px] text-muted-foreground">{friend.email}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div
              className={`max-h-60 space-y-1 py-2 ${
                userGroups.length === 0 ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar'
              }`}
            >
              {userGroups.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-500">
                  You are not a member of any study groups yet.
                </div>
              ) : (
                userGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => handleStartGroupChat(group)}
                    className="w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors text-left"
                  >
                    <Avatar className="w-8 h-8 border">
                      {isValidImageUrl(group.image_url || group.avatar_url || group.icon) && (
                        <AvatarImage src={(group.image_url || group.avatar_url || group.icon)!} alt={group.name} />
                      )}
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xs">
                        {group.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="text-xs font-semibold text-gray-900 dark:text-white">
                        {group.name}
                      </h4>
                      {group.subject && (
                        <p className="text-[10px] text-gray-500">{group.subject}</p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Messages;
