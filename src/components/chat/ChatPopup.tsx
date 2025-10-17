
import { useState } from 'react';
import { X, Send, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

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
}

export const ChatPopup = ({ isOpen, onClose, groupName }: ChatPopupProps) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
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
  ]);

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        userId: '1',
        userName: 'You',
        message: message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: '👤'
      };
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
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
      <Card className="w-full max-w-md h-[500px] border-0 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Users size={18} className="text-blue-500" />
            <CardTitle className="text-lg">{groupName} Chat</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={18} />
          </Button>
        </CardHeader>
        
        <CardContent className="flex flex-col h-[400px] p-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.userId === '1' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${msg.userId === '1' ? 'order-2' : 'order-1'}`}>
                  <div className={`px-3 py-2 rounded-lg ${
                    msg.userId === '1' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {msg.userId !== '1' && (
                      <div className="flex items-center space-x-1 mb-1">
                        <span className="text-xs">{msg.avatar}</span>
                        <p className="text-xs font-medium text-gray-600">{msg.userName}</p>
                      </div>
                    )}
                    <p className="text-sm">{msg.message}</p>
                    <p className={`text-xs mt-1 ${
                      msg.userId === '1' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
                {msg.userId !== '1' && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm mr-2 order-0">
                    {msg.avatar}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="border-t p-4">
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
