export type FriendStatus = 'none' | 'pending' | 'friends';

export interface Person {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  initials: string;
  gradientFrom: string;
  gradientTo: string;
  major: string;
  year: string;
  mutualFriends: number;
  studyHours: number;
  status: FriendStatus;
  bio: string;
  topSubjects: string[];
  friendshipId?: string;
  friendsCount: number;
  groupsCount: number;
  publicGroups: string[];
}

export interface FriendEntry {
  friend_user_id: string;
  display_name: string;
  email: string;
  major: string;
  gradient_from: string;
  gradient_to: string;
  avatar_url: string | null;
  is_mutual: boolean;
  friendship_status?: string;
  friendship_id?: string;
}
