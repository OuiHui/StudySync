import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatService } from '@/services/database';
import { RealtimeService, RealtimeMessage } from '@/services/realtime';
import { useAuth } from '@/contexts/AuthContext';

interface SessionChatProps {
  groupId?: string;
  groupName: string;
}

const getOrdinalSuffix = (day: number) => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1:  return "st";
    case 2:  return "nd";
    case 3:  return "rd";
    default: return "th";
  }
};

export const SessionChat = ({ groupId, groupName }: SessionChatProps) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let activeConversationId: string | null = null;

    const setupChat = async () => {
      if (!groupId) {
        setMessages([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const conversation = await ChatService.getOrCreateGroupConversation(groupId);
        setConversationId(conversation.id);
        activeConversationId = conversation.id;

        const groupMessages = await ChatService.getMessages(conversation.id);
        setMessages(groupMessages);

        RealtimeService.subscribeToMessages(
          conversation.id,
          (newMessage: RealtimeMessage) => {
            setMessages(prev => {
              if (prev.some(msg => msg.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
          },
          (updatedMessage: RealtimeMessage) => {
            setMessages(prev =>
              prev.map(msg => (msg.id === updatedMessage.id ? updatedMessage : msg))
            );
          },
          (deletedMessageId: string) => {
            setMessages(prev => prev.filter(msg => msg.id !== deletedMessageId));
          }
        );
      } catch (err) {
        console.error('Error loading session chat:', err);
      } finally {
        setLoading(false);
      }
    };

    setupChat();

    return () => {
      if (activeConversationId) {
        RealtimeService.unsubscribe(`messages:${activeConversationId}`);
      }
    };
  }, [groupId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !conversationId) return;

    const content = message.trim();
    setMessage('');

    try {
      const sentMsg = await ChatService.sendMessage(conversationId, content);
      if (sentMsg) {
        setMessages(prev => {
          if (prev.some(msg => msg.id === sentMsg.id)) return prev;
          return [...prev, sentMsg];
        });
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <Card className="border-0 shadow-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm flex flex-col h-full min-h-0">
      <CardHeader className="py-3 shrink-0 border-b dark:border-gray-700/50 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center text-gray-800 dark:text-white">
          <MessageSquare size={16} className="mr-2 text-indigo-500" />
          Group Chat ({groupName})
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-3 flex flex-col flex-1 min-h-0 justify-between gap-3">
        {/* Messages list */}
        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
              <p className="text-xs">No messages yet.</p>
              <p className="text-[10px] text-gray-400">Be the first to say hi!</p>
            </div>
          ) : (
            <ScrollArea className="h-full pr-2">
              <div className="space-y-3">
                {messages.map((msg, index) => {
                  const isSelf = msg.sender_id === user?.id;
                  const senderName = msg.profiles?.display_name || 'Anonymous';
                  const msgDate = new Date(msg.created_at);
                  const timestamp = msgDate.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  // Check if we need to show a date separator
                  let showDateSeparator = false;
                  if (index === 0) {
                    showDateSeparator = true;
                  } else {
                    const prevMsgDate = new Date(messages[index - 1].created_at);
                    showDateSeparator = msgDate.toDateString() !== prevMsgDate.toDateString();
                  }

                  const dateSeparatorText = (() => {
                    const day = msgDate.getDate();
                    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                    const month = monthNames[msgDate.getMonth()];
                    const year = msgDate.getFullYear();
                    return `${month} ${day}${getOrdinalSuffix(day)}, ${year}`;
                  })();

                  return (
                    <div key={msg.id} className="space-y-3">
                      {showDateSeparator && (
                        <div className="flex justify-center my-4 select-none">
                          <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                            {dateSeparatorText}
                          </p>
                        </div>
                      )}
                      <div
                        className={`flex flex-col max-w-[85%] ${isSelf ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                      >
                        <div className="flex items-center space-x-1.5 mb-0.5">
                          <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                            {senderName}
                          </span>
                          <span className="text-[8px] text-gray-400">{timestamp}</span>
                        </div>
                        <div
                          className={`p-2.5 rounded-2xl text-xs leading-relaxed ${
                            isSelf
                              ? 'bg-indigo-600 text-white rounded-tr-none'
                              : 'bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200/20'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Input box */}
        <form onSubmit={handleSend} className="flex space-x-2 shrink-0 border-t dark:border-gray-700/50 pt-2.5">
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="h-8 text-xs flex-1"
            disabled={loading || !conversationId}
          />
          <Button
            type="submit"
            size="sm"
            className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white px-3"
            disabled={loading || !message.trim() || !conversationId}
          >
            <Send size={12} />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
