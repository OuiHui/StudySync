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
    <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Find Friends</h3>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Search by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="bg-muted/60 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-brand"
          />
          <Button 
            onClick={handleSearch} 
            disabled={searching || !searchTerm.trim()}
            className="bg-brand hover:bg-brand-hover text-primary-foreground"
          >
            {searching ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {searchResults.map((result) => (
              <div 
                key={result.id} 
                className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border"
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
                    <p className="text-sm font-medium text-foreground">
                      {getDisplayName(result.display_name, result.email)}
                    </p>
                    <p className="text-xs text-muted-foreground">{result.email}</p>
                  </div>
                </div>

                {result.id === currentUserId ? (
                  <span className="text-xs text-muted-foreground">You</span>
                ) : result.friendship_status === 'accepted' ? (
                  <span className="text-xs text-emerald-500 font-semibold">Friends</span>
                ) : result.friendship_status === 'pending' ? (
                  <span className="text-xs text-amber-500 font-semibold">Pending</span>
                ) : (
                  <Button 
                    size="sm"
                    onClick={() => handleSendRequest(result.id)}
                    className="bg-brand hover:bg-brand-hover text-primary-foreground font-semibold"
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
          <p className="text-sm text-muted-foreground text-center py-3">
            No users found for &quot;{searchTerm}&quot;
          </p>
        )}
      </div>
    </div>
  );
};
