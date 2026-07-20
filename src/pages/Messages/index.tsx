import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  ChevronLeft
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const [searchParams] = useSearchParams();
  const targetUserIdParam = searchParams.get('userId');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeConvRef = useRef<string | null>(null);
  const handledUserIdRef = useRef<string | null>(null);

  // Fetch conversation messages with React Query cache
  const { data: messages = [], isLoading: messagesLoading } = useQuery<any[]>({
    queryKey: ['chat-messages', activeConvId],
    queryFn: () => (activeConvId ? ChatService.getMessages(activeConvId) : Promise.resolve([])),
    enabled: !!activeConvId && !activeConvId.startsWith('temp_group_'),
    staleTime: 2 * 60 * 1000,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set initial default selected conversation when data finishes loading (only if no targetUserId in URL)
  useEffect(() => {
    if (!selectedConversation && !targetUserIdParam) {
      if (activeCategory === 'groups' && groupConversations.length > 0) {
        handleSelectConversation(groupConversations[0]);
      } else if (activeCategory === 'direct' && directConversations.length > 0) {
        handleSelectConversation(directConversations[0]);
      }
    }
  }, [groupConversations, directConversations, activeCategory, targetUserIdParam, selectedConversation]);

  // Handle direct navigation to a chat with a specific user (e.g. from Friends page)
  useEffect(() => {
    if (!targetUserIdParam || dataLoading || !user) return;

    if (
      selectedConversation &&
      !selectedConversation.isGroupChat &&
      selectedConversation.targetUserId === targetUserIdParam
    ) {
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
        }
      }
    };

    selectOrStartDirectChat();

    return () => {
      isCancelled = true;
    };
  }, [targetUserIdParam, dataLoading, user, directConversations, selectedConversation]);

  // Clean up realtime subscriptions on unmount or conversation switch
  useEffect(() => {
    return () => {
      if (activeConvRef.current) {
        RealtimeService.unsubscribe(`messages:${activeConvRef.current}`);
      }
    };
  }, []);

  const loadConversationMessages = async (convId: string, groupOrUserObj: FormattedConversation) => {
    try {
      let targetConvId = convId;
      // If it's a temporary group conversation that hasn't been created in backend DB yet
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

      // Subscribe to realtime messages
      RealtimeService.subscribeToMessages(
        targetConvId,
        (newMessage: RealtimeMessage) => {
          queryClient.setQueryData(['chat-messages', targetConvId], (prev: any[] = []) => {
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        },
        (updatedMessage: RealtimeMessage) => {
          queryClient.setQueryData(['chat-messages', targetConvId], (prev: any[] = []) =>
            prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
          );
        },
        (deletedMessageId: string) => {
          queryClient.setQueryData(['chat-messages', targetConvId], (prev: any[] = []) =>
            prev.filter((msg) => msg.id !== deletedMessageId)
          );
        }
      );
    } catch (err) {
      console.error('Error loading conversation messages:', err);
    }
  };

  const handleSelectConversation = (conv: FormattedConversation) => {
    if (activeConvRef.current && activeConvRef.current !== conv.id) {
      RealtimeService.unsubscribe(`messages:${activeConvRef.current}`);
    }

    setSelectedConversation(conv);
    setMobileShowChat(true);
    loadConversationMessages(conv.id, conv);
  };

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-500" />
            Messages
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Connect with your study groups and friends in real time
          </p>
        </div>

        <Button
          onClick={() => setIsNewChatOpen(true)}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </Button>
      </div>

      {/* Main Workspace Card */}
      <Card className="flex-1 min-h-0 border border-gray-200 dark:border-gray-800 bg-card shadow-sm overflow-hidden flex">
        {/* Left Panel: Conversation List Sidebar */}
        <div
          className={`w-full md:w-80 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-gray-50/50 dark:bg-gray-900/40 ${
            mobileShowChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Category Tabs: Study Groups vs Direct Messages */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-800 space-y-3">
            <div className="grid grid-cols-2 p-1 bg-gray-200/60 dark:bg-gray-800/80 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setActiveCategory('groups')}
                className={`py-1.5 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  activeCategory === 'groups'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Study Groups</span>
                {groupConversations.length > 0 && (
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4">
                    {groupConversations.length}
                  </Badge>
                )}
              </button>

              <button
                onClick={() => setActiveCategory('direct')}
                className={`py-1.5 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  activeCategory === 'direct'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Direct</span>
                {directConversations.length > 0 && (
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4">
                    {directConversations.length}
                  </Badge>
                )}
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeCategory === 'groups' ? 'Filter group chats...' : 'Filter direct chats...'}
                className="pl-8 h-8 text-xs bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
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
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500 mb-2" />
                <span className="text-xs">Loading conversations...</span>
              </div>
            ) : currentConversations.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-xs">
                {searchQuery ? (
                  <p>No conversations matching &quot;{searchQuery}&quot;</p>
                ) : activeCategory === 'groups' ? (
                  <p>No study group chats found. Join a study group to start chatting!</p>
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
                        ? 'bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800/60 border border-transparent'
                    }`}
                  >
                    {/* Avatar with Active Group Session Indicator */}
                    <div className="relative shrink-0">
                      <Avatar className="w-10 h-10 border border-gray-200 dark:border-gray-700">
                        {conv.avatarUrl && <AvatarImage src={conv.avatarUrl} alt={conv.name} />}
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xs">
                          {conv.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Live indicator badge for active group sessions */}
                      {hasActiveSession && (
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-gray-900"></span>
                        </span>
                      )}
                    </div>

                    {/* Content preview */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                          {conv.name}
                        </h4>
                        {conv.latestMessage && (
                          <span className="text-[10px] text-gray-400 shrink-0 ml-1">
                            {new Date(conv.latestMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                          {conv.latestMessage ? (
                            <span>
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {conv.latestMessage.senderName}:{' '}
                              </span>
                              {conv.latestMessage.content}
                            </span>
                          ) : (
                            <span className="italic text-gray-400">No messages yet</span>
                          )}
                        </p>

                        {hasActiveSession && (
                          <Badge variant="outline" className="ml-1 px-1.5 py-0 text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 shrink-0">
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
              <div className="p-3.5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-card">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMobileShowChat(false)}
                    className="md:hidden p-1 h-8 w-8 text-gray-500"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>

                  <div className="relative">
                    <Avatar className="w-9 h-9 border border-gray-200 dark:border-gray-700">
                      {selectedConversation.avatarUrl && (
                        <AvatarImage src={selectedConversation.avatarUrl} alt={selectedConversation.name} />
                      )}
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xs">
                        {selectedConversation.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {selectedConversation.isGroupChat && selectedConversation.activeSession && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900 animate-pulse"></span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      {selectedConversation.name}
                      {selectedConversation.isGroupChat ? (
                        <Badge variant="secondary" className="text-[10px] font-normal py-0">
                          Group Chat
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] font-normal py-0 text-blue-500 border-blue-500/30">
                          Direct
                        </Badge>
                      )}
                    </h3>
                    {selectedConversation.groupSubject && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Subject: {selectedConversation.groupSubject}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Group Study Session Banner / Popup */}
              {selectedConversation.isGroupChat && selectedConversation.activeSession && (
                <ActiveSessionBanner
                  session={selectedConversation.activeSession}
                  groupName={selectedConversation.name}
                />
              )}

              {/* Message List */}
              <div
                className={`flex-1 p-4 space-y-4 ${
                  displayMessages.length === 0 ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar'
                }`}
              >
                {messagesLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
                    <span className="text-xs">Loading conversation history...</span>
                  </div>
                ) : displayMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mb-2">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      No messages here yet
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mt-1">
                      Say hello to start the conversation with {selectedConversation.name}!
                    </p>
                  </div>
                ) : (
                  displayMessages.map((msg, index) => {
                    const isSelf = msg.senderId === user?.id;

                    return (
                      <div key={msg.id} className="space-y-1">
                        {shouldShowDateSeparator(index) && (
                          <div className="flex justify-center my-3 select-none">
                            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-0.5 rounded-full border border-gray-200 dark:border-gray-700">
                              {formatDateSeparator(msg.fullDate)}
                            </span>
                          </div>
                        )}

                        <div className={`flex ${isSelf ? 'justify-end' : 'justify-start'} gap-2 items-end`}>
                          {!isSelf && (
                            <button
                              onClick={() => openProfile(msg.senderId)}
                              className="shrink-0 mb-1 focus:outline-none transition-transform hover:scale-105"
                              title={msg.senderName}
                            >
                              <Avatar className="w-7 h-7 border border-gray-200 dark:border-gray-700">
                                {msg.senderAvatar && <AvatarImage src={msg.senderAvatar} alt={msg.senderName} />}
                                <AvatarFallback className="bg-gray-300 dark:bg-gray-700 text-[10px] text-gray-800 dark:text-gray-200 font-bold">
                                  {msg.senderName.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </button>
                          )}

                          <div className={`max-w-[75%] flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                            {!isSelf && (
                              <button
                                onClick={() => openProfile(msg.senderId)}
                                className="text-[10px] font-semibold text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 mb-0.5 ml-1 transition-colors"
                              >
                                {msg.senderName}
                              </button>
                            )}

                            <div
                              className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-xs ${
                                isSelf
                                  ? 'bg-blue-600 text-white rounded-br-none'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none border border-gray-200 dark:border-gray-700'
                              }`}
                            >
                              <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                            </div>
                            <span className="text-[9px] text-gray-400 mt-0.5 px-1">{msg.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Controls */}
              <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-card">
                <div className="flex items-center gap-2">
                  <Textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={`Message ${selectedConversation.name}...`}
                    className="flex-1 min-h-[40px] max-h-[100px] resize-none text-xs bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-lg p-2.5"
                    rows={1}
                  />

                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || messagesLoading}
                    size="icon"
                    className="h-10 w-10 shrink-0 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
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

      {/* New Direct Chat Modal */}
      <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Start a New Direct Chat</DialogTitle>
            <DialogDescription className="text-xs">
              Select a friend to begin a private 1-on-1 conversation.
            </DialogDescription>
          </DialogHeader>

          <div
            className={`max-h-60 space-y-1 py-2 ${
              userFriends.length === 0 ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar'
            }`}
          >
            {userFriends.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-500">
                You haven&apos;t added any friends yet. Go to Find Friends to connect!
              </div>
            ) : (
              userFriends.map((friend) => (
                <button
                  key={friend.user_id}
                  onClick={() => handleStartDirectChat(friend.user_id)}
                  className="w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors text-left"
                >
                  <Avatar className="w-8 h-8 border">
                    {friend.avatar_url && <AvatarImage src={friend.avatar_url} alt={friend.display_name} />}
                    <AvatarFallback className="bg-blue-600 text-white font-bold text-xs">
                      {friend.display_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 dark:text-white">
                      {friend.display_name}
                    </h4>
                    <p className="text-[10px] text-gray-500">{friend.email}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Messages;
