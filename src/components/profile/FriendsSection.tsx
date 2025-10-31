import { useState, useEffect } from 'react';
import { Users, UserPlus, UserMinus, X, Check, Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FriendsService } from '@/services/database';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Friend {
  id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
  friendshipId: string;
}

interface FriendRequest {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  created_at: string;
  requester?: {
    id: string;
    display_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

interface SearchResult {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  friendship_status: string;
}

export const FriendsSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // Load friends and friend requests
  useEffect(() => {
    loadFriendsData();
  }, [user]);

  const loadFriendsData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [friendsData, requestsData, sentData] = await Promise.all([
        FriendsService.getUserFriends(),
        FriendsService.getFriendRequests(),
        FriendsService.getSentFriendRequests()
      ]);

      // Map friends data to expected format
      const mappedFriends = friendsData.map((friend: any) => ({
        id: friend.id,
        display_name: friend.display_name,
        email: friend.email,
        avatar_url: friend.avatar_url,
        friendshipId: friend.friendship_id
      }));

      // Map requests data
      const mappedRequests = requestsData.map((request: any) => ({
        id: request.id,
        user_id: request.user_id,
        friend_id: user.id,
        status: 'pending',
        created_at: request.created_at,
        requester: {
          id: request.id,
          display_name: request.display_name,
          email: request.email,
          avatar_url: request.avatar_url
        }
      }));

      setFriends(mappedFriends);
      setFriendRequests(mappedRequests);
      setSentRequests(sentData as any); // Type assertion for now
    } catch (error) {
      console.error('Error loading friends data:', error);
      toast({
        title: "Error",
        description: "Failed to load friends data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const results = await FriendsService.searchUsers(searchTerm);
      setSearchResults(results as any); // Type assertion for now
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Search Error",
        description: "Failed to search users. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (friendId: string) => {
    try {
      await FriendsService.sendFriendRequest(friendId);
      toast({
        title: "Friend Request Sent",
        description: "Your friend request has been sent successfully.",
      });
      
      // Refresh data
      await loadFriendsData();
      // Update search results
      setSearchResults(prev => 
        prev.map(user => 
          user.id === friendId 
            ? { ...user, friendship_status: 'pending' }
            : user
        )
      );
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send friend request.",
        variant: "destructive"
      });
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await FriendsService.acceptFriendRequest(requestId);
      toast({
        title: "Friend Request Accepted",
        description: "You are now friends!",
      });
      await loadFriendsData();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast({
        title: "Error",
        description: "Failed to accept friend request.",
        variant: "destructive"
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await FriendsService.rejectFriendRequest(requestId);
      toast({
        title: "Friend Request Rejected",
        description: "The friend request has been rejected.",
      });
      await loadFriendsData();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      toast({
        title: "Error",
        description: "Failed to reject friend request.",
        variant: "destructive"
      });
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await FriendsService.cancelFriendRequest(requestId);
      toast({
        title: "Request Cancelled",
        description: "Your friend request has been cancelled.",
      });
      await loadFriendsData();
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      toast({
        title: "Error",
        description: "Failed to cancel friend request.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveFriend = async (friendshipId: string, friendName: string) => {
    if (!confirm(`Are you sure you want to remove ${friendName} from your friends?`)) {
      return;
    }

    try {
      await FriendsService.removeFriend(friendshipId);
      toast({
        title: "Friend Removed",
        description: `${friendName} has been removed from your friends.`,
      });
      await loadFriendsData();
    } catch (error) {
      console.error('Error removing friend:', error);
      toast({
        title: "Error",
        description: "Failed to remove friend.",
        variant: "destructive"
      });
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  const getDisplayName = (name: string | null, email: string) => {
    return name || email.split('@')[0];
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-md dark:bg-gray-800">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="animate-spin text-blue-500" size={32} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Search */}
      <Card className="border-0 shadow-md dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-800 dark:text-white">
            <Search size={20} className="mr-2 text-blue-500" />
            Find Friends
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <Button 
              onClick={handleSearch} 
              disabled={searching || !searchTerm.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {searching ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((result) => (
                <div 
                  key={result.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      {result.avatar_url ? (
                        <img 
                          src={result.avatar_url} 
                          alt="Avatar" 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-sm font-bold">
                          {getInitials(result.display_name, result.email)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        {getDisplayName(result.display_name, result.email)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{result.email}</p>
                    </div>
                  </div>

                  {result.id === user?.id ? (
                    <span className="text-xs text-gray-500 dark:text-gray-400">You</span>
                  ) : result.friendship_status === 'accepted' ? (
                    <span className="text-xs text-green-600 dark:text-green-400">Friends</span>
                  ) : result.friendship_status === 'pending' ? (
                    <span className="text-xs text-yellow-600 dark:text-yellow-400">Pending</span>
                  ) : (
                    <Button 
                      size="sm"
                      onClick={() => handleSendRequest(result.id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <UserPlus size={14} className="mr-1" />
                      Add
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {searchTerm && searchResults.length === 0 && !searching && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No users found matching "{searchTerm}"
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Friend Requests */}
        {friendRequests.length > 0 && (
          <Card className="border-0 shadow-md dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-800 dark:text-white">
                <UserPlus size={20} className="mr-2 text-green-500" />
                Friend Requests ({friendRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {friendRequests.map((request) => (
                <div 
                  key={request.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      {request.requester?.avatar_url ? (
                        <img 
                          src={request.requester.avatar_url} 
                          alt="Avatar" 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-sm font-bold">
                          {getInitials(request.requester?.display_name || null, request.requester?.email || '')}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        {getDisplayName(request.requester?.display_name || null, request.requester?.email || '')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {request.requester?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      onClick={() => handleAcceptRequest(request.id)}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <Check size={14} />
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectRequest(request.id)}
                      className="text-red-600 border-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Sent Requests */}
        {sentRequests.length > 0 && (
          <Card className="border-0 shadow-md dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-800 dark:text-white">
                <UserPlus size={20} className="mr-2 text-yellow-500" />
                Sent Requests ({sentRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sentRequests.map((request) => {
                // For sent requests, we need to get the receiver info
                const receiverEmail = request.friend_id; // This would be the friend's ID, need to handle this
                return (
                  <div 
                    key={request.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">?</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">
                          Pending Request
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => handleCancelRequest(request.id)}
                      className="text-gray-600 dark:text-gray-400"
                    >
                      <X size={14} className="mr-1" />
                      Cancel
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Friends List */}
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
    </div>
  );
};
