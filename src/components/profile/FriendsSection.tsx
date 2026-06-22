import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useFriends } from '@/hooks/useFriends';

import { FriendSearch } from './FriendSearch';
import { FriendRequests } from './FriendRequests';
import { FriendsList } from './FriendsList';

export const FriendsSection = () => {
  const {
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
  } = useFriends();

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
      <FriendSearch
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searching={searching}
        searchResults={searchResults}
        handleSearch={handleSearch}
        handleSendRequest={handleSendRequest}
        currentUserId={user?.id}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FriendRequests
          friendRequests={friendRequests}
          sentRequests={sentRequests}
          handleAcceptRequest={handleAcceptRequest}
          handleRejectRequest={handleRejectRequest}
          handleCancelRequest={handleCancelRequest}
        />
      </div>

      <FriendsList
        friends={friends}
        handleRemoveFriend={handleRemoveFriend}
      />
    </div>
  );
};
