import { FriendsQueries } from './queries';
import { FriendsMutations } from './mutations';

export class FriendsService {
  static searchUsers = FriendsQueries.searchUsers;
  static getUserFriends = FriendsQueries.getUserFriends;
  static getMutualFriends = FriendsQueries.getMutualFriends;
  static getFriendRequests = FriendsQueries.getFriendRequests;
  static getSentFriendRequests = FriendsQueries.getSentFriendRequests;
  static getUserProfile = FriendsQueries.getUserProfile;

  static sendFriendRequest = FriendsMutations.sendFriendRequest;
  static acceptFriendRequest = FriendsMutations.acceptFriendRequest;
  static rejectFriendRequest = FriendsMutations.rejectFriendRequest;
  static removeFriend = FriendsMutations.removeFriend;
  static cancelFriendRequest = FriendsMutations.cancelFriendRequest;
}

export { FriendsQueries, FriendsMutations };
