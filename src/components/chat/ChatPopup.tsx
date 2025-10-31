
import { useState, useEffect, useRef } from 'react';
import { X, Send, Users, Loader2, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ChatService } from '@/services/database';
import { RealtimeService, RealtimeMessage } from '@/services/realtime';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
  avatar: string;
}

interface ChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
  groupName: string;
  groupId?: string;
}

export const ChatPopup = ({ isOpen, onClose, groupName, groupId }: ChatPopupProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, any[]>>({});
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && groupId) {
      loadMessages();
      setupRealtimeSubscriptions();
    } else if (isOpen && !groupId) {
      // If no groupId, just show empty state
      setMessages([]);
      setLoading(false);
    }

    return () => {
      // Cleanup subscriptions when popup closes
      if (!isOpen) {
        if (conversationId) {
          RealtimeService.unsubscribe(`messages:${conversationId}`);
        }
        if (groupId) {
          RealtimeService.unsubscribe(`presence:${groupId}`);
          RealtimeService.untrackPresence(groupId);
        }
      }
    };
  }, [isOpen, groupId]);

  const setupRealtimeSubscriptions = async () => {
    if (!groupId || !user) return;

    try {
      // Set up presence tracking
      await RealtimeService.trackPresence(groupId, {
        id: user.id,
        name: user.user_metadata?.display_name || user.email || 'Anonymous',
        avatar: user.user_metadata?.avatar_url,
      });

      // Subscribe to presence updates
      RealtimeService.subscribeToPresence(groupId, (presences) => {
        setOnlineUsers(presences);
      });

      // Subscribe to new messages (will be set up after we get conversation ID)
    } catch (error) {
      console.error('Error setting up realtime subscriptions:', error);
    }
  };

  const setupMessageSubscription = (convId: string) => {
    if (!convId) return;

    RealtimeService.subscribeToMessages(
      convId,
      (newMessage: RealtimeMessage) => {
        setMessages(prev => [...prev, newMessage]);
        
        // Show toast notification for messages from other users
        if (newMessage.sender_id !== user?.id) {
          toast({
            title: "New message",
            description: `${newMessage.profiles?.display_name || 'Someone'}: ${newMessage.content}`,
          });
        }
      },
      (updatedMessage: RealtimeMessage) => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === updatedMessage.id ? updatedMessage : msg
          )
        );
      },
      (deletedMessageId: string) => {
        setMessages(prev => 
          prev.filter(msg => msg.id !== deletedMessageId)
        );
      }
    );
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!groupId) {
        console.warn('No groupId provided');
        setMessages([]);
        setLoading(false);
        return;
      }
      
      // First, get or create conversation for the group
      const conversation = await ChatService.getOrCreateGroupConversation(groupId);
      setConversationId(conversation.id);
      
      // Then load messages for that conversation
      const groupMessages = await ChatService.getMessages(conversation.id);
      setMessages(groupMessages);
      
      // Set up real-time message subscription
      setupMessageSubscription(conversation.id);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Transform messages for display with date grouping
  const displayMessages = messages.map(msg => {
    const date = new Date(msg.created_at);
    return {
      id: msg.id,
      userId: msg.sender_id,
      userName: msg.profiles?.display_name || 'Unknown User',
      message: msg.content,
      timestamp: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      fullDate: date,
      dateString: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      avatar: msg.profiles?.avatar_url || '👤'
    };
  });

  // Helper function to check if we need a date separator
  const shouldShowDateSeparator = (currentIndex: number) => {
    if (currentIndex === 0) return true; // Always show for first message
    
    const currentMsg = displayMessages[currentIndex];
    const previousMsg = displayMessages[currentIndex - 1];
    
    // Check if dates are different
    const currentDate = currentMsg.fullDate.toDateString();
    const previousDate = previousMsg.fullDate.toDateString();
    
    return currentDate !== previousDate;
  };

  // Helper function to format date separator
  const formatDateSeparator = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const messageDate = date.toDateString();
    const todayDate = today.toDateString();
    const yesterdayDate = yesterday.toDateString();
    
    if (messageDate === todayDate) return 'Today';
    if (messageDate === yesterdayDate) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  const sendMessage = async () => {
    if (!message.trim() || !user || !conversationId) return;
    
    try {
      const messageContent = message.trim();
      setMessage(''); // Clear input immediately
      
      // Send message to backend
      const sentMessage = await ChatService.sendMessage(conversationId, messageContent);
      
      // Add message to local state immediately (optimistic update)
      if (sentMessage) {
        setMessages(prev => [...prev, sentMessage]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md h-[500px] border-0 shadow-xl dark:bg-gray-800">
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Users size={18} className="text-blue-500" />
            <CardTitle className="text-lg dark:text-white">{groupName} Chat</CardTitle>
            {Object.keys(onlineUsers).length > 0 && (
              <Badge variant="secondary" className="ml-2">
                <Circle className="w-2 h-2 fill-green-500 text-green-500 mr-1" />
                {Object.keys(onlineUsers).length} online
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={18} />
          </Button>
        </CardHeader>
        
        {error && (
          <div className="px-4 pt-2">
            <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <AlertDescription className="text-red-800 dark:text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        <CardContent className="flex flex-col h-[400px] p-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600 dark:text-gray-300">Loading messages...</span>
              </div>
            ) : displayMessages.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500 dark:text-gray-400">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              displayMessages.map((msg, index) => (
                <div key={msg.id}>
                  {/* Date Separator */}
                  {shouldShowDateSeparator(index) && (
                    <div className="flex justify-center my-4">
                      <div className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          {formatDateSeparator(msg.fullDate)}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Message */}
                  <div className={`flex ${msg.userId === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] ${msg.userId === user?.id ? 'order-2' : 'order-1'}`}>
                      <div className={`px-3 py-2 rounded-lg ${
                        msg.userId === user?.id 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        {msg.userId !== user?.id && (
                          <div className="flex items-center space-x-1 mb-1">
                            <span className="text-xs">{msg.avatar}</span>
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{msg.userName}</p>
                          </div>
                        )}
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-xs mt-1 ${
                          msg.userId === user?.id ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {msg.timestamp}
                        </p>
                      </div>
                    </div>
                    {msg.userId !== user?.id && (
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-sm mr-2 order-0">
                        {msg.avatar}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t dark:border-gray-700 p-4">
            <div className="flex space-x-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={loading ? "Loading chat..." : "Type your message..."}
                className="flex-1 min-h-[40px] max-h-[100px] resize-none"
                rows={1}
                disabled={loading}
              />
              <Button 
                onClick={sendMessage} 
                size="sm" 
                className="bg-blue-500 hover:bg-blue-600 text-white"
                disabled={!message.trim() || !conversationId || loading}
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
