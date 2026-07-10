import { UserPlus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FriendRequest } from '@/hooks/useFriends';
import { getInitials, getDisplayName } from './FriendSearch';
import { useUserProfileModal } from '@/contexts/UserProfileModalContext';

interface FriendRequestsProps {
  friendRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  handleAcceptRequest: (requestId: string) => void;
  handleRejectRequest: (requestId: string) => void;
  handleCancelRequest: (requestId: string) => void;
}

export const FriendRequests = ({
  friendRequests,
  sentRequests,
  handleAcceptRequest,
  handleRejectRequest,
  handleCancelRequest
}: FriendRequestsProps) => {
  const { openProfile } = useUserProfileModal();
  const hasAny = friendRequests.length > 0 || sentRequests.length > 0;
  if (!hasAny) return null;

  return (
    <>
      {friendRequests.length > 0 && (
        <div className="rounded-xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Friend Requests</h3>
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
              {friendRequests.length}
            </span>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {friendRequests.map((request) => {
              const name = getDisplayName(request.requester?.display_name || null, request.requester?.email || '');
              const initials = getInitials(request.requester?.display_name || null, request.requester?.email || '');
              return (
                <div key={request.id} className="flex items-center gap-3 px-5 py-3">
                  <button
                    onClick={() => request.requester && openProfile(request.requester.id)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer focus:outline-none group"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0 group-hover:scale-105 active:scale-95 transition-transform">
                      {request.requester?.avatar_url ? (
                        <img src={request.requester.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-white text-xs font-semibold">{initials}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-white truncate group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">{name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{request.requester?.email}</p>
                    </div>
                  </button>
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleAcceptRequest(request.id)}
                      className="h-7 px-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs"
                    >
                      <Check size={12} className="mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRejectRequest(request.id)}
                      className="h-7 px-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <X size={12} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {sentRequests.length > 0 && (
        <div className="rounded-xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Sent Requests</h3>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {sentRequests.map((request) => (
              <div key={request.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-semibold">?</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-white">Pending</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Sent {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCancelRequest(request.id)}
                  className="h-7 px-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <X size={12} className="mr-1" />
                  Cancel
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
