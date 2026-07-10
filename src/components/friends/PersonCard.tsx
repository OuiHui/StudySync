import {
  BookOpen,
  GraduationCap,
  Clock,
  Users,
  UserPlus,
  UserCheck,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Person } from './types';
import { getAvatarGradient } from './avatarUtils';

interface PersonCardProps {
  person: Person;
  onAddFriend: (id: string) => void;
  onCancelRequest: (id: string) => void;
  onViewProfile: (person: Person) => void;
}

export const PersonCard = ({ person, onAddFriend, onCancelRequest, onViewProfile }: PersonCardProps) => {
  const gradient =
    person.gradientFrom && person.gradientTo
      ? `${person.gradientFrom} ${person.gradientTo}`
      : getAvatarGradient(person.name);

  const firstGroup = person.publicGroups[0];
  const extraGroups = person.publicGroups.length - 1;

  return (
    <div 
      onClick={() => onViewProfile(person)}
      className="flex flex-col rounded-xl border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-gray-800 transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-white/25 cursor-pointer max-w-sm sm:max-w-[320px] w-full mx-auto group"
    >
      {/* Header: avatar + name/email + friends badge */}
      <div className="px-4 pt-4 pb-3 flex items-start gap-3 relative">
        <div
          className={`w-11 h-11 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-sm`}
        >
          {person.avatar ? (
            <img src={person.avatar} alt={person.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-white text-sm font-bold">{person.initials}</span>
          )}
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{person.name}</h3>
            {person.status === 'friends' ? (
              <span className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">
                <UserCheck size={9} />
                Friend
              </span>
            ) : person.status === 'pending' ? (
              <span className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[9px] font-bold">
                <Clock size={9} />
                Pending
              </span>
            ) : null}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate mt-0.5">{person.email}</p>
        </div>

        {/* Click indicator */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-hover:text-violet-500 dark:group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all pl-2 shrink-0">
          <ChevronRight size={16} />
        </div>
      </div>

      {/* Info rows */}
      <div className="px-4 pb-3 space-y-1.5">
        <div className="flex items-center gap-2 text-[11px] text-gray-700 dark:text-gray-200 font-semibold">
          <span className="flex items-center gap-1">
            <BookOpen size={11} className="text-violet-500 dark:text-violet-400" />
            {person.major}
          </span>
          <span className="text-gray-300 dark:text-gray-700">•</span>
          <span className="flex items-center gap-1">
            <GraduationCap size={11} className="text-violet-500 dark:text-violet-400" />
            {person.year}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-gray-650 dark:text-gray-300 font-medium">
          <Users size={11} className="text-gray-400 dark:text-gray-500" />
          <span>{person.friendsCount} friends</span>
          <span className="text-gray-300 dark:text-gray-700">•</span>
          <span>{person.groupsCount} groups</span>
        </div>

        {firstGroup && (
          <div className="flex items-center gap-1 text-[11px] text-gray-650 dark:text-gray-300 font-medium">
            <Users size={11} className="shrink-0 text-gray-400 dark:text-gray-500" />
            <span className="truncate">{firstGroup}</span>
            {extraGroups > 0 && (
              <span className="shrink-0 text-violet-600 dark:text-violet-400 font-semibold ml-0.5">+{extraGroups} more</span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto px-4 py-3 border-t border-gray-100 dark:border-white/[0.08] flex items-center justify-between bg-gray-50/50 dark:bg-black/20">
        <div className="flex items-center gap-1 text-[11px] text-gray-700 dark:text-gray-200 font-semibold">
          <Clock size={11} className="text-violet-500 dark:text-violet-400" />
          {person.studyHours}h studied
        </div>

        {person.status === 'none' && (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAddFriend(person.id);
            }}
            className="h-7 px-3 text-xs bg-violet-600 hover:bg-violet-700 text-white shadow-sm font-semibold"
          >
            <UserPlus size={12} className="mr-1" />
            Add
          </Button>
        )}
        {person.status === 'pending' && (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onCancelRequest(person.id);
            }}
            className="h-7 px-3 text-xs text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-700/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 font-semibold"
          >
            <Clock size={12} className="mr-1" />
            Pending
          </Button>
        )}
        {person.status === 'friends' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              // Standard message action
            }}
            className="h-7 px-3 text-xs text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 font-semibold"
          >
            <MessageSquare size={12} className="mr-1" />
            Message
          </Button>
        )}
      </div>
    </div>
  );
};
