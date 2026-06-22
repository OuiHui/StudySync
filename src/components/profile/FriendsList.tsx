import { Users, UserMinus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Friend } from '@/hooks/useFriends';
import { getInitials, getDisplayName } from './FriendSearch';

interface FriendsListProps {
  friends: Friend[];
  handleRemoveFriend: (friendshipId: string, friendName: string) => void;
}

export const FriendsList = ({ friends, handleRemoveFriend }: FriendsListProps) => {
  return (
    <Card className="border-0 shadow-md dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center text-gray-800 dark:text-white">
          <Users size={20} className="mr-2 text-purple-500" />
          Friends ({friends.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {friends.length === 0 ? (
          <div className="text-center py-8">
            <Users size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              No friends yet. Search for users to add friends!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {friends.map((friend) => (
              <div 
                key={friend.id} 
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                    {friend.avatar_url ? (
                      <img 
                        src={friend.avatar_url} 
                        alt="Avatar" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-sm font-bold">
                        {getInitials(friend.display_name, friend.email)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {getDisplayName(friend.display_name, friend.email)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{friend.email}</p>
                  </div>
                </div>
                <Button 
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveFriend(friend.friendshipId, getDisplayName(friend.display_name, friend.email))}
                  className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <UserMinus size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
