
import { useState, useEffect } from 'react';
import { X, Send, Users, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChatService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';

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
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && groupId) {
      loadMessages();
    }
  }, [isOpen, groupId]);

  const loadMessages = async () => {
    if (!groupId) return;
    
    try {
      setLoading(true);
      setError(null);
      const groupMessages = await ChatService.getMessages(groupId);
      setMessages(groupMessages);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
      userId: '1',
      userName: 'You',
      message: 'Perfect! Let\'s start with chapter 7',
      timestamp: '14:35',
      avatar: '👤'
    }
  ];

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
    if (!message.trim() || !user || !groupId) return;
    
    try {
      await ChatService.sendMessage({
        conversation_id: groupId,
        sender_id: user.id,
        content: message,
        message_type: 'text'
      });
      
      setMessage('');
      await loadMessages(); // Reload messages to show the new one
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
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
              <div key={msg.id} className={`flex ${msg.userId === '1' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${msg.userId === '1' ? 'order-2' : 'order-1'}`}>
                  <div className={`px-3 py-2 rounded-lg ${
                    msg.userId === '1' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}>
                    {msg.userId !== '1' && (
                      <div className="flex items-center space-x-1 mb-1">
                        <span className="text-xs">{msg.avatar}</span>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{msg.userName}</p>
                      </div>
                    )}
                    <p className="text-sm">{msg.message}</p>
                    <p className={`text-xs mt-1 ${
                      msg.userId === '1' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
                {msg.userId !== '1' && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-sm mr-2 order-0">
                    {msg.avatar}
                  </div>
                )}
              </div>
              ))
            )}
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
