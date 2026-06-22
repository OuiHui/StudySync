import { Search, Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchResult } from '@/hooks/useFriends';

interface FriendSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searching: boolean;
  searchResults: SearchResult[];
  handleSearch: () => void;
  handleSendRequest: (friendId: string) => void;
  currentUserId: string | undefined;
}

export const getInitials = (name: string | null, email: string) => {
  if (name) {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  }
  return email[0].toUpperCase();
};

export const getDisplayName = (name: string | null, email: string) => {
  return name || email.split('@')[0];
};

export const FriendSearch = ({
  searchTerm,
  setSearchTerm,
  searching,
  searchResults,
  handleSearch,
  handleSendRequest,
  currentUserId
}: FriendSearchProps) => {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Find Friends</h3>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Search by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <Button 
            onClick={handleSearch} 
            disabled={searching || !searchTerm.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {searching ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {searchResults.map((result) => (
              <div 
                key={result.id} 
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center">
                    {result.avatar_url ? (
                      <img 
                        src={result.avatar_url} 
                        alt="Avatar" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-xs font-semibold">
                        {getInitials(result.display_name, result.email)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {getDisplayName(result.display_name, result.email)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{result.email}</p>
                  </div>
                </div>

                {result.id === currentUserId ? (
                  <span className="text-xs text-gray-500 dark:text-gray-400">You</span>
                ) : result.friendship_status === 'accepted' ? (
                  <span className="text-xs text-green-600 dark:text-green-400">Friends</span>
                ) : result.friendship_status === 'pending' ? (
                  <span className="text-xs text-yellow-600 dark:text-yellow-400">Pending</span>
                ) : (
                  <Button 
                    size="sm"
                    onClick={() => handleSendRequest(result.id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <UserPlus size={14} className="mr-1" />
                    Add
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {searchTerm && searchResults.length === 0 && !searching && (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-3">
            No users found for "{searchTerm}"
          </p>
        )}
      </div>
    </div>
  );
};
