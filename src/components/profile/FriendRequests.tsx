import { UserPlus, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FriendRequest } from '@/hooks/useFriends';
import { getInitials, getDisplayName } from './FriendSearch';

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
  return (
    <>
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
    </>
  );
};
