import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  UserPlus,
  UserCheck,
  Clock,
  Users,
  MessageSquare,
  GraduationCap,
  BookOpen,
  Filter,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FriendsService } from '@/services/database';

type FriendStatus = 'none' | 'pending' | 'friends';

interface MockPerson {
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
}

type FilterOption = 'all' | 'friends' | 'pending';

export const FindFriendsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [people, setPeople] = useState<MockPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');

  useEffect(() => {
    let active = true;
    const fetchPeople = async () => {
      setLoading(true);
      try {
        const data = await FriendsService.searchUsers(searchQuery);
        if (!active) return;

        const mapped: MockPerson[] = data.map((d: any) => {
          const initials = d.display_name
            ? d.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
            : d.email[0].toUpperCase();

          let status: FriendStatus = 'none';
          if (d.friendship_status === 'accepted') {
            status = 'friends';
          } else if (d.friendship_status === 'pending') {
            status = 'pending';
          }

          return {
            id: d.id,
            name: d.display_name || d.email.split('@')[0],
            email: d.email,
            avatar: d.avatar_url,
            initials: initials,
            gradientFrom: d.gradient_from || 'from-blue-400',
            gradientTo: d.gradient_to || 'to-blue-600',
            major: d.major || 'Computer Science',
            year: d.year || '1st Year',
            mutualFriends: d.mutual_friends || 0,
            studyHours: d.study_hours || 0,
            status: status,
            bio: d.bio || 'No bio yet.',
            topSubjects: d.top_subjects || [],
            friendshipId: d.friendship_id
          };
        });
        setPeople(mapped);
      } catch (err) {
        console.error('Error loading people:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPeople();
    return () => {
      active = false;
    };
  }, [searchQuery]);

  const handleAddFriend = async (personId: string) => {
    try {
      const result = await FriendsService.sendFriendRequest(personId);
      setPeople((prev) =>
        prev.map((p) =>
          p.id === personId
            ? { ...p, status: 'pending' as FriendStatus, friendshipId: result?.id }
            : p
        )
      );
    } catch (err) {
      console.error('Error adding friend:', err);
    }
  };

  const handleCancelRequest = async (personId: string) => {
    const person = people.find((p) => p.id === personId);
    const friendshipId = person?.friendshipId;
    if (!friendshipId) return;

    try {
      await FriendsService.cancelFriendRequest(friendshipId);
      setPeople((prev) =>
        prev.map((p) =>
          p.id === personId
            ? { ...p, status: 'none' as FriendStatus, friendshipId: undefined }
            : p
        )
      );
    } catch (err) {
      console.error('Error canceling friend request:', err);
    }
  };

  const filteredPeople = useMemo(() => {
    let filtered = people;

    switch (activeFilter) {
      case 'friends':
        filtered = filtered.filter((p) => p.status === 'friends');
        break;
      case 'pending':
        filtered = filtered.filter((p) => p.status === 'pending');
        break;
    }

    return filtered;
  }, [people, activeFilter]);

  const stats = useMemo(
    () => ({
      total: people.length,
      friends: people.filter((p) => p.status === 'friends').length,
      pending: people.filter((p) => p.status === 'pending').length,
    }),
    [people]
  );

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
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
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
                  ? 'bg-blue-500 text-white shadow-sm'
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
          <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : filteredPeople.length === 0 ? (
        <div className="rounded-xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-900 p-12 text-center">
          <Users size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {searchQuery
              ? `No results for "${searchQuery}"`
              : 'No people match the current filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPeople.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              onAddFriend={handleAddFriend}
              onCancelRequest={handleCancelRequest}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Person Card ─── */

interface PersonCardProps {
  person: MockPerson;
  onAddFriend: (id: string) => void;
  onCancelRequest: (id: string) => void;
}

const PersonCard = ({ person, onAddFriend, onCancelRequest }: PersonCardProps) => {
  return (
    <div className="group rounded-xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-900 overflow-hidden transition-all hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/20 hover:border-gray-200 dark:hover:border-gray-600/60">
      {/* Gradient Banner */}
      <div
        className={`h-16 bg-gradient-to-r ${person.gradientFrom} ${person.gradientTo} relative`}
      >
        <div className="absolute -bottom-5 left-4">
          <div
            className={`w-11 h-11 rounded-full bg-gradient-to-br ${person.gradientFrom} ${person.gradientTo} flex items-center justify-center ring-3 ring-white dark:ring-gray-900 shadow-md`}
          >
            <span className="text-white text-sm font-bold">{person.initials}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-8 px-4 pb-4">
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {person.name}
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{person.email}</p>
          </div>
          {person.status === 'friends' && (
            <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
              <UserCheck size={10} />
              Friends
            </span>
          )}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 leading-relaxed">
          {person.bio}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <GraduationCap size={12} />
            {person.major}
          </span>
          <span>•</span>
          <span>{person.year}</span>
        </div>

        {/* Subjects */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {person.topSubjects.map((subject) => (
            <span
              key={subject}
              className="px-2 py-0.5 rounded-md bg-gray-50 dark:bg-gray-800 text-[10px] font-medium text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700/60"
            >
              {subject}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-800">
          <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-gray-500">
            {person.mutualFriends > 0 && (
              <span className="flex items-center gap-1">
                <Users size={11} />
                {person.mutualFriends} mutual
              </span>
            )}
            <span className="flex items-center gap-1">
              <BookOpen size={11} />
              {person.studyHours}h studied
            </span>
          </div>

          {person.status === 'none' && (
            <Button
              size="sm"
              onClick={() => onAddFriend(person.id)}
              className="h-7 px-3 text-xs bg-blue-500 hover:bg-blue-600 text-white shadow-sm transition-all hover:shadow-md"
            >
              <UserPlus size={12} className="mr-1" />
              Add
            </Button>
          )}
          {person.status === 'pending' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCancelRequest(person.id)}
              className="h-7 px-3 text-xs text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-700/50 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            >
              <Clock size={12} className="mr-1" />
              Pending
            </Button>
          )}
          {person.status === 'friends' && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-3 text-xs text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400"
            >
              <MessageSquare size={12} className="mr-1" />
              Message
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
