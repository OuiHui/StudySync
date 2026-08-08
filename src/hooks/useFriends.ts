import { useState, useEffect, useCallback } from 'react';
import { FriendsService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface Friend {
  id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
  friendshipId: string;
}

export interface FriendRequest {
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

export interface SearchResult {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  friendship_status: string;
}

export function useFriends() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const loadFriendsData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [friendsData, requestsData, sentData] = await Promise.all([
        FriendsService.getUserFriends(),
        FriendsService.getFriendRequests(),
        FriendsService.getSentFriendRequests()
      ]);

      const mappedFriends = friendsData.map((friend: any) => ({
        id: friend.user_id,
        display_name: friend.display_name,
        email: friend.email,
        avatar_url: friend.avatar_url,
        friendshipId: friend.friendship_id
      }));

      const mappedRequests = requestsData.map((request: any) => ({
        id: request.id,
        user_id: request.user_id,
        friend_id: user.id,
        status: 'pending',
        created_at: request.created_at,
        requester: {
          id: request.user_id,
          display_name: request.display_name,
          email: request.email,
          avatar_url: request.avatar_url
        }
      }));

      setFriends(mappedFriends);
      setFriendRequests(mappedRequests);
      setSentRequests(sentData || []);
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
  }, [user, toast]);

  useEffect(() => {
    if (!user) return;

    loadFriendsData();

    // Subscribe to realtime updates on the friendships table
    const channel = supabase
      .channel(`user_friendships:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships'
        },
        (payload) => {
          // If the payload concerns the current user, refresh the friends data
          const row = (payload.new && Object.keys(payload.new).length > 0 ? payload.new : payload.old) as { user_id?: string; friend_id?: string } | null;
          if (row && (row.user_id === user.id || row.friend_id === user.id)) {
            console.log('Realtime friendship update received, reloading...', payload);
            loadFriendsData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadFriendsData]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const results = await FriendsService.searchUsers(searchTerm);
      setSearchResults(results || []);
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
      setSearchResults(prev =>
        prev.map(u => (u.id === friendId ? { ...u, friendship_status: 'pending' } : u))
      );
      await FriendsService.sendFriendRequest(friendId);
      toast({
        title: "Friend Request Sent",
        description: "Your friend request has been sent successfully.",
      });
      await loadFriendsData();
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      await loadFriendsData();
      toast({
        title: "Error",
        description: error.message || "Failed to send friend request.",
        variant: "destructive"
      });
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    const targetRequest = friendRequests.find(r => r.id === requestId);
    const prevRequests = friendRequests;
    const prevFriends = friends;

    if (targetRequest && targetRequest.requester) {
      setFriendRequests(prev => prev.filter(r => r.id !== requestId));
      setFriends(prev => [
        ...prev,
        {
          id: targetRequest.requester!.id,
          display_name: targetRequest.requester!.display_name,
          email: targetRequest.requester!.email,
          avatar_url: targetRequest.requester!.avatar_url,
          friendshipId: requestId,
        }
      ]);
    }

    toast({
      title: "Friend Request Accepted",
      description: "You are now friends!",
    });

    try {
      await FriendsService.acceptFriendRequest(requestId);
      await loadFriendsData();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      setFriendRequests(prevRequests);
      setFriends(prevFriends);
      toast({
        title: "Error",
        description: "Failed to accept friend request.",
        variant: "destructive"
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const prevRequests = friendRequests;
    setFriendRequests(prev => prev.filter(r => r.id !== requestId));

    toast({
      title: "Friend Request Rejected",
      description: "The friend request has been rejected.",
    });

    try {
      await FriendsService.rejectFriendRequest(requestId);
      await loadFriendsData();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      setFriendRequests(prevRequests);
      toast({
        title: "Error",
        description: "Failed to reject friend request.",
        variant: "destructive"
      });
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    const prevSent = sentRequests;
    setSentRequests(prev => prev.filter(r => r.id !== requestId));

    toast({
      title: "Request Cancelled",
      description: "Your friend request has been cancelled.",
    });

    try {
      await FriendsService.cancelFriendRequest(requestId);
      await loadFriendsData();
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      setSentRequests(prevSent);
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

    const prevFriends = friends;
    setFriends(prev => prev.filter(f => f.friendshipId !== friendshipId));

    toast({
      title: "Friend Removed",
      description: `${friendName} has been removed from your friends.`,
    });

    try {
      await FriendsService.removeFriend(friendshipId);
      await loadFriendsData();
    } catch (error) {
      console.error('Error removing friend:', error);
      setFriends(prevFriends);
      toast({
        title: "Error",
        description: "Failed to remove friend.",
        variant: "destructive"
      });
    }
  };

  return {
    user,
    friends,
    friendRequests,
    sentRequests,
    searchResults,
    searchTerm,
    setSearchTerm,
    loading,
    searching,
    handleSearch,
    handleSendRequest,
    handleAcceptRequest,
    handleRejectRequest,
    handleCancelRequest,
    handleRemoveFriend,
  };
}
