import { useState, useEffect } from 'react';
import { Users, MessageSquare, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChatPopup } from '@/components/chat/ChatPopup';
import { FriendsService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';

interface Friend {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'idle';
  activity: string;
}

export const FriendsList = () => {
  const { user } = useAuth();
  const [activeChat, setActiveChat] = useState<Friend | null>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFriends();
  }, [user]);

  const loadFriends = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const userFriends = await FriendsService.getUserFriends();
      setFriends(userFriends);
    } catch (err) {
      console.error('Error loading friends:', err);
      setError('Failed to load friends. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Mock data fallback
  const mockFriends: Friend[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      avatar: 'bg-blue-500',
      status: 'online',
      activity: 'Studying Calculus'
    },
    {
      id: '2',
      name: 'Mike Chen',
      avatar: 'bg-green-500',
      status: 'online',
      activity: 'Working on Physics'
    },
    {
      id: '3',
      name: 'Emma Wilson',
      avatar: 'bg-purple-500',
      status: 'idle',
      activity: 'Taking a break'
    },
    {
      id: '4',
      name: 'John Smith',
      avatar: 'bg-orange-500',
      status: 'offline',
      activity: 'Out for lunch'
    },
  ];

  // Use fetched friends or fallback to mock data
  const displayFriends = friends.length > 0 ? friends.map(friend => ({
    id: friend.id,
    name: friend.display_name || friend.email || 'Unknown',
    avatar: friend.avatar_url || 'bg-gray-500',
    status: 'offline' as const, // Could be updated with real-time status
    activity: 'Studying'
  })) : mockFriends;

  if (loading) {
    return (
      <Card className="border-0 shadow-md dark:bg-gray-800 h-full">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-800 dark:text-white">
            <Users size={20} className="mr-2 text-green-600" />
            Friends Online
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600 dark:text-gray-300">Loading friends...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-md dark:bg-gray-800 h-full">
      <CardHeader>
        <CardTitle className="flex items-center text-gray-800 dark:text-white">
          <Users size={20} className="mr-2 text-green-600" />
          Friends Online
        </CardTitle>
      </CardHeader>

      {error && (
        <div className="px-6 pb-2">
          <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        </div>
      )}

      <CardContent>
        <div className="space-y-3">
          {displayFriends.map((friend) => (
            <div key={friend.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className={`w-10 h-10 ${friend.avatar} rounded-full flex items-center justify-center`}>
                    <span className="text-white font-medium text-sm">{friend.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${friend.status === 'online' ? 'bg-green-500' : 'bg-gray-400'} rounded-full border-2 border-white dark:border-gray-700`}></div>
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-800 dark:text-white">{friend.name}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">{friend.activity}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveChat(friend)}
                className="dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <MessageSquare size={14} />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Chat Popup */}
      {activeChat && (
        <ChatPopup
          isOpen={!!activeChat}
          onClose={() => setActiveChat(null)}
          groupName={`Chat with ${activeChat.name}`}
        />
      )}
    </Card>
  );
};
