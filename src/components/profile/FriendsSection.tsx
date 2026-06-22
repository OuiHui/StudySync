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
      <div className="flex items-center justify-center py-10">
        <div className="w-5 h-5 border-2 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
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
