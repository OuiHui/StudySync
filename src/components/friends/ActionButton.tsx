import { UserPlus, Clock, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FriendStatus } from './types';

interface ActionButtonProps {
  status: FriendStatus;
  onAddFriend: () => void;
  onCancelRequest: () => void;
}

export const ActionButton = ({ status, onAddFriend, onCancelRequest }: ActionButtonProps) => {
  if (status === 'none') {
    return (
      <Button
        size="sm"
        onClick={onAddFriend}
        className="w-full h-9 text-sm bg-violet-600 hover:bg-violet-700 text-white font-bold"
      >
        <UserPlus size={14} className="mr-1.5" />
        Add Friend
      </Button>
    );
  }
  if (status === 'pending') {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={onCancelRequest}
        className="w-full h-9 text-sm text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-700/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 font-bold"
      >
        <Clock size={14} className="mr-1.5" />
        Pending
      </Button>
    );
  }
  if (status === 'friends') {
    return (
      <Button
        size="sm"
        variant="ghost"
        className="w-full h-9 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 border border-gray-100 dark:border-white/[0.08] font-bold"
      >
        <MessageSquare size={14} className="mr-1.5" />
        Message
      </Button>
    );
  }
  return null;
};
