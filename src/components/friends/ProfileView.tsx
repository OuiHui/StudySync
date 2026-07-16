import React, { useState } from 'react';
import {
  BookOpen,
  GraduationCap,
  Clock,
  Users,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Calendar,
  Loader2,
} from 'lucide-react';
import { Person, FriendEntry } from './types';
import { getInitials, getAvatarColor } from './avatarUtils';
import { ActionButton } from './ActionButton';
import { SessionEntry } from './usePersonProfileData';

interface ProfileViewProps {
  person: Person;
  friendsPreviews: FriendEntry[];
  sessions: SessionEntry[];
  loadingSessions: boolean;
  onViewAllFriends: () => void;
  onAddFriend: (id: string) => void;
  onCancelRequest: (id: string) => void;
  onOpenProfile?: (userId: string) => void;
}

const GROUPS_PAGE_SIZE = 6;

const formatSessionTime = (isoString: string) => {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' @ ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return 'Upcoming';
  }
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200 mb-1.5">
    {children}
  </p>
);

export const ProfileView = ({
  person,
  friendsPreviews,
  sessions,
  loadingSessions,
  onViewAllFriends,
  onAddFriend,
  onCancelRequest,
  onOpenProfile,
}: ProfileViewProps) => {
  const [groupsExpanded, setGroupsExpanded] = useState(false);
  const avatarBg = getAvatarColor(person.name);

  const visibleGroups = groupsExpanded
    ? person.publicGroups
    : person.publicGroups.slice(0, GROUPS_PAGE_SIZE);
  const extraGroups = person.publicGroups.length - GROUPS_PAGE_SIZE;

  return (
    <>
      {/* Header: avatar + name/email/button */}
      <div className="flex gap-4 mb-5">
        <div
          className={`w-16 h-16 rounded-full ${avatarBg} text-white flex items-center justify-center shrink-0 shadow-md`}
        >
          {person.avatar ? (
            <img src={person.avatar} alt={person.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-white text-2xl font-bold">{person.initials}</span>
          )}
        </div>

        {/* Name + email + wide action button */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight truncate">
              {person.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{person.email}</p>
          </div>

          <ActionButton
            status={person.status}
            onAddFriend={() => onAddFriend(person.id)}
            onCancelRequest={() => onCancelRequest(person.id)}
          />
        </div>
      </div>

      {/* Info row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-gray-600 dark:text-gray-300 mb-6 font-semibold">
        <span className="flex items-center gap-1.5">
          <BookOpen size={13} className="text-violet-500" />
          {person.major}
        </span>
        <span className="text-gray-300 dark:text-gray-700">•</span>
        <span className="flex items-center gap-1.5">
          <GraduationCap size={13} className="text-violet-500" />
          {person.year}
        </span>
        <span className="text-gray-300 dark:text-gray-700">•</span>
        <span className="flex items-center gap-1.5">
          <Clock size={13} className="text-violet-500" />
          {person.studyHours}h studied
        </span>
      </div>

      {/* About */}
      <section className="mb-6">
        <SectionLabel>About</SectionLabel>
        {person.bio ? (
          <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
            {person.bio}
          </p>
        ) : (
          <p className="text-sm italic text-gray-400 dark:text-gray-500 leading-relaxed font-medium">
            No bio available.
          </p>
        )}
      </section>

      {/* Friends */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2.5">
          <SectionLabel>Friends ({person.friendsCount})</SectionLabel>
          {person.friendsCount > 0 && (
            <button
              onClick={onViewAllFriends}
              className="flex items-center gap-0.5 text-xs text-violet-500 hover:text-violet-600 dark:text-violet-400 dark:hover:text-violet-300 transition-colors font-bold"
            >
              View all <ChevronRight size={13} />
            </button>
          )}
        </div>
        {friendsPreviews.length > 0 ? (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {friendsPreviews.map((f) => {
                const bgClass = getAvatarColor(f.display_name);
                const ini = getInitials(f.display_name);
                return (
                  <button
                    key={f.friend_user_id}
                    onClick={() => onOpenProfile?.(f.friend_user_id)}
                    className={`w-9 h-9 rounded-full ${bgClass} text-white flex items-center justify-center ring-2 ring-white dark:ring-gray-900 shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-transform focus:outline-none`}
                    title={f.display_name}
                  >
                    {f.avatar_url ? (
                      <img src={f.avatar_url} alt={f.display_name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-white text-xs font-bold">{ini}</span>
                    )}
                  </button>
                );
              })}

              {person.friendsCount > 5 && (
                <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center ring-2 ring-white dark:ring-gray-900 shrink-0">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                    +{person.friendsCount - 5}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-500">No friends yet.</p>
        )}
      </section>

      {/* Study Groups */}
      <section className="mb-6">
        <SectionLabel>Study Groups ({person.groupsCount})</SectionLabel>
        {person.publicGroups.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-2">
            {visibleGroups.map((group) => (
              <span
                key={group}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-white/[0.05] border border-gray-100 dark:border-white/[0.06] text-xs text-gray-800 dark:text-gray-200 font-semibold"
              >
                <Users size={12} className="text-violet-500 shrink-0" />
                {group}
              </span>
            ))}
            {person.publicGroups.length > GROUPS_PAGE_SIZE && (
              <button
                onClick={() => setGroupsExpanded(!groupsExpanded)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-white/[0.07] border border-gray-200 dark:border-white/[0.08] text-xs text-violet-500 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-colors font-semibold"
              >
                {groupsExpanded ? (
                  <>Show less <ChevronUp size={12} /></>
                ) : (
                  <>+{extraGroups} more <ChevronDown size={12} /></>
                )}
              </button>
            )}
          </div>
        ) : (
          <p className="text-sm italic text-gray-400 dark:text-gray-500 leading-relaxed font-medium mt-1">
            No public study groups joined.
          </p>
        )}
      </section>

      {/* Study Sessions */}
      <section className="mb-2">
        <SectionLabel>Study Sessions</SectionLabel>
        {loadingSessions ? (
          <div className="flex items-center gap-2 py-2">
            <Loader2 size={14} className="animate-spin text-gray-400 dark:text-gray-500" />
            <span className="text-xs text-gray-400 dark:text-gray-500">Loading sessions...</span>
          </div>
        ) : sessions.length > 0 ? (
          <div className="space-y-2 mt-2">
            {sessions.slice(0, 4).map((session) => (
              <div
                key={session.id}
                className="flex items-start justify-between p-3 rounded-lg bg-gray-50/50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.04]"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {session.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
                    <span className="flex items-center gap-0.5">
                      <Calendar size={11} className="text-violet-500" />
                      {formatSessionTime(session.scheduled_start)}
                    </span>
                    {session.group_name && (
                      <>
                        <span className="text-gray-300 dark:text-gray-700">•</span>
                        <span className="truncate">{session.group_name}</span>
                      </>
                    )}
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase shrink-0 ${
                  session.status === 'active' || session.status === 'running'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : session.status === 'completed' || session.status === 'finished'
                    ? 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400'
                    : 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                }`}>
                  {session.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm italic text-gray-400 dark:text-gray-500 leading-relaxed font-medium mt-1">
            No scheduled study sessions.
          </p>
        )}
      </section>
    </>
  );
};
