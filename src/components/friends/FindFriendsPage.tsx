import { useState, useMemo, useEffect } from 'react';
import { Search, Users, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FriendsService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { PersonCard } from './PersonCard';
import { PersonProfileDialog } from './PersonProfileDialog';
import { Person, FriendStatus } from './types';
import { getInitials } from './avatarUtils';

type FilterOption = 'all' | 'friends' | 'pending';

const mapToPerson = (d: any): Person => {
  const name = d.display_name || d.email.split('@')[0];
  let status: FriendStatus = 'none';
  if (d.friendship_status === 'accepted') status = 'friends';
  else if (d.friendship_status === 'pending') status = 'pending';

  return {
    id: d.id,
    name,
    email: d.email,
    avatar: d.avatar_url,
    initials: getInitials(name),
    gradientFrom: d.gradient_from || 'from-blue-400',
    gradientTo: d.gradient_to || 'to-blue-600',
    major: d.major || 'Computer Science',
    year: d.year || '1st Year',
    mutualFriends: d.mutual_friends || 0,
    studyHours: d.study_hours || 0,
    status,
    bio: d.bio || '',
    topSubjects: d.top_subjects || [],
    friendshipId: d.friendship_id,
    friendsCount: d.friends_count || 0,
    groupsCount: d.groups_count || 0,
    publicGroups: d.public_groups || [],
  };
};

export const FindFriendsPage = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const handleOpenProfile = async (userId: string) => {
    if (!user) return;
    if (userId === user.id) return;

    setSelectedPerson(null);
    setLoadingProfile(true);
    try {
      const personData = await FriendsService.getUserProfile(userId, user.id);
      if (personData) {
        setSelectedPerson(personData);
      }
    } catch (err) {
      console.error('Error opening user profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    let active = true;
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await FriendsService.searchUsers(searchQuery);
        if (active) setPeople(data.map(mapToPerson));
      } catch (err) {
        console.error('Error loading people:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetch();
    return () => { active = false; };
  }, [searchQuery]);

  const handleAddFriend = async (personId: string) => {
    try {
      const result = await FriendsService.sendFriendRequest(personId);
      setPeople((prev) =>
        prev.map((p) => p.id === personId ? { ...p, status: 'pending', friendshipId: result?.id } : p)
      );
      setSelectedPerson((prev) =>
        prev?.id === personId ? { ...prev, status: 'pending', friendshipId: result?.id } : prev
      );
    } catch (err) {
      console.error('Error adding friend:', err);
    }
  };

  const handleCancelRequest = async (personId: string) => {
    const person = people.find((p) => p.id === personId);
    if (!person?.friendshipId) return;
    try {
      await FriendsService.cancelFriendRequest(person.friendshipId);
      setPeople((prev) =>
        prev.map((p) => p.id === personId ? { ...p, status: 'none', friendshipId: undefined } : p)
      );
      setSelectedPerson((prev) =>
        prev?.id === personId ? { ...prev, status: 'none', friendshipId: undefined } : prev
      );
    } catch (err) {
      console.error('Error canceling friend request:', err);
    }
  };

  const filteredPeople = useMemo(() => {
    if (activeFilter === 'friends') return people.filter((p) => p.status === 'friends');
    if (activeFilter === 'pending') return people.filter((p) => p.status === 'pending');
    return people;
  }, [people, activeFilter]);

  const stats = useMemo(() => ({
    total: people.length,
    friends: people.filter((p) => p.status === 'friends').length,
    pending: people.filter((p) => p.status === 'pending').length,
  }), [people]);

  const filters: { id: FilterOption; label: string; count: number }[] = [
    { id: 'all', label: 'All People', count: stats.total },
    { id: 'friends', label: 'Friends', count: stats.friends },
    { id: 'pending', label: 'Pending', count: stats.pending },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Find Friends</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Connect with fellow students and build your study network
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
          />
          <Input
            type="text"
            placeholder="Search by name, email, or major..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 dark:bg-gray-800/60 dark:border-gray-700 dark:text-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeFilter === f.id
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Filter size={12} />
              {f.label}
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeFilter === f.id
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* People Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-700 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : filteredPeople.length === 0 ? (
        <div className="rounded-xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-900 p-12 text-center">
          <Users size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {searchQuery ? `No results for "${searchQuery}"` : 'No people match the current filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPeople.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              onAddFriend={handleAddFriend}
              onCancelRequest={handleCancelRequest}
              onViewProfile={setSelectedPerson}
            />
          ))}
        </div>
      )}

      {/* Profile dialog */}
      <PersonProfileDialog
        person={selectedPerson}
        open={!!selectedPerson}
        currentUserId={user?.id ?? ''}
        onClose={() => setSelectedPerson(null)}
        onAddFriend={handleAddFriend}
        onCancelRequest={handleCancelRequest}
        onRequestSent={(friendUserId) =>
          setPeople((prev) =>
            prev.map((p) => p.id === friendUserId ? { ...p, status: 'pending' } : p)
          )
        }
        loading={loadingProfile}
        onOpenProfile={handleOpenProfile}
      />
    </div>
  );
};
