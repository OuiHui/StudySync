
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

  // Mock data fallback
  const mockMessages: ChatMessage[] = [
    {
      id: '1',
      userId: '2',
      userName: 'Sarah Chen',
      message: 'Hey everyone! Ready for today\'s study session?',
      timestamp: '14:30',
      avatar: '👩'
    },
    {
      id: '2',
      userId: '3',
      userName: 'Mike Johnson',
      message: 'Yes! I brought my calculus notes',
      timestamp: '14:32',
      avatar: '👨'
    },
    {
      id: '3',
      userId: user?.id || 'current-user',
      userName: 'You',
      message: 'Perfect! Let\'s start with chapter 7',
      timestamp: '14:35',
      avatar: '👤'
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      if (groupId) {
        loadMessages();
        setupRealtimeSubscriptions();
      } else {
        // If no groupId, just show empty state
        setMessages([]);
        setLoading(false);
      }
    }

    return () => {
      // Cleanup subscriptions when component unmounts or closes
      if (groupId) {
        RealtimeService.unsubscribe(`messages:${groupId}`);
        RealtimeService.unsubscribe(`presence:${groupId}`);
        RealtimeService.untrackPresence(groupId);
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
    if (!groupId) return;

    RealtimeService.subscribeToMessages(
      groupId,
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

  // Use fetched messages or fallback to mock data
  const displayMessages = messages.length > 0 ? messages.map(msg => ({
    id: msg.id,
    userId: msg.sender_id,
    userName: msg.profiles?.display_name || 'Unknown User',
    message: msg.content,
    timestamp: new Date(msg.created_at).toLocaleTimeString(),
    avatar: msg.profiles?.avatar_url || '👤'
  })) : mockMessages;

  const sendMessage = async () => {
    if (!message.trim() || !user || !conversationId) return;
    
    try {
      await ChatService.sendMessage(conversationId, message.trim());
      
      setMessage(''); // Clear input after sending
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
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
              displayMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.userId === user?.id ? 'justify-end' : 'justify-start'}`}>
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
                placeholder="Type your message..."
                className="flex-1 min-h-[40px] max-h-[100px] resize-none"
                rows={1}
              />
              <Button onClick={sendMessage} size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                <Send size={16} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
