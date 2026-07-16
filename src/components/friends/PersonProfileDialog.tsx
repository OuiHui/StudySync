import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Person } from './types';
import { FriendsListView } from './FriendsListView';
import { ProfileView } from './ProfileView';
import { usePersonProfileData } from './usePersonProfileData';

interface PersonProfileDialogProps {
  person: Person | null;
  open: boolean;
  currentUserId: string;
  onClose: () => void;
  onAddFriend: (id: string) => void;
  onCancelRequest: (id: string) => void;
  onRequestSent?: (friendUserId: string) => void;
  loading?: boolean;
  onOpenProfile?: (userId: string) => void;
}

export const PersonProfileDialog = ({
  person,
  open,
  currentUserId,
  onClose,
  onAddFriend,
  onCancelRequest,
  onRequestSent,
  loading = false,
  onOpenProfile,
}: PersonProfileDialogProps) => {
  const [view, setView] = useState<'profile' | 'friends'>('profile');

  useEffect(() => {
    setView('profile');
  }, [person?.id, open]);

  const { friendsPreviews, sessions, loadingSessions } = usePersonProfileData(
    person?.id,
    open,
    view,
    currentUserId
  );

  if (loading || !person) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-white dark:bg-gray-900 border-0">
          <DialogTitle className="sr-only">Loading User Profile</DialogTitle>
          <DialogDescription className="sr-only">Please wait while the user profile details are loading.</DialogDescription>
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold">Loading profile...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogTitle className="sr-only">{person.name}'s Profile</DialogTitle>
        <DialogDescription className="sr-only">
          Detailed profile information for {person.name}, including their major, year, study groups, and friends.
        </DialogDescription>
        <div className="overflow-y-auto max-h-[85vh] p-5">
          {view === 'profile' ? (
            <ProfileView
              person={person}
              friendsPreviews={friendsPreviews}
              sessions={sessions}
              loadingSessions={loadingSessions}
              onViewAllFriends={() => setView('friends')}
              onAddFriend={onAddFriend}
              onCancelRequest={onCancelRequest}
              onOpenProfile={onOpenProfile}
            />
          ) : (
            <FriendsListView
              targetUserId={person.id}
              friendsCount={person.friendsCount}
              currentUserId={currentUserId}
              onBack={() => setView('profile')}
              onRequestSent={onRequestSent}
              onOpenProfile={onOpenProfile}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
