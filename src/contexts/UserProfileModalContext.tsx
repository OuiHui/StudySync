import React, { createContext, useContext, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FriendsService } from '@/services/database';
import { PersonProfileDialog } from '@/components/friends/PersonProfileDialog';
import { Person } from '@/components/friends/types';
import { useToast } from '@/hooks/use-toast';

interface UserProfileModalContextType {
  openProfile: (userId: string) => Promise<void>;
  closeProfile: () => void;
}

const UserProfileModalContext = createContext<UserProfileModalContextType | undefined>(undefined);

export const UserProfileModalProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(false);

  const openProfile = async (userId: string) => {
    if (!user) return;
    
    // If clicking on themselves, don't open the modal or show a message
    if (userId === user.id) {
      toast({
        title: "This is you!",
        description: "You are viewing your own session/message. Go to the Profile tab to edit your details.",
      });
      return;
    }

    setIsOpen(true);
    setLoading(true);
    setSelectedPerson(null);

    try {
      const personData = await FriendsService.getUserProfile(userId, user.id);
      if (personData) {
        setSelectedPerson(personData);
      } else {
        toast({
          title: "Error",
          description: "Could not load user profile details.",
          variant: "destructive"
        });
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast({
        title: "Error",
        description: "Failed to load user profile.",
        variant: "destructive"
      });
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const closeProfile = () => {
    setIsOpen(false);
    setSelectedPerson(null);
  };

  const handleAddFriend = async (personId: string) => {
    try {
      const result = await FriendsService.sendFriendRequest(personId);
      setSelectedPerson((prev) =>
        prev?.id === personId ? { ...prev, status: 'pending', friendshipId: result?.id } : prev
      );
      toast({
        title: "Request Sent",
        description: "Friend request sent successfully.",
      });
      
      // Emit event for other components to listen to changes if needed
      window.dispatchEvent(new CustomEvent('friendship-changed', { detail: { userId: personId, status: 'pending', friendshipId: result?.id } }));
    } catch (err) {
      console.error('Error adding friend:', err);
      toast({
        title: "Error",
        description: "Could not send friend request. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCancelRequest = async (personId: string) => {
    if (!selectedPerson?.friendshipId) return;
    try {
      await FriendsService.cancelFriendRequest(selectedPerson.friendshipId);
      setSelectedPerson((prev) =>
        prev?.id === personId ? { ...prev, status: 'none', friendshipId: undefined } : prev
      );
      toast({
        title: "Request Canceled",
        description: "Friend request canceled.",
      });
      
      window.dispatchEvent(new CustomEvent('friendship-changed', { detail: { userId: personId, status: 'none', friendshipId: undefined } }));
    } catch (err) {
      console.error('Error canceling friend request:', err);
      toast({
        title: "Error",
        description: "Could not cancel friend request. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <UserProfileModalContext.Provider value={{ openProfile, closeProfile }}>
      {children}
      <PersonProfileDialog
        person={selectedPerson}
        open={isOpen}
        currentUserId={user?.id ?? ''}
        onClose={closeProfile}
        onAddFriend={handleAddFriend}
        onCancelRequest={handleCancelRequest}
        // We'll update the Dialog to handle a loading state
        loading={loading}
      />
    </UserProfileModalContext.Provider>
  );
};

export const useUserProfileModal = () => {
  const context = useContext(UserProfileModalContext);
  if (context === undefined) {
    throw new Error('useUserProfileModal must be used within a UserProfileModalProvider');
  }
  return context;
};
